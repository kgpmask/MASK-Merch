import AdminAction from "./AdminAction";
import type { OrderStatus } from "@/types/store";
import styles from "./AdminOrderActions.module.css";

export default function AdminOrderActions({
	orderNumber,
	status,
	totalPaise
}: {
	orderNumber: string;
	status: OrderStatus;
	totalPaise: number;
}): React.ReactElement {
	const endpoint = `/api/store/admin/orders/${orderNumber}`;
	const reason = [
		{ name: "reason", label: "Reason (required)", required: true }
	];
	const canCancel = [
		"payment_pending",
		"payment_rejected",
		"confirmed",
		"confirmed",
		"ready_for_pickup"
	].includes(status);
	return (
		<div className={styles.actions}>
			{status === "payment_submitted" && (
				<>
					<p>
						Match the UTR, exact amount, payer and transaction time against the
						authorised account history. A screenshot alone is not verification.
					</p>
					<AdminAction
						endpoint={endpoint}
						action="verify"
						label="Mark paid"
						confirmText="I have matched UTR, amount, payer and time against actual authorised bank/UPI history. Mark this payment verified?"
					/>
					<AdminAction
						endpoint={endpoint}
						action="reject"
						label="Reject payment"
						fields={reason}
						confirmText="Reject this submission? The reason will be visible to the customer."
					/>
					<p>
						To cancel, review this payment first: verify money actually received, or
						reject an invalid submission.
					</p>
				</>
			)}
			{status === "confirmed" && (
				<AdminAction
					endpoint={endpoint}
					action="confirm"
					label="Confirm order"
					fields={reason}
					confirmText="Confirm that MASK can fulfil every item in this paid order?"
				/>
			)}
			{status === "confirmed" && (
				<AdminAction
					endpoint={endpoint}
					action="ready"
					label="Mark ready for collection"
					confirmText="Are all items available and ready for this customer?"
				/>
			)}
			{status === "ready_for_pickup" && (
				<AdminAction
					endpoint={endpoint}
					action="collected"
					label="Mark collected / delivered"
					confirmText="Has the customer received every item? This is a final fulfilment status."
				/>
			)}
			{canCancel && (
				<details className={styles.cancel}>
					<summary>Cancel order</summary>
					<p>
						{["payment_pending", "payment_rejected"].includes(status)
							? "Cancel an unpaid order. First check the receiving account if the customer may already have paid."
							: "This paid order will become refund pending. No money is sent by this action."}
					</p>
					<AdminAction
						endpoint={endpoint}
						action="cancel"
						label="Cancel this order"
						fields={reason}
						confirmText="Cancel this order? Paid orders will require a full manual refund."
					/>
				</details>
			)}
			{status === "refund_pending" && (
				<>
					<p>
						Send the full refund from the authorised account first, then record the
						actual transaction below.
					</p>
					<AdminAction
						endpoint={endpoint}
						action="refund"
						label="Record completed refund"
						fields={[
							{ name: "refundUtr", label: "Refund UTR", required: true },
							{
								name: "amountPaise",
								label: "Amount (INR)",
								type: "number",
								step: "0.01",
								required: true,
								value: String(totalPaise / 100)
							},
							{
								name: "refundedAt",
								label: "Sent at (your local time)",
								type: "datetime-local",
								required: true
							}
						]}
						confirmText="Has the authorised account holder actually sent this full refund? This records the transfer; it does not send money."
					/>
				</>
			)}
			{["collected", "refunded", "cancelled"].includes(status) && (
				<p>This order is final. Its records and history remain available below.</p>
			)}
		</div>
	);
}
