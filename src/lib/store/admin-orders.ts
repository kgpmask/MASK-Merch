import mongoose from "mongoose";
import { connectDatabase } from "@/lib/database";
import { AuditLog, Campaign, Order } from "@/models";
import { groupCampaignQuantities } from "@/lib/store/pricing";
import type { OrderStatus, PaymentStatus } from "@/types/store";

export function cancellationStatus(
	status: OrderStatus,
	payment: PaymentStatus
): "cancelled" | "refund_pending" {
	if (
		["payment_pending", "payment_rejected"].includes(status) &&
		["pending", "rejected"].includes(payment)
	)
		return "cancelled";
	if (
		["paid_waiting_moq", "confirmed", "ready_for_pickup"].includes(status) &&
		payment === "verified"
	)
		return "refund_pending";
	throw new Error(
		"Cannot cancel this stage. Review submitted payments first; delivered and refunded orders are final."
	);
}

export async function manageOrder(
	orderNumber: string,
	actorEmail: string,
	action: "confirm" | "cancel",
	reason: string
): Promise<boolean> {
	if (
		typeof reason !== "string" ||
		reason.trim().length < 3 ||
		reason.trim().length > 1000
	)
		throw new Error("Enter a reason between 3 and 1,000 characters.");
	await connectDatabase();
	const session = await mongoose.startSession();
	let changed = false;
	try {
		await session.withTransaction(async () => {
			changed = false;
			const order = await Order.findOne({ orderNumber }).session(session);
			if (!order) throw new Error("Order not found.");
			if (
				action === "cancel" &&
				(order.status === "cancelled" ||
					(order.status === "refund_pending" && order.cancelledAt))
			)
				return;
			if (action === "confirm" && order.status === "confirmed") return;
			let next: OrderStatus;
			if (action === "confirm") {
				if (
					order.status !== "paid_waiting_moq" ||
					order.paymentStatus !== "verified"
				)
					throw new Error(
						"Only an explicitly verified, paid order can be confirmed."
					);
				next = "confirmed";
			} else next = cancellationStatus(order.status, order.paymentStatus);
			const result = await Order.updateOne(
				{
					_id: order._id,
					status: order.status,
					paymentStatus: order.paymentStatus
				},
				{
					$set: {
						status: next,
						...(action === "cancel"
							? {
									cancelledAt: new Date(),
									cancelledBy: actorEmail,
									cancellationReason: reason.trim()
								}
							: {})
					}
				},
				{ session }
			);
			if (result.modifiedCount !== 1)
				throw new Error("Order changed during review. Refresh and try again.");
			if (action === "cancel" && next === "refund_pending") {
				const quantities = groupCampaignQuantities(
					order.items.map((item) => ({
						campaignId: item.campaignId.toString(),
						quantity: item.quantity
					}))
				);
				for (const [campaignId, quantity] of quantities) {
					await Campaign.updateOne(
						{ _id: campaignId },
						[
							{
								$set: {
									paidQuantity: { $max: [0, { $subtract: ["$paidQuantity", quantity] }] }
								}
							}
						],
						{ session }
					);
				}
			}
			await AuditLog.create(
				[
					{
						actorEmail,
						action: action === "cancel" ? "order_cancelled" : "order_confirmed",
						entityType: "order",
						entityId: orderNumber,
						metadata: { from: order.status, to: next, reason: reason.trim() }
					}
				],
				{ session }
			);
			changed = true;
		});
	} finally {
		await session.endSession();
	}
	return changed;
}
