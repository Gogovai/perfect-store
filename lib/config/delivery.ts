export type DeliveryOption = {
  /** Stable delivery method key stored on the order, e.g. standard or express. */
  id: string;
  name: string;
  description: string;
  price: number;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  zoneName: string;
};
