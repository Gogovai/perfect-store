'use server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
const schema=z.object({sellerId:z.string().uuid(),status:z.enum(['pending','active','suspended','rejected'])});
export async function updateSellerStatus(input:unknown){const p=schema.safeParse(input);if(!p.success)return{success:false,error:'Invalid seller update'};const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return{success:false,error:'Not authenticated'};const{data:profile}=await s.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')return{success:false,error:'Admin access required'};const{data,error}=await s.rpc('admin_set_seller_status',{p_seller_id:p.data.sellerId,p_status:p.data.status});if(error)return{success:false,error:error.message};if(data&&data.success===false)return{success:false,error:'Unable to update seller status'};revalidatePath('/admin/sellers');revalidatePath('/seller/dashboard');revalidatePath('/seller');revalidatePath('/products');return{success:true};}
