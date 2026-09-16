import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const iconTone = tone === 'warning' ? 'text-rose' : tone === 'danger' ? 'text-danger' : 'text-gold';
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`rounded-sm bg-surface-2 p-2.5 ${iconTone}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-ivory-muted">{label}</p>
        <p className="mt-0.5 text-xl font-medium text-ivory">{value}</p>
      </div>
    </Card>
  );
}
