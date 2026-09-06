import { StyleSheet, View } from 'react-native';

import { gutter, space } from '@/theme/tokens';
import { Button } from './Button';
import { Txt } from './Txt';

type Props = {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji = '📰', title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Txt style={styles.emoji}>{emoji}</Txt>
      <Txt variant="headline" align="center">
        {title}
      </Txt>
      {message ? (
        <Txt variant="bodySmall" color="textSecondary" align="center" style={{ maxWidth: 320 }}>
          {message}
        </Txt>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingHorizontal: gutter, paddingVertical: space.xxxl },
  emoji: { fontSize: 44, lineHeight: 52, marginBottom: space.xs },
});
