import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Development-only UI driver: when EXPO_PUBLIC_UI_DRIVER=1, poll a local file
 * server for a route and navigate there. Lets screenshots be scripted on the
 * iOS simulator where synthetic taps are not available. No-op in production.
 */
export function useDevDriver() {
  const router = useRouter();
  useEffect(() => {
    if (!__DEV__ || process.env.EXPO_PUBLIC_UI_DRIVER !== '1') return;
    let last = '';
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8099/route.txt?t=${Date.now()}`);
        if (!res.ok) return;
        const cmd = (await res.text()).trim();
        if (!cmd || cmd === last) return;
        last = cmd;
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
