-- ============================================================================
-- QASIM Store — Harden payment receipt attachment
-- ============================================================================
-- Allows a Vodafone Cash receipt to be attached only once and only within
-- 24 hours of order creation.
-- ============================================================================

create or replace function attach_payment_receipt(
  p_order_id uuid,
  p_storage_path text
)
returns void
language plpgsql
security definer
as $$
begin
  update orders
  set payment_receipt_url = p_storage_path
  where id = p_order_id
    and payment_status = 'pending_review'
    and payment_receipt_url is null
    and created_at >= now() - interval '24 hours';

  if not found then
    raise exception 'Order not found or receipt upload is no longer allowed';
  end if;
end;
$$;

grant execute on function attach_payment_receipt(uuid, text)
to anon, authenticated;