'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { addressSchema, type AddressInput, GHANA_REGIONS } from '@/lib/validations/address';
import type { Address } from '@/types/database';

interface AddressFormProps {
  initialData?: Address | null;
  onSubmit: (data: AddressInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddressForm({ initialData, onSubmit, onCancel, isLoading = false }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressInput>({
    label: initialData?.label || '', fullName: initialData?.full_name || '', phone: initialData?.phone || '',
    addressLine1: initialData?.address_line_1 || '', addressLine2: initialData?.address_line2 || '',
    region: initialData?.region || '', city: initialData?.city || '', postalCode: initialData?.postal_code || '',
    isDefault: initialData?.is_default || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof AddressInput, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErrors({});
    const validation = addressSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) { const field = issue.path[0] as string; if (!fieldErrors[field]) fieldErrors[field] = issue.message; }
      setErrors(fieldErrors); return;
    }
    setIsSubmitting(true);
    try { const result = await onSubmit(validation.data); if (!result.success && result.error) setErrors({ _form: result.error }); }
    finally { setIsSubmitting(false); }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors._form && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._form}</div>}
      <Input label="Address Label" placeholder="e.g., Home, Office, Hostel" value={formData.label} onChange={(e) => handleChange('label', e.target.value)} error={errors.label} required />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Full Name" placeholder="John Doe" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} error={errors.fullName} required /><Input label="Phone Number" placeholder="+233XXXXXXXXX" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} error={errors.phone} required /></div>
      <Input label="Address Line 1" placeholder="Street address, area, building" value={formData.addressLine1} onChange={(e) => handleChange('addressLine1', e.target.value)} error={errors.addressLine1} required />
      <Input label="Address Line 2 (Optional)" placeholder="Apartment, suite, floor, landmark" value={formData.addressLine2 || ''} onChange={(e) => handleChange('addressLine2', e.target.value)} error={errors.addressLine2} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-900 mb-2">Region <span className="text-red-500 ml-1">*</span></label><select value={formData.region} onChange={(e) => handleChange('region', e.target.value)} className={`w-full px-4 py-2.5 border rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.region ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} required><option value="">Select region</option>{GHANA_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}</select>{errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}</div><Input label="City / Town" placeholder="e.g., Accra, Kumasi" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} error={errors.city} required /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Postal Code (Optional)" placeholder="e.g., 00233" value={formData.postalCode || ''} onChange={(e) => handleChange('postalCode', e.target.value)} error={errors.postalCode} /><div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isDefault} onChange={(e) => handleChange('isDefault', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#0f2b5b] focus:ring-[#0f2b5b]" /><span className="text-sm text-gray-700">Set as default address</span></label></div></div>
      <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button><Button type="submit" disabled={isSubmitting || isLoading}>{isSubmitting ? 'Saving...' : initialData ? 'Update Address' : 'Save Address'}</Button></div>
    </form>
  );
}
