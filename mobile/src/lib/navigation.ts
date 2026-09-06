import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { PostCard } from '@/api/types';
import { rememberCard } from './cardCache';

export function useOpenPost() {
  const router = useRouter();
  return useCallback(
    (post: PostCard | number) => {
      const id = typeof post === 'number' ? post : post.id;
      if (typeof post !== 'number') rememberCard(post);
      router.push({ pathname: '/artikel/[id]', params: { id: String(id) } });
    },
    [router],
  );
}
