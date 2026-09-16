import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchAllProductsForAdmin, updateProduct } from '@/services/products.service';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export function AdminInventory() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAllProductsForAdmin,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState('');

  const sorted = [...(products ?? [])].sort((a, b) => a.stock_quantity - b.stock_quantity);

  async function saveStock(id: string) {
    const qty = Number(value);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error('كمية غير صحيحة');
      return;
    }
    try {
      await updateProduct(id, { stock_quantity: qty });
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم تحديث المخزون');
    } catch {
      toast.error('تعذر التحديث');
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ivory">المخزون</h1>

      {isLoading && <p className="text-sm text-ivory-muted">جاري التحميل...</p>}
      {!isLoading && sorted.length === 0 && <EmptyState title="لا توجد منتجات بعد" />}

      {sorted.length > 0 && (
        <Card className="divide-y divide-surface-border">
          {sorted.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm text-ivory">{p.name_ar}</p>
                <p className="text-xs text-ivory-faint">{p.sku}</p>
              </div>
              <div className="flex items-center gap-3">
                {p.stock_quantity === 0 ? (
                  <Badge tone="danger">غير متوفر</Badge>
                ) : p.stock_quantity <= 5 ? (
                  <Badge tone="rose">منخفض</Badge>
                ) : (
                  <Badge tone="success">متوفر</Badge>
                )}
                {editingId === p.id ? (
                  <input
                    autoFocus
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => saveStock(p.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveStock(p.id)}
                    className="w-20 rounded-sm border border-gold bg-surface-2 px-2 py-1 text-sm text-ivory outline-none"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setValue(String(p.stock_quantity));
                    }}
                    className="w-12 text-end text-sm text-ivory hover:text-gold"
                  >
                    {p.stock_quantity}
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
