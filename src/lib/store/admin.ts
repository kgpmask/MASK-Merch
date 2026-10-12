import { redirect } from "next/navigation";
import { adminEmails, auth } from "@/lib/auth";
import mongoose from "mongoose";
import { connectDatabase } from "@/lib/database";
import { AuditLog, Order } from "@/models";
import type { OrderStatus, PaymentStatus } from "@/types/store";

export async function guardAdminPage(): Promise<{
	name: string;
	email: string;
}> {
	const session = await auth();
	if (
		!session?.user?.email ||
		!adminEmails().includes(session.user.email.toLowerCase())
	)
		redirect("/store");
	return {
		name: session.user.name ?? "MASK admin",
		email: session.user.email.toLowerCase()
	};
}

export function csvCell(value: string | number | null | undefined): string {
	const text = String(value ?? "");
	return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

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
		["confirmed", "confirmed", "ready_for_pickup"].includes(status) &&
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
				if (order.paymentStatus !== "verified")
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
