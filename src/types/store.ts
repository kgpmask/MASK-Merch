export const GARMENT_TYPES = ["normal_tshirt", "oversized_tshirt", "hoodie"] as const;
export type GarmentType = (typeof GARMENT_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  "draft", "open", "MOQ_met", "vendor_ordered", "ready_for_pickup", "closed", "MOQ_failed",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const ORDER_STATUSES = [
  "payment_pending", "payment_submitted", "payment_rejected", "paid_waiting_moq",
  "confirmed", "ready_for_pickup", "collected", "refund_pending", "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "submitted", "verified", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type CartInput = { variantId: string; quantity: number };

export type StoreProduct = {
  id: string;
  title: string;
  slug: string;
  artistCredit: string;
  description: string;
  images: string[];
  campaign: {
    id: string;
    moq: number;
    paidQuantity: number;
    preorderClose: string;
    status: CampaignStatus;
  };
  variants: Array<{
    id: string;
    garmentType: GarmentType;
    size: string;
    colour: string;
    pricePaise: number;
    sku: string;
  }>;
};

export type OrderView = {
  orderNumber: string;
  user: { name: string; email: string };
  items: Array<{
    productTitle: string; productSlug: string; garmentType: GarmentType; size: string;
    colour: string; sku: string; unitPricePaise: number; quantity: number;
  }>;
  totalPaise: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};
