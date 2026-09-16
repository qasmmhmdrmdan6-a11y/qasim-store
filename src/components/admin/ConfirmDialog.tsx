import { buttonClasses } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  onConfirm,
  onCancel,
  isDangerous = true,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-md border border-surface-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-ivory">{title}</h3>
        {description && <p className="mt-2 text-sm text-ivory-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className={buttonClasses('ghost', 'sm')}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={buttonClasses(isDangerous ? 'danger' : 'primary', 'sm')}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
