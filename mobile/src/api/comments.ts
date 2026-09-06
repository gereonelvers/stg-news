import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decodeHTML } from 'entities';
import { useEffect, useMemo } from 'react';

import { useCommentsStore, type PendingComment } from '@/store/comments';
import { ApiError, api } from './client';
import type { CommentNode, WpComment } from './types';

export const commentKeys = {
  post: (id: number) => ['comments', id] as const,
};

function plainText(html: string): string {
  return decodeHTML(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  ).trim();
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

export function buildTree(list: WpComment[]): CommentNode[] {
  const byId = new Map<number, CommentNode>();
  for (const c of list) {
    byId.set(c.id, {
      id: c.id,
      parent: c.parent,
      authorName: decodeHTML(c.author_name || 'Anonym'),
      date: c.date,
      text: plainText(c.content.rendered),
      children: [],
      depth: 0,
    });
  }
  const roots: CommentNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parent ? byId.get(node.parent) : undefined;
    if (parent) {
      node.depth = Math.min(parent.depth + 1, 3);
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function countNodes(nodes: CommentNode[]): number {
  return nodes.reduce((n, c) => n + 1 + countNodes(c.children), 0);
}

/**
 * Weave the comments written on this device (still unconfirmed) into the
 * server thread. Returns the keys of pending comments that have gone live
 * in the meantime so the caller can forget them.
 */
export function mergePending(tree: CommentNode[], pending: PendingComment[]): { tree: CommentNode[]; resolved: string[] } {
  if (!pending.length) return { tree, resolved: [] };
  const live = new Set<string>();
  const clone = (n: CommentNode): CommentNode => {
    live.add(`${norm(n.authorName)}|${norm(n.text)}`);
    return { ...n, children: n.children.map(clone) };
  };
  const out = tree.map(clone);
  const byId = new Map<number, CommentNode>();
  const index = (nodes: CommentNode[]) => nodes.forEach((n) => (byId.set(n.id, n), index(n.children)));
  index(out);

  const resolved: string[] = [];
  pending.forEach((p, i) => {
    if (live.has(`${norm(p.name)}|${norm(p.text)}`)) {
      resolved.push(p.key);
      return;
    }
    const parent = p.parent > 0 ? byId.get(p.parent) : undefined;
    const node: CommentNode = {
      id: -(i + 1),
      parent: p.parent,
      authorName: p.name,
      date: p.createdAt,
      text: p.text,
      children: [],
      depth: parent ? Math.min(parent.depth + 1, 3) : 0,
      pending: true,
    };
    if (parent) parent.children.push(node);
    else out.push(node);
  });
  return { tree: out, resolved };
}

export function useComments(postId: number) {
  return useQuery({
    queryKey: commentKeys.post(postId),
    queryFn: async () => {
      const all: WpComment[] = [];
      for (let page = 1; page <= 5; page++) {
        const chunk = await api.get<WpComment[]>('/wp/v2/comments', {
          post: postId,
          per_page: 100,
          page,
          order: 'asc',
          orderby: 'date',
        });
        all.push(...chunk);
        if (chunk.length < 100) break;
      }
      return buildTree(all);
    },
    staleTime: 60 * 1000,
    enabled: postId > 0,
  });
}

/** The server thread plus this device's unconfirmed comments. */
export function useThread(postId: number) {
  const query = useComments(postId);
  const pending = useCommentsStore((s) => s.pending);
  const remove = useCommentsStore((s) => s.remove);
  const mine = useMemo(() => pending.filter((p) => p.post === postId), [pending, postId]);
  const merged = useMemo(() => (query.data ? mergePending(query.data, mine) : null), [query.data, mine]);
  useEffect(() => {
    if (merged?.resolved.length) remove(merged.resolved);
  }, [merged, remove]);
  return { query, thread: merged?.tree ?? null, pendingCount: mine.length };
}

export type NewComment = {
  post: number;
  parent?: number;
  author_name: string;
  author_email: string;
  content: string;
};

export function usePostComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: NewComment) => api.post<WpComment>('/wp/v2/comments', input),
    onSuccess: (_data, vars) => {
      client.invalidateQueries({ queryKey: commentKeys.post(vars.post) });
    },
  });
}

/** Human, German explanation for a failed comment submission. */
export function describeCommentError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'comment_duplicate':
        return 'Das hast du hier schon einmal geschrieben.';
      case 'comment_flood':
        return 'Kurz durchatmen – gleich kannst du wieder kommentieren.';
      case 'rest_comment_author_data_required':
      case 'rest_comment_author_email_invalid':
      case 'rest_invalid_param':
        return 'Bitte gib deinen Namen und eine gültige E-Mail-Adresse an.';
      case 'rest_comment_closed':
        return 'Kommentare sind hier inzwischen geschlossen.';
      case 'rest_comment_content_invalid':
        return 'Der Kommentar ist leer oder zu lang.';
      case 'rest_comment_login_required':
        return 'Kommentieren ist hier gerade nicht möglich.';
    }
    if (e.status === 429) return 'Zu viele Anfragen – bitte gleich nochmal.';
    if (e.status >= 500) return 'Der Server hat gerade Schluckauf. Versuch es gleich nochmal.';
    const msg = e.message.replace(/<[^>]+>/g, '').trim();
    return msg || 'Senden fehlgeschlagen.';
  }
  return 'Keine Verbindung. Prüf dein Netz und versuch es nochmal.';
}
