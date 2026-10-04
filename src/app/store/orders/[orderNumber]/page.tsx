import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDatabase } from "@/lib/database";
import { Order, Payment } from "@/models";
import { formatMoney, garmentLabels, storeConfig } from "@/lib/store/config";
import StatusBadge from "@/components/store/StatusBadge";
import PaymentProofForm from "@/components/store/PaymentProofForm";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Orders.module.css";
export const dynamic = "force-dynamic";
export default async function OrderPage({
	params
}: {
	params: Promise<{ orderNumber: string }>;
}): Promise<React.ReactElement> {
	const session = await auth();
	if (!session?.user?.email) redirect("/store/orders");
	const { orderNumber } = await params;
	await connectDatabase();
	const order = await Order.findOne({
		orderNumber,
		"user.email": session.user.email.toLowerCase()
	}).lean();
	if (!order) notFound();
	const payment = await Payment.findOne({ orderId: order._id }).lean();
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Order receipt</p>
				<h1>{order.orderNumber}</h1>
				<StatusBadge status={order.status} />
			</header>
			<div className={styles.receipt}>
				<section className={styles.card}>
					<h2>Items</h2>
					{order.items.map((item) => (
						<div
							className={styles.row}
							key={item.sku}
						>
							<div>
								<strong>{item.productTitle}</strong>
								<p>
									{garmentLabels[item.garmentType]} · {item.size} · {item.colour} ·{" "}
									{item.sku}
								</p>
							</div>
							<span>
								{item.quantity} × {formatMoney(item.unitPricePaise)}
							</span>
						</div>
					))}
					<div className={`${styles.row} ${styles.total}`}>
						<strong>Total</strong>
						<strong>{formatMoney(order.totalPaise)}</strong>
					</div>
					<p className={styles.meta}>
						Ordered by {order.user.name} · {order.user.email}
					</p>
					{order.status === "payment_pending" && (
						<PaymentProofForm orderNumber={order.orderNumber} />
					)}
				</section>
				<aside className={styles.card}>
					<h2>Payment & fulfilment</h2>
					{order.status === "payment_pending" && (
						<>
							<img
								className={styles.qr}
								src={storeConfig.upiQrImageUrl}
								alt="Configured MASK UPI QR"
							/>
							<dl>
								<div>
									<dt>Pay exactly</dt>
									<dd>{formatMoney(order.totalPaise)}</dd>
								</div>
								<div>
									<dt>Recipient</dt>
									<dd>{storeConfig.upiRecipientName}</dd>
								</div>
								<div>
									<dt>UPI ID</dt>
									<dd>{storeConfig.upiId}</dd>
								</div>
								<div>
									<dt>UPI note</dt>
									<dd>{order.orderNumber}</dd>
								</div>
							</dl>
						</>
					)}
					<p className={styles.notice}>
						{order.status === "payment_submitted"
							? "Proof received. Payment is not verified until a MASK admin matches it to actual UPI/bank history."
							: order.status === "payment_rejected"
								? `Payment submission rejected: ${payment?.rejectionReason ?? "Contact MASK for details."}`
								: order.status === "refund_pending"
									? "The campaign missed MOQ. A full manual UPI refund is pending."
									: order.status === "refunded"
										? `Refund recorded${payment?.refundUtr ? ` with UTR ${payment.refundUtr}` : ""}.`
										: order.status === "ready_for_pickup"
											? "Ready for collection at Gymkhana. Bring a valid identity reference."
											: order.status === "collected"
												? "Collected at Gymkhana."
												: "Track this page for the next status update."}
					</p>
				</aside>
			</div>
		</div>
	);
}
