import Link from "next/link";
import { connectDatabase } from "@/lib/database";
import { Order } from "@/models";
import { formatMoney } from "@/lib/store/config";
import StatusBadge from "@/components/store/StatusBadge";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Admin.module.css";

export default async function AdminPage(): Promise<React.ReactElement> {
	await connectDatabase();
	const [statusCounts, valueTotals, recent] = await Promise.all([
		Order.aggregate<{ _id: string; count: number }>([
			{ $group: { _id: "$status", count: { $sum: 1 } } }
		]),
		Order.aggregate<{ _id: string; amount: number }>([
			{ $match: { paymentStatus: "verified" } },
			{ $group: { _id: "$status", amount: { $sum: "$totalPaise" } } }
		]),
		Order.find().sort({ createdAt: -1, _id: -1 }).limit(8).lean()
	]);
	const count = new Map(statusCounts.map((item) => [item._id, item.count]));
	const amount = new Map(valueTotals.map((item) => [item._id, item.amount]));
	const verifiedValue = [...amount.values()].reduce(
		(sum, value) => sum + value,
		0
	);
	const refundValue = amount.get("refund_pending") ?? 0;
	const metrics: Array<[string, number | string, string?]> = [
		[
			"Needs payment review",
			count.get("payment_submitted") ?? 0,
			"status=payment_submitted"
		],
		["Awaiting confirmation", count.get("confirmed") ?? 0, "status=confirmed"],
		[
			"Refunds to send",
			count.get("refund_pending") ?? 0,
			"status=refund_pending"
		],
		[
			"Ready for collection",
			count.get("ready_for_pickup") ?? 0,
			"status=ready_for_pickup"
		],
		["Verified order value", formatMoney(verifiedValue)],
		["Pending refund value", formatMoney(refundValue), "status=refund_pending"]
	];
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Restricted MASK operations</p>
				<h1>Admin dashboard</h1>
				<p>
					Review the queues below. Never mark paid from a screenshot alone—match the
					submitted details against authorised UPI/bank history.
				</p>
			</header>
			<div className={styles.metrics}>
				{metrics.map(([label, value, query]) => (
					<div
						className={styles.metric}
						key={label}
					>
						<small>{label}</small>
						<strong>{value}</strong>
						{query && <Link href={`/store/admin/orders?${query}`}>Open queue →</Link>}
					</div>
				))}
			</div>
			<section className={styles.dashboardSection}>
				<div className={styles.sectionHeading}>
					<h2>Recent orders</h2>
					<Link href="/store/admin/orders">View all orders →</Link>
				</div>
				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Order</th>
								<th>Customer</th>
								<th>Amount</th>
								<th>Status</th>
								<th>Updated</th>
							</tr>
						</thead>
						<tbody>
							{recent.map((order) => (
								<tr key={order.orderNumber}>
									<td>
										<Link href={`/store/admin/orders/${order.orderNumber}`}>
											<strong>{order.orderNumber}</strong>
										</Link>
									</td>
									<td>
										{order.user.name}
										<br />
										<small>{order.user.email}</small>
									</td>
									<td>{formatMoney(order.totalPaise)}</td>
									<td>
										<StatusBadge status={order.status} />
									</td>
									<td>
										{order.updatedAt.toLocaleString("en-IN", {
											timeZone: "Asia/Kolkata"
										})}{" "}
										IST
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
