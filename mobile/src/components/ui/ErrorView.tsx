import { ApiError } from '@/api/client';
import { EmptyState } from './EmptyState';

type Props = { error: unknown; onRetry?: () => void; compact?: boolean };

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Das gibt es (noch) nicht.';
    return error.message;
  }
  if (error instanceof Error && /Network request failed|abort/i.test(error.message)) {
    return 'Keine Verbindung. Bist du online?';
  }
  return 'Da ist etwas schiefgelaufen.';
}

export function ErrorView({ error, onRetry }: Props) {
  return (
    <EmptyState
      emoji="🙈"
      title="Hoppla"
      message={describeError(error)}
      actionLabel={onRetry ? 'Nochmal versuchen' : undefined}
      onAction={onRetry}
    />
  );
}
