'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(160),
  subject: z.string().trim().min(3, 'Please add a short subject.').max(160),
  message: z.string().trim().min(3, 'Please write a message.').max(4000, 'Message is too long (max 4000 characters).'),
});

export type ContactFormState = {
  success: boolean;
  needAuth?: boolean;
  error?: string | null;
};

/**
 * Public "Send us a message" handler.
 *
 * Messages are stored as support tickets (category "contact") so the admin
 * support console sees them. Creating a ticket requires a signed-in user
 * (the account/support console works the same way), so guests are told to
 * sign in or email us instead of silently dropping their message.
 */
export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Please check your details.' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      needAuth: true,
      error: 'Please sign in so we can reply to you, or email us directly.',
    };
  }

  // Simple anti-spam cap: at most 4 contact messages per hour per account.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .eq('category', 'contact')
    .gte('created_at', since);
  if ((count ?? 0) >= 4) {
    return { success: false, error: 'Too many messages sent recently. Please try again later.' };
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      customer_id: user.id,
      subject: `[Contact] ${parsed.data.subject}`,
      category: 'contact',
      priority: 'normal',
      status: 'open',
    })
    .select('id')
    .single();
  if (error || !ticket) {
    return { success: false, error: 'Unable to send your message. Please try again.' };
  }

  const { error: messageError } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message: `From ${parsed.data.name} <${parsed.data.email}>:\n\n${parsed.data.message}`,
    });
  if (messageError) {
    return { success: false, error: 'Unable to send your message. Please try again.' };
  }

  revalidatePath('/admin/support');
  return { success: true, error: null };
}
