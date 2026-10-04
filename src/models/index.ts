import { Schema, model, models, type Model, type Types } from "mongoose";
import {
	CAMPAIGN_STATUSES,
	GARMENT_TYPES,
	ORDER_STATUSES,
	PAYMENT_STATUSES,
	type CampaignStatus,
	type GarmentType,
	type OrderStatus,
	type PaymentStatus
} from "@/types/store";

export interface UserDoc {
	googleId: string;
	name: string;
	email: string;
	image?: string;
	firstLoginAt: Date;
	lastLoginAt: Date;
}
export interface AdminDoc {
	email: string;
	createdAt: Date;
}
export interface ProductDoc {
	title: string;
	slug: string;
	artistCredit: string;
	description: string;
	active: boolean;
	images: string[];
	sortOrder: number;
}
export interface VariantDoc {
	productId: Types.ObjectId;
	garmentType: GarmentType;
	size: string;
	colour: string;
	pricePaise: number;
	sku: string;
	active: boolean;
}
export interface CampaignDoc {
	productId: Types.ObjectId;
	name: string;
	moq: number;
	preorderStart: Date;
	preorderClose: Date;
	paidQuantity: number;
	status: CampaignStatus;
	vendorNotes: string;
}
export interface CartDoc {
	userEmail: string;
	items: Array<{ variantId: Types.ObjectId; quantity: number }>;
	updatedAt: Date;
}
export interface OrderItemSnapshot {
	productId: Types.ObjectId;
	variantId: Types.ObjectId;
	campaignId: Types.ObjectId;
	productTitle: string;
	productSlug: string;
	garmentType: GarmentType;
	size: string;
	colour: string;
	sku: string;
	unitPricePaise: number;
	quantity: number;
}
export interface OrderDoc {
	orderNumber: string;
	user: { name: string; email: string; image?: string };
	items: OrderItemSnapshot[];
	totalPaise: number;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	policyAcceptedAt: Date;
	readyAt?: Date;
	collectedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
export interface PaymentDoc {
	orderId: Types.ObjectId;
	orderNumber: string;
	utr?: string;
	proofKey?: string;
	payerName?: string;
	transactionAt?: Date;
	amountPaise: number;
	status: PaymentStatus;
	submittedAt?: Date;
	verifiedAt?: Date;
	rejectedAt?: Date;
	verifierEmail?: string;
	rejectionReason?: string;
	refundUtr?: string;
	refundAmountPaise?: number;
	refundedAt?: Date;
	refundOperator?: string;
}
export interface AuditLogDoc {
	actorEmail: string;
	action: string;
	entityType: string;
	entityId: string;
	metadata: Record<string, unknown>;
	createdAt: Date;
}
export interface CounterDoc {
	key: string;
	value: number;
}

const userSchema = new Schema<UserDoc>({
	googleId: { type: String, unique: true, sparse: true },
	name: { type: String, required: true },
	email: {
		type: String,
		required: true,
		lowercase: true,
		unique: true,
		index: true
	},
	image: String,
	firstLoginAt: { type: Date, default: Date.now },
	lastLoginAt: { type: Date, default: Date.now }
});
const adminSchema = new Schema<AdminDoc>({
	email: {
		type: String,
		required: true,
		lowercase: true,
		unique: true,
		index: true
	},
	createdAt: { type: Date, default: Date.now }
});
const productSchema = new Schema<ProductDoc>(
	{
		title: { type: String, required: true },
		slug: { type: String, required: true, unique: true, index: true },
		artistCredit: { type: String, default: "Artist credit placeholder" },
		description: { type: String, required: true },
		active: { type: Boolean, default: false },
		images: { type: [String], default: [] },
		sortOrder: { type: Number, default: 0 }
	},
	{ timestamps: true }
);
const variantSchema = new Schema<VariantDoc>({
	productId: {
		type: Schema.Types.ObjectId,
		ref: "Product",
		required: true,
		index: true
	},
	garmentType: { type: String, enum: GARMENT_TYPES, required: true },
	size: { type: String, required: true },
	colour: { type: String, required: true },
	pricePaise: { type: Number, required: true, min: 0 },
	sku: { type: String, required: true, unique: true },
	active: { type: Boolean, default: true }
});
variantSchema.index(
	{ productId: 1, garmentType: 1, size: 1, colour: 1 },
	{ unique: true }
);
const campaignSchema = new Schema<CampaignDoc>(
	{
		productId: {
			type: Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			index: true
		},
		name: { type: String, required: true },
		moq: { type: Number, default: 5, min: 1 },
		preorderStart: { type: Date, required: true },
		preorderClose: { type: Date, required: true, index: true },
		paidQuantity: { type: Number, default: 0, min: 0 },
		status: {
			type: String,
			enum: CAMPAIGN_STATUSES,
			default: "draft",
			index: true
		},
		vendorNotes: { type: String, default: "" }
	},
	{ timestamps: true }
);
const cartSchema = new Schema<CartDoc>({
	userEmail: {
		type: String,
		required: true,
		lowercase: true,
		unique: true,
		index: true
	},
	items: [
		{
			variantId: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
			quantity: { type: Number, required: true, min: 1, max: 20 }
		}
	],
	updatedAt: { type: Date, default: Date.now }
});
const orderItemSchema = new Schema<OrderItemSnapshot>(
	{
		productId: { type: Schema.Types.ObjectId, required: true },
		variantId: { type: Schema.Types.ObjectId, required: true },
		campaignId: { type: Schema.Types.ObjectId, required: true },
		productTitle: String,
		productSlug: String,
		garmentType: { type: String, enum: GARMENT_TYPES },
		size: String,
		colour: String,
		sku: String,
		unitPricePaise: Number,
		quantity: Number
	},
	{ _id: false }
);
const orderSchema = new Schema<OrderDoc>(
	{
		orderNumber: { type: String, required: true, unique: true, index: true },
		user: {
			name: String,
			email: { type: String, lowercase: true, index: true },
			image: String
		},
		items: { type: [orderItemSchema], required: true },
		totalPaise: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			enum: ORDER_STATUSES,
			default: "payment_pending",
			index: true
		},
		paymentStatus: {
			type: String,
			enum: PAYMENT_STATUSES,
			default: "pending",
			index: true
		},
		policyAcceptedAt: { type: Date, required: true },
		readyAt: Date,
		collectedAt: Date
	},
	{ timestamps: true }
);
const paymentSchema = new Schema<PaymentDoc>(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			ref: "Order",
			required: true,
			unique: true
		},
		orderNumber: { type: String, required: true, index: true },
		utr: { type: String, unique: true, sparse: true, index: true },
		proofKey: String,
		payerName: String,
		transactionAt: Date,
		amountPaise: { type: Number, required: true },
		status: {
			type: String,
			enum: PAYMENT_STATUSES,
			default: "pending",
			index: true
		},
		submittedAt: Date,
		verifiedAt: Date,
		rejectedAt: Date,
		verifierEmail: String,
		rejectionReason: String,
		refundUtr: { type: String, unique: true, sparse: true },
		refundAmountPaise: Number,
		refundedAt: Date,
		refundOperator: String
	},
	{ timestamps: true }
);
const auditLogSchema = new Schema<AuditLogDoc>({
	actorEmail: { type: String, required: true },
	action: { type: String, required: true },
	entityType: { type: String, required: true },
	entityId: { type: String, required: true },
	metadata: { type: Schema.Types.Mixed, default: {} },
	createdAt: { type: Date, default: Date.now }
});
const counterSchema = new Schema<CounterDoc>({
	key: { type: String, required: true, unique: true },
	value: { type: Number, default: 1041 }
});

function existing<T>(name: string, schema: Schema<T>): Model<T> {
	return (models[name] as Model<T> | undefined) ?? model<T>(name, schema);
}
export const User = existing("User", userSchema);
export const Admin = existing("Admin", adminSchema);
export const Product = existing("Product", productSchema);
export const Variant = existing("Variant", variantSchema);
export const Campaign = existing("Campaign", campaignSchema);
export const Cart = existing("Cart", cartSchema);
export const Order = existing("Order", orderSchema);
export const Payment = existing("Payment", paymentSchema);
export const AuditLog = existing("AuditLog", auditLogSchema);
export const Counter = existing("Counter", counterSchema);
