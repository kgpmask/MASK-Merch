import Link from "next/link";
import { notFound } from "next/navigation";
import { guardAdminPage } from "@/lib/store/admin";
import { connectDatabase } from "@/lib/database";
import { AuditLog, Order, Payment } from "@/models";
import { formatMoney, garmentLabels } from "@/lib/store/config";
import AdminOrderActions from "@/components/store/AdminOrderActions";
import StatusBadge from "@/components/store/StatusBadge";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "./OrderReview.module.css";

const date = (value?: Date): string =>
	value
		? `${value.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
		: "Not recorded";

export default async function AdminOrderPage({
	params
}: {
	params: Promise<{ orderNumber: string }>;
}): Promise<React.ReactElement> {
	await guardAdminPage();
	const { orderNumber } = await params;
	await connectDatabase();
	const order = await Order.findOne({ orderNumber }).lean();
	if (!order) notFound();
	const [payment, history] = await Promise.all([
		Payment.findOne({ orderId: order._id }).lean(),
		AuditLog.find({ entityType: "order", entityId: orderNumber })
			.sort({ createdAt: -1, _id: -1 })
			.lean()
	]);
	return (
		<div className={pageStyles.page}>
			<Link href="/store/admin/orders">← All orders</Link>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Private order review</p>
				<h1>{order.orderNumber}</h1>
				<StatusBadge status={order.status} />
			</header>
			<div className={styles.layout}>
				<div>
					<section className={styles.section}>
						<h2>Customer & order</h2>
						<dl className={styles.details}>
							<dt>Name</dt>
							<dd>{order.user.name}</dd>
							<dt>Email</dt>
							<dd>{order.user.email}</dd>
							<dt>Created</dt>
							<dd>{date(order.createdAt)}</dd>
							<dt>Last updated</dt>
							<dd>{date(order.updatedAt)}</dd>
							<dt>Policy accepted</dt>
							<dd>{date(order.policyAcceptedAt)}</dd>
							<dt>Order total</dt>
							<dd>
								<strong>{formatMoney(order.totalPaise)}</strong>
							</dd>
							<dt>Ready</dt>
							<dd>{date(order.readyAt)}</dd>
							<dt>Collected / delivered</dt>
							<dd>{date(order.collectedAt)}</dd>
							{order.cancelledAt && (
								<>
									<dt>Cancelled</dt>
									<dd>
										{date(order.cancelledAt)} by {order.cancelledBy}
									</dd>
									<dt>Cancellation reason</dt>
									<dd>{order.cancellationReason}</dd>
								</>
							)}
						</dl>
					</section>
					<section className={styles.section}>
						<h2>Ordered items</h2>
						<p>
							Original item and price snapshots; later catalogue edits do not change
							this order.
						</p>
						{order.items.map((item, index) => (
							<article
								className={styles.item}
								key={index}
							>
								<h3>{item.productTitle}</h3>
								<dl className={styles.details}>
									<dt>Garment / size</dt>
									<dd>
										{garmentLabels[item.garmentType]} / {item.size}
									</dd>
									<dt>Colour / SKU</dt>
									<dd>
										{item.colour} / {item.sku}
									</dd>
									<dt>Name on back</dt>
									<dd>
										<strong>{item.backName || "Not recorded (legacy order)"}</strong>
									</dd>
									<dt>Quantity / unit price</dt>
									<dd>
										{item.quantity} × {formatMoney(item.unitPricePaise)}
									</dd>
									<dt>Line total</dt>
									<dd>{formatMoney(item.quantity * item.unitPricePaise)}</dd>
									<dt>Design</dt>
									<dd>
										<Link href={`/store/products/${item.productSlug}`}>
											{item.productSlug}
										</Link>
									</dd>
									<dt>Product / variant ID</dt>
									<dd>
										{String(item.productId)} / {String(item.variantId)}
									</dd>
								</dl>
							</article>
						))}
					</section>
					<section className={styles.section}>
						<h2>Payment evidence</h2>
						<p>
							Compare these submitted details against actual authorised bank/UPI
							history. This dashboard does not access your bank account.
						</p>
						<dl className={styles.details}>
							<dt>Payment status</dt>
							<dd>{order.paymentStatus}</dd>
							<dt>Expected amount</dt>
							<dd>{formatMoney(order.totalPaise)}</dd>
							<dt>Recorded amount</dt>
							<dd>
								{payment ? formatMoney(payment.amountPaise) : "No payment record"}
							</dd>
							<dt>UTR / reference</dt>
							<dd>{payment?.utr || "Not submitted"}</dd>
							<dt>Payer name</dt>
							<dd>{payment?.payerName || "Not submitted"}</dd>
							<dt>Transaction time</dt>
							<dd>{date(payment?.transactionAt)}</dd>
							<dt>Proof submitted</dt>
							<dd>{date(payment?.submittedAt)}</dd>
							<dt>Verified at</dt>
							<dd>{date(payment?.verifiedAt)}</dd>
							<dt>Reviewed by</dt>
							<dd>{payment?.verifierEmail || "Not reviewed"}</dd>
							<dt>Rejected at / reason</dt>
							<dd>
								{date(payment?.rejectedAt)} / {payment?.rejectionReason || "—"}
							</dd>
						</dl>
						{payment?.proofKey ? (
							<a
								href={`/api/store/payment-proof/${orderNumber}`}
								target="_blank"
								rel="noopener noreferrer"
								className={styles.proofLink}
							>
								<img
									className={styles.proof}
									src={`/api/store/payment-proof/${orderNumber}`}
									alt={`Private payment screenshot for ${orderNumber}`}
								/>
								<span>Open full-size private screenshot ↗</span>
							</a>
						) : (
							<p>No payment screenshot submitted.</p>
						)}
					</section>
					<section className={styles.section}>
						<h2>Refund record</h2>
						<dl className={styles.details}>
							<dt>Refund UTR</dt>
							<dd>{payment?.refundUtr || "Not recorded"}</dd>
							<dt>Amount</dt>
							<dd>
								{payment?.refundAmountPaise !== undefined
									? formatMoney(payment.refundAmountPaise)
									: "Not recorded"}
							</dd>
							<dt>Sent at</dt>
							<dd>{date(payment?.refundedAt)}</dd>
							<dt>Operator</dt>
							<dd>{payment?.refundOperator || "Not recorded"}</dd>
						</dl>
					</section>
					<section className={styles.section}>
						<h2>History</h2>
						<ol className={styles.history}>
							{history.map((entry) => (
								<li key={String(entry._id)}>
									<strong>{entry.action.replaceAll("_", " ")}</strong>
									<p>
										{date(entry.createdAt)} · {entry.actorEmail}
									</p>
									<pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
								</li>
							))}
							<li>
								<strong>Order created</strong>
								<p>
									{date(order.createdAt)} · {order.user.email}
								</p>
							</li>
						</ol>
					</section>
				</div>
				<aside className={styles.controls}>
					<h2>Manage order</h2>
					<p>
						Only valid next stages are offered. Financial and final fulfilment states
						cannot be bypassed.
					</p>
					<AdminOrderActions
						orderNumber={order.orderNumber}
						status={order.status}
						totalPaise={order.totalPaise}
					/>
				</aside>
			</div>
		</div>
	);
}
