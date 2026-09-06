import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decodeHTML } from 'entities';

import { api } from './client';
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
