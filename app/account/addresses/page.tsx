'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AddressCard } from '@/components/checkout/AddressCard';
import { AddressForm } from '@/components/checkout/AddressForm';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/app/(storefront)/account/addresses/actions';
import type { Address } from '@/types/database';
import type { AddressInput } from '@/lib/validations/address';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await getUserAddresses();
        if (cancelled) return;
        setAddresses(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleCreate(data: AddressInput) {
    setIsProcessing(true);
    try {
      const result = await createAddress(data);
      if (result.success && result.address) {
        setAddresses((prev) => [result.address!, ...prev]);
        setShowForm(false);
        return { success: true };
      }
      return { success: false, error: result.error };
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdate(data: AddressInput) {
    if (!editingAddress) return { success: false, error: 'No address selected' };
    setIsProcessing(true);
    try {
      const result = await updateAddress(editingAddress.id, data);
      if (result.success && result.address) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddress.id ? result.address! : a))
        );
        setEditingAddress(null);
        setShowForm(false);
        return { success: true };
      }
      return { success: false, error: result.error };
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setIsProcessing(true);
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSetDefault(addressId: string) {
    setIsProcessing(true);
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, is_default: a.id === addressId }))
        );
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleEdit(address: Address) {
    setEditingAddress(address);
    setShowForm(true);
  }

  function handleCancel() {
    setEditingAddress(null);
    setShowForm(false);
  }

  return (
    <div className="py-6 sm:py-8 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="xl">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Account
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin size={24} className="text-[#0f2b5b]" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Addresses</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your delivery addresses
              </p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>Add Address</Button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAddress ? 'Edit Address' : 'New Address'}
            </h2>
            <AddressForm
              initialData={editingAddress}
              onSubmit={editingAddress ? handleUpdate : handleCreate}
              onCancel={handleCancel}
              isLoading={isProcessing}
            />
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No addresses saved</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add a delivery address to make checkout faster.
            </p>
            <Button onClick={() => setShowForm(true)}>Add Your First Address</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isSelected={address.is_default}
                onSelect={() => handleSetDefault(address.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
