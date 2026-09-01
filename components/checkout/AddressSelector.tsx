'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddressCard } from './AddressCard';
import { AddressForm } from './AddressForm';
import { getUserAddresses, createAddress, updateAddress, deleteAddress } from '@/app/(storefront)/account/addresses/actions';
import type { Address } from '@/types/database';
import type { AddressInput } from '@/lib/validations/address';

interface AddressSelectorProps {
  selectedAddressId: string | null;
  onSelectAddress: (addressId: string) => void;
}

export function AddressSelector({ selectedAddressId, onSelectAddress }: AddressSelectorProps) {
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

        if (!selectedAddressId && data.length > 0) {
          const defaultAddr = data.find((a) => a.is_default) || data[0];
          onSelectAddress(defaultAddr.id);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateAddress(data: AddressInput) {
    setIsProcessing(true);
    try {
      const result = await createAddress(data);
      if (result.success && result.address) {
        setAddresses((prev) => [result.address!, ...prev]);
        onSelectAddress(result.address.id);
        setShowForm(false);
        return { success: true };
      }
      return { success: false, error: result.error };
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateAddress(data: AddressInput) {
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

  async function handleDeleteAddress(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setIsProcessing(true);
    try {
      const result = await deleteAddress(addressId);
      if (result.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
        if (selectedAddressId === addressId) {
          onSelectAddress('');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleEdit(address: Address) {
    setEditingAddress(address);
    setShowForm(true);
  }

  function handleCancelForm() {
    setEditingAddress(null);
    setShowForm(false);
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {showForm ? (
        <AddressForm
          initialData={editingAddress}
          onSubmit={editingAddress ? handleUpdateAddress : handleCreateAddress}
          onCancel={handleCancelForm}
          isLoading={isProcessing}
        />
      ) : (
        <>
          {addresses.length > 0 ? (
            <div className="space-y-3" role="radiogroup" aria-label="Delivery addresses">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={selectedAddressId === address.id}
                  onSelect={onSelectAddress}
                  onEdit={handleEdit}
                  onDelete={handleDeleteAddress}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">You have no saved addresses.</p>
              <p className="text-xs mt-1">Add a delivery address to continue.</p>
            </div>
          )}

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Add New Address
          </Button>
        </>
      )}
    </div>
  );
}
