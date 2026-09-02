'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const productSchema = z.object({
  name: z.string().trim().min(2).max(160), slug: z.string().trim().min(2).max(180), sku: z.string().trim().max(80).optional(), brand: z.string().trim().max(80).optional(), categoryId: z.string().uuid().optional(), description: z.string().trim().max(5000).optional(), shortDescription: z.string().trim().max(300).optional(), price: z.coerce.number().min(0), compareAtPrice: z.coerce.number().min(0).optional(), quantity: z.coerce.number().int().min(0), imageUrl: z.string().url().optional(),
});

async function seller() {
  const supabase = await createClient(); const { data:{user} }=await supabase.auth.getUser(); if(!user) return {supabase,user:null,seller:null};
  const {data:seller}=await supabase.from('sellers').select('id,status').eq('owner_id',user.id).maybeSingle(); return {supabase,user,seller};
}

export async function createProduct(input: unknown) {
  const parsed=productSchema.safeParse(input); if(!parsed.success) return {success:false,error:parsed.error.issues[0]?.message};
  const {supabase,seller}=await seller(); if(!seller) return {success:false,error:'Seller account not found'}; if(seller.status!=='active') return {success:false,error:'Your seller account is not active'};
  const d=parsed.data;
  const {data:product,error}=await supabase.from('products').insert({seller_id:seller.id,name:d.name,slug:d.slug,sku:d.sku||null,brand:d.brand||null,category_id:d.categoryId||null,description:d.description||null,short_description:d.shortDescription||null,base_price:d.price,compare_at_price:d.compareAtPrice||null,status:'pending_review',currency:'GHS',is_featured:false,rating_average:0,review_count:0}).select('id').single();
  if(error||!product) return {success:false,error:error?.message||'Unable to create product'};
  const {error:invError}=await supabase.from('inventory').insert({product_id:product.id,quantity:d.quantity,reserved_quantity:0,low_stock_threshold:5});
  if(invError) { await supabase.from('products').delete().eq('id',product.id); return {success:false,error:'Unable to create inventory'}; }
  if(d.imageUrl) await supabase.from('product_images').insert({product_id:product.id,url:d.imageUrl,alt_text:d.name,sort_order:0,is_primary:true});
  revalidatePath('/seller/dashboard'); revalidatePath('/products'); return {success:true,id:product.id};
}

export async function updateProduct(productId:string,input:unknown){
  const parsed=productSchema.safeParse(input); if(!parsed.success) return {success:false,error:parsed.error.issues[0]?.message};
  const {supabase,seller}=await seller(); if(!seller||seller.status!=='active') return {success:false,error:'Seller account is not active'}; const d=parsed.data;
  const {error}=await supabase.from('products').update({name:d.name,slug:d.slug,sku:d.sku||null,brand:d.brand||null,category_id:d.categoryId||null,description:d.description||null,short_description:d.shortDescription||null,base_price:d.price,compare_at_price:d.compareAtPrice||null,status:'pending_review'}).eq('id',productId).eq('seller_id',seller.id);
  if(error) return {success:false,error:error.message}; await supabase.from('inventory').upsert({product_id:productId,quantity:d.quantity,reserved_quantity:0,low_stock_threshold:5},{onConflict:'product_id'}); if(d.imageUrl) await supabase.from('product_images').upsert({product_id:productId,url:d.imageUrl,alt_text:d.name,sort_order:0,is_primary:true}); revalidatePath('/seller/dashboard'); revalidatePath('/products'); return {success:true};
}

export async function deleteProduct(productId:string){const {supabase,seller}=await seller();if(!seller||seller.status!=='active')return{success:false,error:'Seller account is not active'};const {error}=await supabase.from('products').delete().eq('id',productId).eq('seller_id',seller.id);if(error)return{success:false,error:error.message};revalidatePath('/seller/dashboard');revalidatePath('/products');return{success:true};}

export async function updateSellerStore(input:{storeName:string;description?:string;phone?:string;email?:string}){const {supabase,seller}=await seller();if(!seller)return{success:false,error:'Seller account not found'};const {error}=await supabase.from('sellers').update({store_name:input.storeName.trim(),description:input.description?.trim()||null,phone:input.phone?.trim()||null,email:input.email?.trim()||null}).eq('id',seller.id);if(error)return{success:false,error:error.message};revalidatePath('/seller/dashboard');return{success:true};}
