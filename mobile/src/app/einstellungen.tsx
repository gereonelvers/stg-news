import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { useCategories, useConfig } from '@/api/queries';
import { useLinkHandler } from '@/components/article/useLinkHandler';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Group, Row, Separator } from '@/components/ui/Row';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { withAlpha } from '@/lib/colors';
import { haptic } from '@/lib/haptics';
import { PushUnavailableError, disablePush, enablePush, updatePushCategories } from '@/lib/notifications';
import { TEXT_SCALES, useSettings, type Appearance } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, gutter, radius, space } from '@/theme/tokens';

const APPEARANCES: { value: Appearance; label: string; icon: IconName }[] = [
  { value: 'system', label: 'Automatisch', icon: 'auto' },
  { value: 'light', label: 'Hell', icon: 'sun' },
  { value: 'dark', label: 'Dunkel', icon: 'moon' },
];

export default function EinstellungenScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const settings = useSettings();
  const config = useConfig();
  const categories = useCategories();
  const openLink = useLinkHandler();
  const [busy, setBusy] = useState(false);

  const scaleIndex = Math.max(0, TEXT_SCALES.findIndex((s) => Math.abs(s - settings.textScale) < 0.01));

  const togglePush = async (on: boolean) => {
    setBusy(true);
    try {
      if (on) {
        await enablePush(settings.notificationCategories);
        settings.setNotificationsEnabled(true);
        haptic.success();
      } else {
        await disablePush();
        settings.setNotificationsEnabled(false);
      }
    } catch (e) {
      settings.setNotificationsEnabled(false);
      Alert.alert('Mitteilungen', e instanceof PushUnavailableError ? e.message : 'Das hat leider nicht geklappt. Versuch es später nochmal.');
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = async (id: number) => {
    const all = categories.data?.map((c) => c.id) ?? [];
    const current = settings.notificationCategories ?? all;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    const value = next.length >= all.length ? null : next;
    settings.setNotificationCategories(value);
    haptic.selection();
    if (settings.notificationsEnabled) updatePushCategories(value).catch(() => undefined);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Einstellungen',
          headerLeft: Platform.OS === 'ios' ? () => (
            <Tap onPress={() => router.back()} hitSlop={8} dim scaleTo={1} accessibilityRole="button" accessibilityLabel="Fertig">
              <Txt variant="label" color="tint">
                Fertig
              </Txt>
            </Tap>
          ) : undefined,
        }}
      />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: space.xxxl }} contentInsetAdjustmentBehavior="automatic">
        <Group title="Darstellung">
          <View style={styles.segment}>
            {APPEARANCES.map((a) => {
              const active = settings.appearance === a.value;
              return (
                <Tap
                  key={a.value}
                  onPress={() => {
                    settings.setAppearance(a.value);
                    haptic.selection();
                  }}
                  scaleTo={0.96}
                  style={[styles.segmentItem, { backgroundColor: active ? colors.bgElevated : 'transparent', borderColor: active ? colors.border : 'transparent' }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}>
                  <Icon name={a.icon} size={18} color={active ? colors.tint : colors.textSecondary} />
                  <Txt variant="caption" style={{ fontWeight: active ? '600' : '400', color: active ? colors.text : colors.textSecondary }}>
                    {a.label}
                  </Txt>
                </Tap>
              );
            })}
          </View>
          <Separator inset={space.lg} />
          <View style={styles.textSize}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodySmall" style={{ fontWeight: '500' }}>
                Textgröße
              </Txt>
              <Txt variant="caption" color="textSecondary">
                Gilt für Artikeltexte
              </Txt>
            </View>
            <View style={styles.stepper}>
              <Tap onPress={() => settings.setTextScale(TEXT_SCALES[Math.max(0, scaleIndex - 1)])} disabled={scaleIndex === 0} hitSlop={6} style={[styles.stepBtn, { backgroundColor: colors.surface2, opacity: scaleIndex === 0 ? 0.4 : 1 }]} accessibilityRole="button" accessibilityLabel="Kleiner">
                <Icon name="textDown" size={16} color="text" />
              </Tap>
              <Txt variant="label" style={{ minWidth: 44, textAlign: 'center' }}>
                {Math.round(settings.textScale * 100)}%
              </Txt>
              <Tap onPress={() => settings.setTextScale(TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, scaleIndex + 1)])} disabled={scaleIndex === TEXT_SCALES.length - 1} hitSlop={6} style={[styles.stepBtn, { backgroundColor: colors.surface2, opacity: scaleIndex === TEXT_SCALES.length - 1 ? 0.4 : 1 }]} accessibilityRole="button" accessibilityLabel="Größer">
                <Icon name="textUp" size={16} color="text" />
              </Tap>
            </View>
          </View>
          <View style={[styles.preview, { backgroundColor: colors.bgElevated, borderColor: colors.border }]}>
            <Txt variant="body" scaled>
              So sieht ein Artikeltext aus. Die Schülerzeitung erscheint seit 2018 online.
            </Txt>
          </View>
        </Group>

        <Group title="Mitteilungen">
          <Row
            title="Neue Artikel"
            subtitle={settings.notificationsEnabled ? 'Du bekommst eine Mitteilung, wenn ein Artikel erscheint.' : 'Erfahre sofort, wenn etwas Neues erscheint.'}
            icon="bell"
            iconColor={brand.crimson}
            right={<Switch value={settings.notificationsEnabled} onValueChange={togglePush} disabled={busy} trackColor={{ true: colors.tint }} />}
          />
          {settings.notificationsEnabled && categories.data ? (
            <>
              <Separator inset={space.lg} />
              <View style={styles.catWrap}>
                <Txt variant="caption" color="textSecondary" style={{ marginBottom: space.sm }}>
                  Nur für diese Ressorts:
                </Txt>
                <View style={styles.chips}>
                  {categories.data.map((c) => {
                    const on = settings.notificationCategories === null || settings.notificationCategories.includes(c.id);
                    return (
                      <Tap key={c.id} onPress={() => toggleCategory(c.id)} scaleTo={0.94} style={[styles.catChip, { backgroundColor: on ? withAlpha(c.color, 0.16) : colors.surface2, borderColor: on ? c.color : 'transparent' }]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                        <Txt variant="chip" numberOfLines={1} style={{ color: on ? c.color : colors.textTertiary, flexShrink: 0 }}>
                          {c.emoji} {c.name}
                        </Txt>
                      </Tap>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}
        </Group>

        <Group title="Schülerzeitung">
          <Row title="Über uns" icon="info" onPress={() => router.push({ pathname: '/seite/[slug]', params: { slug: 'ueber-uns' } })} chevron />
          <Separator inset={64} />
          <Row title="Website" subtitle="stg-sz.net" icon="globe" onPress={() => openLink(config.data?.site.url ?? 'https://stg-sz.net')} chevron />
          <Separator inset={64} />
          <Row title="Instagram" subtitle="@stg_schuelerzeitung" icon="camera" onPress={() => openLink(config.data?.site.instagram ?? 'https://www.instagram.com/stg_schuelerzeitung/')} chevron />
          <Separator inset={64} />
          <Row title="Städtisches Gymnasium Bad Segeberg" icon="school" onPress={() => openLink(config.data?.site.school_url ?? 'https://stg-segeberg.de')} chevron />
        </Group>

        <Group title="Rechtliches">
          <Row title="Datenschutz" icon="shield" onPress={() => router.push({ pathname: '/seite/[slug]', params: { slug: 'datenschutzerklaerung' } })} chevron />
          <Separator inset={64} />
          <Row title="Impressum" icon="file" onPress={() => router.push({ pathname: '/seite/[slug]', params: { slug: 'ueber-uns' } })} chevron />
        </Group>

        <Group title="App">
          <Row title="Version" subtitle={`${Constants.expoConfig?.version ?? '2.0.0'} · Open Source auf GitHub`} icon="sparkle" onPress={() => openLink('https://github.com/gereonelvers/stg-news')} chevron />
        </Group>

        <Txt variant="caption" color="textTertiary" align="center" style={{ marginTop: space.xl, paddingHorizontal: gutter }}>
          Gemacht von Schüler:innen, für Schüler:innen. Mit ❤️ aus Bad Segeberg.
        </Txt>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  textSize: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  stepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  preview: { marginHorizontal: space.lg, marginBottom: space.lg, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  catWrap: { paddingHorizontal: space.lg, paddingVertical: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
});
