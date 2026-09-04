'use client';

import React from 'react';
import Link from 'next/link';
import { useActionState } from 'react';
import { submitContactMessage, type ContactFormState } from '@/app/contact/actions';
import { brand } from '@/config/brand';

const initialState: ContactFormState = { success: false, error: null };

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactMessage, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-900 mb-1">Name</label>
          <input id="contact-name" name="name" type="text" required maxLength={120} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-900 mb-1">Email</label>
          <input id="contact-email" name="email" type="email" required maxLength={160} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com" />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-900 mb-1">Subject</label>
        <input id="contact-subject" name="subject" type="text" required maxLength={160} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="How can we help?" />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-gray-900 mb-1">Message</label>
        <textarea id="contact-message" name="message" required rows={4} maxLength={4000} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Tell us more..." />
      </div>

      {state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Thanks — your message has been sent to our support team. Replies appear under{' '}
          <Link href="/account/support" className="font-medium underline">My Support</Link>.
        </div>
      )}
      {!state.success && state.needAuth && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Please{' '}
          <Link href="/login?redirect=/contact" className="font-medium underline">sign in</Link>{' '}
          so our team can reply to you (or email us at{' '}
          <a href={`mailto:${brand.contact.email}`} className="font-medium underline">{brand.contact.email}</a>
          ).
        </div>
      )}
      {!state.success && !state.needAuth && state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <button type="submit" className="px-5 py-2.5 bg-[#0f2b5b] text-white rounded-lg text-sm font-medium hover:bg-[#1a3d7c] transition-colors">
        Send Message
      </button>
    </form>
  );
}
