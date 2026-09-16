import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import {
  fetchOrdersForAdmin,
  updateOrderStatus,
  updatePaymentStatus,
  getReceiptSignedUrl,
  type OrderWithItems,
} from '@/services/orders.service';
import { formatPrice } from '@/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminModal } from '@/components/admin/AdminModal';
import { buttonClasses } from '@/components/ui/Button';

const ORDER_STATUS_LABELS: Record<OrderWithItems['order_status'], string> = {
  new: 'طلب جديد',
  confirmed: 'تم التأكيد',
  preparing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'تم الإلغاء',
};

const PAYMENT_STATUS_LABELS: Record<OrderWithItems['payment_status'], string> = {
  pending_review: 'في انتظار المراجعة',
  paid: 'تم الدفع',
  rejected: 'مرفوض',
  cod: 'الدفع عند الاستلام',
};

const STATUS_TONE: Record<OrderWithItems['order_status'], 'gold' | 'success' | 'danger' | 'neutral'> = {
  new: 'gold',
  confirmed: 'gold',
  preparing: 'gold',
  shipped: 'gold',
  delivered: 'success',
  cancelled: 'danger',
};

export function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchOrdersForAdmin });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrderWithItems | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (orders ?? []).filter((o) => {
      if (statusFilter !== 'all' && o.order_status !== statusFilter) return false;
      if (search && !o.customer_name.includes(search) && !o.phone.includes(search)) return false;
      return true;
    });
  }, [orders, statusFilter, search]);

  async function handleStatusChange(order: OrderWithItems, status: OrderWithItems['order_status']) {
    try {
      await updateOrderStatus(order.id, status);
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('تم تحديث حالة الطلب');
      setSelected((s) => (s ? { ...s, order_status: status } : s));
    } catch {
      toast.error('تعذر تحديث الحالة');
    }
  }

  async function handlePaymentDecision(order: OrderWithItems, decision: 'paid' | 'rejected') {
    try {
      await updatePaymentStatus(order.id, decision);
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(decision === 'paid' ? 'تم تأكيد الدفع' : 'تم رفض الدفع');
      setSelected((s) => (s ? { ...s, payment_status: decision } : s));
    } catch {
      toast.error('تعذر تحديث حالة الدفع');
    }
  }

  async function openReceipt(path: string) {
    try {
      const url = await getReceiptSignedUrl(path);
      setReceiptUrl(url);
    } catch {
      toast.error('تعذر فتح الإيصال');
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ivory">الطلبات</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="rounded-sm border border-surface-border bg-surface-2 px-3 py-2 text-sm text-ivory outline-none focus:border-gold"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-sm border border-surface-border bg-surface-2 px-3 py-2 text-sm text-ivory outline-none focus:border-gold"
        >
          <option value="all">كل الحالات</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-sm text-ivory-muted">جاري التحميل...</p>}
      {!isLoading && filtered.length === 0 && <EmptyState title="لا توجد طلبات" />}

      {filtered.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-ivory-faint">
                <th className="p-3 text-start">رقم الطلب</th>
                <th className="p-3 text-start">العميل</th>
                <th className="p-3 text-start">الإجمالي</th>
                <th className="p-3 text-start">الدفع</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">التاريخ</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-surface-border last:border-0">
                  <td className="p-3 text-ivory">#{order.order_number}</td>
                  <td className="p-3 text-ivory-muted">
                    {order.customer_name}
                    <div className="text-xs text-ivory-faint">{order.phone}</div>
                  </td>
                  <td className="p-3 text-gold">{formatPrice(order.total, 'ar')}</td>
                  <td className="p-3">
                    <Badge tone={order.payment_status === 'paid' || order.payment_status === 'cod' ? 'success' : order.payment_status === 'rejected' ? 'danger' : 'gold'}>
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge tone={STATUS_TONE[order.order_status]}>{ORDER_STATUS_LABELS[order.order_status]}</Badge>
                  </td>
                  <td className="p-3 text-xs text-ivory-faint">
                    {new Date(order.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="p-3">
                    <button onClick={() => setSelected(order)} className="text-ivory-muted hover:text-gold">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AdminModal open={!!selected} title={selected ? `طلب #${selected.order_number}` : ''} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3 text-ivory-muted">
              <p>
                <span className="text-ivory-faint">العميل: </span>
                {selected.customer_name}
              </p>
              <p dir="ltr" className="text-end">
                <span className="text-ivory-faint">الهاتف: </span>
                {selected.phone}
              </p>
              <p className="col-span-2">
                <span className="text-ivory-faint">المحافظة: </span>
                {selected.governorate}
              </p>
              <p className="col-span-2">
                <span className="text-ivory-faint">العنوان: </span>
                {selected.address}
              </p>
              {selected.notes && (
                <p className="col-span-2">
                  <span className="text-ivory-faint">ملاحظات: </span>
                  {selected.notes}
                </p>
              )}
            </div>

            <div className="divide-y divide-surface-border border-y border-surface-border">
              {selected.order_items.map((item) => (
                <div key={item.id} className="flex justify-between py-2 text-ivory-muted">
                  <span>
                    {item.product_name_ar} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.line_total, 'ar')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-medium text-ivory">
              <span>الإجمالي</span>
              <span className="text-gold">{formatPrice(selected.total, 'ar')}</span>
            </div>

            {/* Payment review */}
            <div className="rounded-sm border border-surface-border p-3">
              <p className="mb-2 text-ivory-muted">
                طريقة الدفع: {selected.payment_method === 'vodafone_cash' ? 'Vodafone Cash' : 'الدفع عند الاستلام'}
              </p>
              {selected.payment_receipt_url && (
                <button
                  onClick={() => openReceipt(selected.payment_receipt_url!)}
                  className="mb-2 text-xs text-gold hover:underline"
                >
                  عرض إيصال التحويل
                </button>
              )}
              {selected.payment_status === 'pending_review' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentDecision(selected, 'paid')}
                    className={buttonClasses('primary', 'sm')}
                  >
                    تأكيد الدفع
                  </button>
                  <button
                    onClick={() => handlePaymentDecision(selected, 'rejected')}
                    className={buttonClasses('danger', 'sm')}
                  >
                    رفض الدفع
                  </button>
                </div>
              )}
            </div>

            {/* Order status */}
            <div>
              <p className="mb-1.5 text-ivory-muted">حالة الطلب</p>
              <select
                value={selected.order_status}
                onChange={(e) => handleStatusChange(selected, e.target.value as OrderWithItems['order_status'])}
                className="w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2 text-ivory outline-none focus:border-gold"
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </AdminModal>

      {receiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setReceiptUrl(null)}
        >
          <img src={receiptUrl} alt="إيصال الدفع" className="max-h-[85vh] max-w-full rounded-sm" />
        </div>
      )}
    </div>
  );
}
