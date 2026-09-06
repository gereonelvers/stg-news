import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <NativeTabs
      tintColor={colors.tint}
      iconColor={{ default: colors.textSecondary, selected: colors.tint }}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.tint } }}
      minimizeBehavior="onScrollDown"
      backgroundColor={Platform.OS === 'android' ? colors.bgElevated : undefined}
      indicatorColor={colors.tintSoft}
      rippleColor={colors.tintSoft}
      labelVisibilityMode="labeled"
      disableTransparentOnScrollEdge={false}>
      <NativeTabs.Trigger name="(start)">
        <NativeTabs.Trigger.Label>Start</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} md="newspaper" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ressorts">
        <NativeTabs.Trigger.Label>Ressorts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="gemerkt">
        <NativeTabs.Trigger.Label>Gemerkt</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} md="bookmark" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="redaktion">
        <NativeTabs.Trigger.Label>Redaktion</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="suche" role="search">
        <NativeTabs.Trigger.Label>Suche</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export const unstable_settings = { initialRouteName: '(start)' };
