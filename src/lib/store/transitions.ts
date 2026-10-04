import type { CampaignStatus, OrderStatus } from "@/types/store";

const orderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
	payment_pending: ["payment_submitted"],
	payment_submitted: ["payment_rejected", "paid_waiting_moq"],
	payment_rejected: [],
	paid_waiting_moq: ["confirmed", "refund_pending"],
	confirmed: ["ready_for_pickup"],
	ready_for_pickup: ["collected"],
	collected: [],
	refund_pending: ["refunded"],
	refunded: []
};
const campaignTransitions: Record<CampaignStatus, readonly CampaignStatus[]> = {
	draft: ["open"],
	open: ["MOQ_met", "MOQ_failed"],
	MOQ_met: ["vendor_ordered"],
	vendor_ordered: ["ready_for_pickup"],
	ready_for_pickup: ["closed"],
	closed: [],
	MOQ_failed: []
};
export const canTransitionOrder = (
	from: OrderStatus,
	to: OrderStatus
): boolean => orderTransitions[from].includes(to);
export const canTransitionCampaign = (
	from: CampaignStatus,
	to: CampaignStatus
): boolean => campaignTransitions[from].includes(to);
export const campaignOutcome = (
	paidQuantity: number,
	moq: number
): "MOQ_met" | "MOQ_failed" => (paidQuantity >= moq ? "MOQ_met" : "MOQ_failed");
export const shouldApplyPaymentVerification = (status: OrderStatus): boolean =>
	status === "payment_submitted";
export const shouldApplyRefund = (status: OrderStatus): boolean =>
	status === "refund_pending";
