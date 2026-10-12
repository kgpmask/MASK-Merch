import type { OrderStatus } from "@/types/store";

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
	payment_pending: ["payment_submitted", "cancelled"],
	payment_submitted: ["payment_rejected"],
	payment_rejected: ["cancelled"],
	confirmed: ["ready_for_pickup", "refund_pending"],
	ready_for_pickup: ["collected", "refund_pending"],
	collected: [],
	refund_pending: ["refunded"],
	refunded: [],
	cancelled: []
};
export const canTransitionOrder = (
	from: OrderStatus,
	to: OrderStatus
): boolean => orderTransitions[from].includes(to);
export const shouldApplyPaymentVerification = (status: OrderStatus): boolean =>
	status === "payment_submitted";
export const shouldApplyRefund = (status: OrderStatus): boolean =>
	status === "refund_pending";
