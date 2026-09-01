'use client';

import React from 'react';
import { MapPin, Check, Edit2, Trash2 } from 'lucide-react';
import type { Address } from '@/types/database';

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: (addressId: string) => void;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
}

export function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <div
      className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-[#0f2b5b] bg-blue-50/50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSelect(address.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(address.id);
        }
      }}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
    >
      {/* Selection indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'border-[#0f2b5b] bg-[#0f2b5b]'
              : 'border-gray-300'
          }`}
        >
          {isSelected && <Check size={12} className="text-white" />}
        </div>
      </div>

      {/* Label + Default badge */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={16} className="text-gray-500 shrink-0" />
        <span className="text-sm font-semibold text-gray-900">{address.label}</span>
        {address.is_default && (
          <span className="px-2 py-0.5 bg-[#0f2b5b] text-white text-[10px] font-semibold rounded-full uppercase">
            Default
          </span>
        )}
      </div>

      {/* Address details */}
      <div className="text-sm text-gray-600 space-y-0.5 mb-3">
        <p className="font-medium text-gray-800">{address.full_name}</p>
        <p>{address.address_line_1}</p>
        {address.address_line_2 && <p>{address.address_line_2}</p>}
        <p>
          {address.city}
          {address.region ? `, ${address.region}` : ''}
          {address.postal_code ? ` ${address.postal_code}` : ''}
        </p>
        <p>{address.country}</p>
        <p className="text-gray-500">{address.phone}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(address);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-[#0f2b5b] hover:bg-gray-100 rounded transition-colors"
          aria-label={`Edit ${address.label} address`}
        >
          <Edit2 size={12} />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(address.id);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          aria-label={`Delete ${address.label} address`}
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}
