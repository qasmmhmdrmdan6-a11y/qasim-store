import type { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'gold' | 'rose' | 'success' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  gold: 'bg-gold/15 text-gold border-gold/40',
  rose: 'bg-rose/15 text-rose border-rose/40',
  success: 'bg-success/15 text-success border-success/40',
  danger: 'bg-danger/15 text-danger border-danger/40',
  neutral: 'bg-surface-2 text-ivory-muted border-surface-border',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
