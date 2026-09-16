import { useQuery } from '@tanstack/react-query';
import { ClipboardList, DollarSign, Package, AlertTriangle, PackageX, Bell } from 'lucide-react';
import { fetchOrdersForAdmin } from '@/services/orders.service';
import { fetchAllProductsForAdmin } from '@/services/products.service';
import { StatCard } from '@/components/admin/StatCard';
import { formatPrice } from '@/utils/currency';

export function AdminOverview() {
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: fetchOrdersForAdmin });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: fetchAllProductsForAdmin });

  const totalOrders = orders?.length ?? 0;
  const newOrders = orders?.filter((o) => o.order_status === 'new').length ?? 0;
  const totalSales = orders
    ?.filter((o) => o.payment_status === 'paid' || o.payment_status === 'cod')
    .reduce((sum, o) => sum + o.total, 0) ?? 0;
  const totalProducts = products?.length ?? 0;
  const lowStock = products?.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length ?? 0;
  const outOfStock = products?.filter((p) => p.stock_quantity === 0).length ?? 0;
  const pendingPayments = orders?.filter((o) => o.payment_status === 'pending_review').length ?? 0;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-ivory">نظرة عامة</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={totalOrders} icon={ClipboardList} />
        <StatCard label="الطلبات الجديدة" value={newOrders} icon={Bell} tone={newOrders > 0 ? 'warning' : 'default'} />
        <StatCard label="إجمالي المبيعات" value={formatPrice(totalSales, 'ar')} icon={DollarSign} />
        <StatCard label="عدد المنتجات" value={totalProducts} icon={Package} />
        <StatCard label="مخزون منخفض" value={lowStock} icon={AlertTriangle} tone={lowStock > 0 ? 'warning' : 'default'} />
        <StatCard label="غير متوفر" value={outOfStock} icon={PackageX} tone={outOfStock > 0 ? 'danger' : 'default'} />
        <StatCard
          label="مدفوعات بانتظار المراجعة"
          value={pendingPayments}
          icon={Bell}
          tone={pendingPayments > 0 ? 'warning' : 'default'}
        />
      </div>
    </div>
  );
}
