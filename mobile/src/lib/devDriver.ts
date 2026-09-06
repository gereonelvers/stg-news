import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

/**
 * Screenshot/UI driver: only compiled in when the bundle is built with
 * EXPO_PUBLIC_UI_DRIVER=1 (never set for store builds). Polls a local file
 * server for a route and navigates there, so screenshots can be scripted on
 * the iOS simulator where synthetic taps are not available.
 */
export function useDevDriver() {
  const router = useRouter();
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_UI_DRIVER !== '1') return;
    LogBox.ignoreAllLogs(true);
    let last: string | null = null;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8099/route.txt?t=${Date.now()}`);
        if (!res.ok) return;
        const cmd = (await res.text()).trim();
        // The first poll only primes: a stale command left over from an earlier
        // run must not fire on every app start.
        if (last === null || cmd === last) {
          last = cmd;
          return;
        }
        last = cmd;
        if (!cmd) return;
        const [, action, target] = cmd.match(/^(\S+)\s*(.*)$/) ?? [];
        if (action === 'back') router.back();
        else if (action === 'push' && target) router.push(target as never);
        else if (action === 'replace' && target) router.replace(target as never);
        else if (action === 'navigate' && target) router.navigate(target as never);
      } catch {
        // server not running
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [router]);
}
