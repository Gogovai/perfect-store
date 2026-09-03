-- Internal trigger helper; it is not a client-callable API.
revoke all on function public.sync_order_status_from_seller_groups(uuid) from public;
revoke all on function public.sync_order_status_from_seller_groups(uuid) from anon;
revoke all on function public.sync_order_status_from_seller_groups(uuid) from authenticated;
