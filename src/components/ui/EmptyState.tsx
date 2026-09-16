import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-surface-border py-16 text-center">
      <h3 className="font-display text-lg text-ivory">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ivory-muted">{description}</p>}
      {action}
    </div>
  );
}
