import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { FlatList, Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BlockImage } from '@/api/html/types';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { inlineText } from '@/api/html/parse';
import { space } from '@/theme/tokens';

type Props = {
  images: BlockImage[];
  index: number | null;
  onClose: () => void;
};

export function Lightbox({ images, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<BlockImage>>(null);
  const [current, setCurrent] = useState(index ?? 0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const visible = index !== null;

  useEffect(() => {
    if (index !== null) {
      setCurrent(index);
      setChromeVisible(true);
    }
  }, [index]);

  const onScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width)),
    [width],
  );

  const caption = images[current]?.caption ? inlineText(images[current].caption!) : images[current]?.alt;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent presentationStyle="overFullScreen" transparent={false}>
      <GestureHandlerRootView style={styles.root}>
        {Platform.OS === 'android' && <StatusBar barStyle="light-content" backgroundColor="#000" />}
        <FlatList
          ref={list}
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(img, i) => `${img.full}-${i}`}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!zoomed}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item }) => (
            <ZoomableImage image={item} width={width} height={height} onToggleChrome={() => setChromeVisible((v) => !v)} onDismiss={onClose} onZoomChange={setZoomed} />
          )}
        />
        {chromeVisible && (
          <>
            <View style={[styles.top, { paddingTop: insets.top + space.sm }]} pointerEvents="box-none">
              <Txt variant="label" style={styles.counter}>
                {current + 1} / {images.length}
              </Txt>
              <Tap onPress={onClose} style={styles.close} haptics="light" accessibilityLabel="Schließen" accessibilityRole="button">
                <Icon name="close" size={18} color="#FFFFFF" weight="bold" />
              </Tap>
            </View>
            {caption ? (
              <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]} pointerEvents="none">
                <Txt variant="bodySmall" style={styles.caption}>
                  {caption}
                </Txt>
              </View>
            ) : null}
          </>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomableImage({ image, width, height, onToggleChrome, onDismiss, onZoomChange }: { image: BlockImage; width: number; height: number; onToggleChrome: () => void; onDismiss: () => void; onZoomChange: (zoomed: boolean) => void }) {
  const [zoomed, setZoomed] = useState(false);
  const setZoom = (z: boolean) => {
    setZoomed(z);
    onZoomChange(z);
  };
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const reset = () => {
    'worklet';
    scale.value = withSpring(1);
    savedScale.value = 1;
    tx.value = withSpring(0);
    ty.value = withSpring(0);
    savedTx.value = 0;
    savedTy.value = 0;
    runOnJS(setZoom)(false);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) reset();
      else runOnJS(setZoom)(true);
    });

  const basePan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      } else {
        ty.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        const maxX = ((scale.value - 1) * width) / 2;
        const maxY = ((scale.value - 1) * height) / 2;
        tx.value = withSpring(Math.min(Math.max(tx.value, -maxX), maxX));
        ty.value = withSpring(Math.min(Math.max(ty.value, -maxY), maxY));
        savedTx.value = tx.value;
        savedTy.value = ty.value;
      } else if (Math.abs(e.translationY) > 110 || Math.abs(e.velocityY) > 900) {
        ty.value = withTiming(e.translationY > 0 ? height : -height, { duration: 180 }, () => runOnJS(onDismiss)());
      } else {
        ty.value = withSpring(0);
      }
    })
;
  // Not zoomed: only vertical drags (dismiss) – horizontal swipes go to the pager.
  const pan = zoomed ? basePan.activeOffsetX([-4, 4]).activeOffsetY([-4, 4]) : basePan.activeOffsetY([-14, 14]).failOffsetX([-14, 14]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        reset();
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
        tx.value = withSpring((width / 2 - e.x) * 1.5);
        ty.value = withSpring((height / 2 - e.y) * 1.5);
        savedTx.value = (width / 2 - e.x) * 1.5;
        savedTy.value = (height / 2 - e.y) * 1.5;
        runOnJS(setZoom)(true);
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => runOnJS(onToggleChrome)());

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    opacity: scale.value > 1 ? 1 : 1 - Math.min(Math.abs(ty.value) / (height * 0.8), 0.6),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Image
          source={{ uri: image.full }}
          placeholder={{ uri: image.src }}
          style={{ width, height }}
          contentFit="contain"
          transition={200}
          cachePolicy="disk"
          accessibilityLabel={image.alt}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg },
  counter: { color: 'rgba(255,255,255,0.85)' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: space.xl, backgroundColor: 'rgba(0,0,0,0.35)', paddingTop: space.md },
  caption: { color: 'rgba(255,255,255,0.92)', textAlign: 'center' },
});
