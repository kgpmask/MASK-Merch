export const GARMENT_TYPES = [
	"normal_tshirt",
	"oversized_tshirt",
	"hoodie"
] as const;
export type GarmentType = (typeof GARMENT_TYPES)[number];

export const PRODUCT_STATUSES = ["open", "closed"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
	"payment_pending",
	"payment_submitted",
	"payment_rejected",
	"confirmed",
	"ready_for_pickup",
	"collected",
	"refund_pending",
	"refunded",
	"cancelled"
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
	"pending",
	"submitted",
	"verified",
	"rejected"
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type CartInput = {
	variantId: string;
	quantity: number;
	backName?: string;
};

export type SizeChart = {
	image?: string;
	columns: string[];
	rows: string[][];
	note?: string;
};

export type StoreProduct = {
	id: string;
	title: string;
	slug: string;
	artistCredit: string;
	description: string;
	status: ProductStatus;
	images: string[];
	material?: string;
	gsm?: number | null;
	sizeChart?: SizeChart | null;
	variants: Array<{
		id: string;
		garmentType: GarmentType;
		size: string;
		colour: string;
		pricePaise: number;
		sku: string;
	}>;
};
