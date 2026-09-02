import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SellerProductManager } from '@/components/seller/SellerProductManager';

export default async function SellerDashboardPage() {
  const supabase=await createClient(); const {data:claims}=await supabase.auth.getClaims(); const userId=typeof claims?.claims?.sub==='string'?claims.claims.sub:null; if(!userId)redirect('/login');
  const {data:profile}=await supabase.from('profiles').select('role,first_name').eq('id',userId).single(); if(profile?.role!=='seller')redirect('/');
  const {data:seller}=await supabase.from('sellers').select('id,store_name,status,commission_rate,description,phone,email').eq('owner_id',userId).maybeSingle(); if(!seller||seller.status!=='active')redirect('/seller/apply');
  const [{data:products},{count:orders},{data:categories}]=await Promise.all([
    supabase.from('products').select('id,name,base_price,status,sku').eq('seller_id',seller.id).order('created_at',{ascending:false}),
    supabase.from('order_items').select('id',{count:'exact',head:true}).eq('seller_id',seller.id),
    supabase.from('categories').select('id,name').eq('is_active',true).order('sort_order'),
  ]);
  return <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-blue-600">Seller Center</p><h1 className="text-3xl font-bold text-gray-900">{seller.store_name}</h1><p className="mt-1 text-gray-600">Manage products and monitor customer orders.</p></div><Link href="/" className="text-sm font-medium text-blue-600">View storefront →</Link></div><div className="mb-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Products</p><p className="mt-2 text-3xl font-bold">{products?.length??0}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Order items</p><p className="mt-2 text-3xl font-bold">{orders??0}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Commission</p><p className="mt-2 text-3xl font-bold">{seller.commission_rate}%</p></div></div><SellerProductManager categories={categories??[]} products={products??[]}/></div></main>;
}
