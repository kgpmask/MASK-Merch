import mongoose, { Types } from "mongoose";
import { connectDatabase } from "@/lib/database";
import { AuditLog, Campaign, Cart, Counter, Order, Payment, Product, Variant, type CampaignDoc, type ProductDoc, type VariantDoc } from "@/models";
import { calculateTotal, groupCampaignQuantities } from "@/lib/store/pricing";
import { campaignOutcome } from "@/lib/store/transitions";
import type { CartInput, OrderStatus } from "@/types/store";

type LeanVariant = VariantDoc & { _id: Types.ObjectId };
type LeanProduct = ProductDoc & { _id: Types.ObjectId };
type LeanCampaign = CampaignDoc & { _id: Types.ObjectId };
type UserSnapshot = { name: string; email: string; image?: string };

export async function createOrder(user: UserSnapshot, input: CartInput[], policyAccepted: boolean): Promise<{ orderNumber: string; totalPaise: number }> {
  if (!policyAccepted) throw new Error("You must accept the preorder policy.");
  if (input.length < 1 || input.length > 30) throw new Error("Cart must contain between 1 and 30 lines.");
  const ids = input.map((line) => {
    if (!Types.ObjectId.isValid(line.variantId) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) throw new Error("Invalid cart line.");
    return new Types.ObjectId(line.variantId);
  });
  await connectDatabase();
  const variants = await Variant.find({ _id: { $in: ids }, active: true }).lean<LeanVariant[]>();
  if (variants.length !== new Set(ids.map(String)).size) throw new Error("A selected variant is unavailable.");
  const productIds = [...new Set(variants.map((variant) => variant.productId.toString()))].map((id) => new Types.ObjectId(id));
  const [products, campaigns] = await Promise.all([
    Product.find({ _id: { $in: productIds }, active: true }).lean<LeanProduct[]>(),
    Campaign.find({ productId: { $in: productIds }, status: "open", preorderClose: { $gt: new Date() } }).lean<LeanCampaign[]>(),
  ]);
  if (products.length !== productIds.length || campaigns.length !== productIds.length) throw new Error("A campaign is no longer open.");
  const items = input.map((line) => {
    const variant = variants.find((item) => item._id.toString() === line.variantId);
    if (!variant) throw new Error("Variant unavailable.");
    const product = products.find((item) => item._id.equals(variant.productId));
    const campaign = campaigns.find((item) => item.productId.equals(variant.productId));
    if (!product || !campaign) throw new Error("Product campaign unavailable.");
    return { productId: product._id, variantId: variant._id, campaignId: campaign._id, productTitle: product.title, productSlug: product.slug, garmentType: variant.garmentType, size: variant.size, colour: variant.colour, sku: variant.sku, unitPricePaise: variant.pricePaise, quantity: line.quantity };
  });
  const totalPaise = calculateTotal(items);
  const counter = await Counter.findOneAndUpdate({ key: "order" }, { $inc: { value: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const orderNumber = `MASK-${counter.value}`;
  const order = await Order.create({ orderNumber, user, items, totalPaise, status: "payment_pending", paymentStatus: "pending", policyAcceptedAt: new Date() });
  await Promise.all([
    Payment.create({ orderId: order._id, orderNumber, amountPaise: totalPaise, status: "pending" }),
    Cart.findOneAndUpdate({ userEmail: user.email }, { $set: { items: input.map((line) => ({ variantId: new Types.ObjectId(line.variantId), quantity: line.quantity })), updatedAt: new Date() } }, { upsert: true }),
  ]);
  return { orderNumber, totalPaise };
}

export async function verifyPayment(orderNumber: string, actorEmail: string): Promise<boolean> {
  await connectDatabase();
  const session = await mongoose.startSession();
  let changed = false;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate({ orderNumber, status: "payment_submitted", paymentStatus: "submitted" }, { $set: { status: "paid_waiting_moq", paymentStatus: "verified" } }, { new: true, session });
      if (!order) return;
      changed = true;
      const quantities = groupCampaignQuantities(order.items.map((item) => ({ campaignId: item.campaignId.toString(), quantity: item.quantity })));
      await Promise.all([...quantities].map(([campaignId, quantity]) => Campaign.updateOne({ _id: campaignId, status: "open" }, { $inc: { paidQuantity: quantity } }, { session })));
      await Payment.updateOne({ orderId: order._id, status: "submitted" }, { $set: { status: "verified", verifiedAt: new Date(), verifierEmail: actorEmail } }, { session });
      await AuditLog.create([{ actorEmail, action: "payment_verified", entityType: "order", entityId: orderNumber, metadata: { totalPaise: order.totalPaise } }], { session });
    });
  } finally { await session.endSession(); }
  return changed;
}

export async function rejectPayment(orderNumber: string, actorEmail: string, reason: string): Promise<boolean> {
  if (reason.trim().length < 3) throw new Error("A rejection reason is required.");
  await connectDatabase();
  const order = await Order.findOneAndUpdate({ orderNumber, status: "payment_submitted", paymentStatus: "submitted" }, { $set: { status: "payment_rejected", paymentStatus: "rejected" } }, { new: true });
  if (!order) return false;
  await Promise.all([
    Payment.updateOne({ orderId: order._id, status: "submitted" }, { $set: { status: "rejected", rejectedAt: new Date(), verifierEmail: actorEmail, rejectionReason: reason.trim() } }),
    AuditLog.create({ actorEmail, action: "payment_rejected", entityType: "order", entityId: orderNumber, metadata: { reason: reason.trim() } }),
  ]);
  return true;
}

export async function decideCampaign(campaignId: string, actorEmail: string): Promise<"MOQ_met" | "MOQ_failed"> {
  if (!Types.ObjectId.isValid(campaignId)) throw new Error("Invalid campaign.");
  await connectDatabase();
  const campaign = await Campaign.findOne({ _id: campaignId, status: "open" });
  if (!campaign) throw new Error("Campaign is not open.");
  if (campaign.preorderClose > new Date()) throw new Error("Campaign cannot be decided before its preorder deadline.");
  const outcome = campaignOutcome(campaign.paidQuantity, campaign.moq);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const updated = await Campaign.updateOne({ _id: campaign._id, status: "open" }, { $set: { status: outcome } }, { session });
      if (updated.modifiedCount !== 1) return;
      const affected = await Order.find({ "items.campaignId": campaign._id, status: "paid_waiting_moq" }, null, { session });
      for (const order of affected) {
        const campaignIds = [...new Set(order.items.map((item) => item.campaignId.toString()))];
        const states = await Campaign.find({ _id: { $in: campaignIds } }, { status: 1 }, { session });
        const nextStatus: OrderStatus | null = states.some((item) => item.status === "MOQ_failed") ? "refund_pending" : states.every((item) => item.status !== "open" && item.status !== "draft") ? "confirmed" : null;
        if (nextStatus) await Order.updateOne({ _id: order._id, status: "paid_waiting_moq" }, { $set: { status: nextStatus } }, { session });
      }
      await AuditLog.create([{ actorEmail, action: "campaign_decided", entityType: "campaign", entityId: campaignId, metadata: { outcome, paidQuantity: campaign.paidQuantity, moq: campaign.moq } }], { session });
    });
  } finally { await session.endSession(); }
  return outcome;
}

export async function recordRefund(orderNumber: string, actorEmail: string, refundUtr: string, amountPaise: number, refundedAt: Date): Promise<boolean> {
  const cleanUtr = refundUtr.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,40}$/.test(cleanUtr)) throw new Error("Enter a valid refund UTR.");
  await connectDatabase();
  const session = await mongoose.startSession();
  let changed = false;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate({ orderNumber, status: "refund_pending", totalPaise: amountPaise }, { $set: { status: "refunded" } }, { new: true, session });
      if (!order) return;
      changed = true;
      await Payment.updateOne({ orderId: order._id, refundUtr: { $exists: false } }, { $set: { refundUtr: cleanUtr, refundAmountPaise: amountPaise, refundedAt, refundOperator: actorEmail } }, { session });
      await AuditLog.create([{ actorEmail, action: "refund_recorded", entityType: "order", entityId: orderNumber, metadata: { refundUtr: cleanUtr, amountPaise } }], { session });
    });
  } finally { await session.endSession(); }
  return changed;
}

export async function transitionFulfilment(orderNumber: string, actorEmail: string, action: "ready" | "collected"): Promise<boolean> {
  await connectDatabase();
  const from: OrderStatus = action === "ready" ? "confirmed" : "ready_for_pickup";
  const to: OrderStatus = action === "ready" ? "ready_for_pickup" : "collected";
  const timestamp = action === "ready" ? { readyAt: new Date() } : { collectedAt: new Date() };
  const order = await Order.findOneAndUpdate({ orderNumber, status: from }, { $set: { status: to, ...timestamp } }, { new: true });
  if (!order) return false;
  await AuditLog.create({ actorEmail, action: action === "ready" ? "order_ready" : "order_collected", entityType: "order", entityId: orderNumber, metadata: {} });
  return true;
}
