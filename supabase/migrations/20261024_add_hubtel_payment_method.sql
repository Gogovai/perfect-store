-- Add Hubtel as the only intended online payment provider while preserving
-- legacy enum values for historical records. Legacy payment rows are not deleted.
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'hubtel';
