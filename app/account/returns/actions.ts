'use server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
const schema=z.object({orderId:z.string().uuid(),reasonCode:z.string().trim().min(2).max(60),reason:z.string().trim().max(1000).optional()});
export async function requestReturn(input:unknown){const p=schema.safeParse(input);if(!p.success)return{success:false,error:p.error.issues[0]?.message||'Invalid request'};const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return{success:false,error:'Please sign in'};const{data,error}=await s.rpc('request_order_return',{p_order_id:p.data.orderId,p_reason_code:p.data.reasonCode,p_reason:p.data.reason||null});if(error)return{success:false,error:error.message};revalidatePath('/account/returns');revalidatePath('/account/orders');return{success:true,returnId:data?.return_id};}
