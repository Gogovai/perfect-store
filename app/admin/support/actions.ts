'use server';
import {createClient} from '@/lib/supabase/server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
const schema=z.object({ticketId:z.string().uuid(),message:z.string().trim().min(1).max(4000),internalNote:z.boolean().default(false)});
export async function addSupportMessage(input:unknown){const p=schema.safeParse(input);if(!p.success)return{success:false,error:'Invalid support message'};const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return{success:false,error:'Not authenticated'};const{data:profile}=await s.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')return{success:false,error:'Admin access required'};const{error}=await s.from('support_messages').insert({ticket_id:p.data.ticketId,sender_id:user.id,message:p.data.message,internal_note:p.data.internalNote});if(error)return{success:false,error:'Unable to send message'};await s.from('support_tickets').update({status:'in_progress',updated_at:new Date().toISOString()}).eq('id',p.data.ticketId);revalidatePath('/admin/support');revalidatePath(`/admin/support/${p.data.ticketId}`);return{success:true};}
