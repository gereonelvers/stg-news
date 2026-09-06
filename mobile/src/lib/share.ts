import { Share } from 'react-native';

import type { PostCard } from '@/api/types';

export async function sharePost(post: PostCard, fragment?: string) {
  const url = fragment ? `${post.link}#${fragment}` : post.link;
  try {
    await Share.share(
      {
        title: post.title,
        message: `Lies das mal: „${post.title}“ – ${url}`,
        url,
      },
      { subject: post.title, dialogTitle: 'Artikel teilen' },
    );
  } catch {
    // user dismissed the sheet
  }
}
