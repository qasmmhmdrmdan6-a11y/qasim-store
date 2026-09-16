import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function AdminModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/80 p-4 py-10" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-md border border-surface-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg text-ivory">{title}</h3>
          <button onClick={onClose} className="text-ivory-muted hover:text-ivory" aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
