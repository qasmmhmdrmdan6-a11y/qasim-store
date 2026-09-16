import { supabase } from '@/lib/supabase';
import type { CartLine, PaymentMethod } from '@/types/domain';

export interface CheckoutInput {
  customerName: string;
  phone: string;
  governorate: string;
  address: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  lines: CartLine[];
}

/**
 * Creates an order via the `create_order` Postgres function (see
 * supabase/migrations/0001_init.sql). The function re-fetches each
 * product's current price and stock from the database itself — this
 * client only sends product_id + quantity. Never trust `line_total` or
 * `subtotal` computed in the browser for the actual charge.
 */
export async function createOrder(input: CheckoutInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_name: input.customerName,
    p_phone: input.phone,
    p_governorate: input.governorate,
    p_address: input.address,
    p_notes: input.notes ?? null,
    p_payment_method: input.paymentMethod,
    p_lines: input.lines.map((l) => ({
      product_id: l.product.id,
      quantity: l.quantity,
    })),
  });

  if (error) throw error;
  return data as string; // new order id
}

/**
 * Uploads a Vodafone Cash payment receipt screenshot for a given order into
 * the private `payment-receipts` bucket. The customer can write but never
 * read this bucket back (see supabase/migrations/0002_storage.sql) — only
 * an admin, viewing the order in the dashboard, can open it via a signed URL.
 * The returned value is the storage path, stored on orders.payment_receipt_url,
 * not a public URL (there isn't one).
 */
export async function uploadPaymentReceipt(orderId: string, file: File): Promise<string> {
  const path = `${orderId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('payment-receipts').upload(path, file);
  if (uploadError) throw uploadError;

  const { error: attachError } = await supabase.rpc('attach_payment_receipt', {
    p_order_id: orderId,
    p_storage_path: path,
  });
  if (attachError) throw attachError;

  return path;
}

// ---------------------------------------------------------------------------
// Admin-only operations. RLS lets only rows in admin_users SELECT/UPDATE
// orders and order_items at all — a guest has no read access whatsoever.
// ---------------------------------------------------------------------------

export interface OrderWithItems {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  governorate: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: 'vodafone_cash' | 'cash_on_delivery';
  payment_status: 'pending_review' | 'paid' | 'rejected' | 'cod';
  payment_receipt_url: string | null;
  order_status: 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  order_items: {
    id: string;
    product_name_ar: string;
    product_name_en: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
}

export async function fetchOrdersForAdmin(): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderWithItems[];
}

export async function updateOrderStatus(orderId: string, order_status: OrderWithItems['order_status']) {
  const { error } = await supabase.from('orders').update({ order_status }).eq('id', orderId);
  if (error) throw error;
}

export async function updatePaymentStatus(orderId: string, payment_status: 'paid' | 'rejected') {
  const { error } = await supabase.from('orders').update({ payment_status }).eq('id', orderId);
  if (error) throw error;
}

/** Generates a temporary signed URL to view a private payment receipt. */
export async function getReceiptSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('payment-receipts').createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
