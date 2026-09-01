import { z } from 'zod';

/**
 * Ghana regions for address validation
 */
export const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
] as const;

/**
 * Address form validation schema
 */
export const addressSchema = z.object({
  label: z
    .string()
    .min(1, 'Address label is required')
    .max(50, 'Label must be at most 50 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+233|0)?[0-9]{9,15}$/,
      'Please enter a valid Ghana phone number'
    ),
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .min(5, 'Please enter a complete address')
    .max(200, 'Address must be at most 200 characters'),
  addressLine2: z
    .string()
    .max(200, 'Address must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  region: z
    .string()
    .min(1, 'Region is required'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be at most 100 characters'),
  postalCode: z
    .string()
    .max(10, 'Postal code must be at most 10 characters')
    .optional()
    .or(z.literal('')),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Checkout validation schema (just the address portion for now)
 */
export const checkoutAddressSchema = z.object({
  addressId: z.string().min(1, 'Please select a delivery address'),
});

export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;

/**
 * Delivery method schema
 */
export const deliveryMethodSchema = z.object({
  methodId: z.string().min(1, 'Please select a delivery method'),
});

export type DeliveryMethodInput = z.infer<typeof deliveryMethodSchema>;
