create index if not exists sellers_public_storefront_idx
  on public.sellers (slug)
  where status = 'active';

create index if not exists products_seller_active_created_idx
  on public.products (seller_id, created_at desc)
  where status = 'active';
