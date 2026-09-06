import type { PostCard } from '@/api/types';

/** Cards seen in lists, so detail screens can render instantly before the full post arrives. */
const cards = new Map<number, PostCard>();

export function rememberCard(card: PostCard) {
  cards.set(card.id, card);
}

export function rememberCards(list: PostCard[] | undefined) {
  list?.forEach(rememberCard);
}

export function getCard(id: number): PostCard | undefined {
  return cards.get(id);
}
