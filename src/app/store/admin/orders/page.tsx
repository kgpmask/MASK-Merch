import Link from "next/link";
import { connectDatabase } from "@/lib/database";
import { guardAdminPage } from "@/lib/store/admin";
import { Order, Payment } from "@/models";
import { formatMoney, garmentLabels } from "@/lib/store/config";
import StatusBadge from "@/components/store/StatusBadge";
import { ORDER_STATUSES } from "@/types/store";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Admin.module.css";

export default async function AdminOrdersPage({
	searchParams
}: {
	searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}): Promise<React.ReactElement> {
	await guardAdminPage();
	const { q = "", status = "", page = "1" } = await searchParams;
	const currentPage = Math.max(
		1,
		Math.min(100000, Number.parseInt(page, 10) || 1)
	);
	await connectDatabase();
	const safe = q.slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const filter: Record<string, unknown> = {};
	if (safe)
		filter.$or = [
			{ orderNumber: { $regex: safe, $options: "i" } },
			{ "user.name": { $regex: safe, $options: "i" } },
			{ "user.email": { $regex: safe, $options: "i" } }
		];
	if (ORDER_STATUSES.some((item) => item === status)) filter.status = status;
	const [orders, count] = await Promise.all([
		Order.find(filter)
			.sort({ createdAt: -1, _id: -1 })
			.skip((currentPage - 1) * 50)
			.limit(50)
			.lean(),
		Order.countDocuments(filter)
	]);
	const payments = await Payment.find({
		orderId: { $in: orders.map((item) => item._id) }
	}).lean();
	const paymentByOrder = new Map(
		payments.map((item) => [item.orderId.toString(), item])
	);
	const pageLink = (number: number): string =>
		`/store/admin/orders?${new URLSearchParams({ q, status, page: String(number) })}`;
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Verification, fulfilment and refunds</p>
				<h1>Orders</h1>
				<p>
					Open an order to review every item, inspect payment proof, change its stage
					or cancel it. Screenshots alone never verify payment.
				</p>
			</header>
			<form className={styles.search}>
				<input
					name="q"
					defaultValue={q}
					aria-label="Search orders"
					placeholder="Name, email or MS-20261012-1042"
					maxLength={200}
				/>
				<select
					name="status"
					defaultValue={status}
					aria-label="Filter by order status"
				>
					<option value="">All statuses</option>
					{ORDER_STATUSES.map((item) => (
						<option
							value={item}
							key={item}
						>
							{item.replaceAll("_", " ")}
						</option>
					))}
				</select>
				<button>Search</button>
				<a
					className={styles.download}
					href="/api/store/admin/export/pickup"
				>
					Pickup CSV
				</a>
			</form>
			<p className={styles.resultCount}>
				{count} matching orders · Page {currentPage} of{" "}
				{Math.max(1, Math.ceil(count / 50))}
			</p>
			<div className={styles.tableWrap}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Order ID</th>
							<th>Customer</th>
							<th>Items</th>
							<th>Payment evidence</th>
							<th>Total / status</th>
							<th>Review</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((order) => {
							const payment = paymentByOrder.get(order._id.toString());
							return (
								<tr key={order.orderNumber}>
									<td>
										<Link href={`/store/admin/orders/${order.orderNumber}`}>
											<strong>{order.orderNumber}</strong>
										</Link>
									</td>
									<td>
										<p>
											{order.user.name}
											<br />
											{order.user.email}
										</p>
										<small>
											{order.createdAt.toLocaleString("en-IN", {
												timeZone: "Asia/Kolkata"
											})}{" "}
											IST
										</small>
									</td>
									<td>
										{order.items.map((item, index) => (
											<p key={index}>
												{item.productTitle}
												<br />
												{garmentLabels[item.garmentType]} / {item.size} / {item.colour} ×{" "}
												{item.quantity}
												<br />
												Name on back: {item.backName || "Not recorded (legacy order)"}
											</p>
										))}
									</td>
									<td>
										UTR: {payment?.utr ?? "Not submitted"}
										<br />
										Payer: {payment?.payerName ?? "—"}
										<br />
										Time:{" "}
										{payment?.transactionAt?.toLocaleString("en-IN", {
											timeZone: "Asia/Kolkata"
										}) ?? "—"}
										{payment?.transactionAt ? " IST" : ""}
										<br />
										Payment: {order.paymentStatus}
									</td>
									<td>
										<strong>{formatMoney(order.totalPaise)}</strong>
										<br />
										<StatusBadge status={order.status} />
									</td>
									<td>
										<Link href={`/store/admin/orders/${order.orderNumber}`}>
											Review / manage order →
										</Link>
									</td>
								</tr>
							);
						})}
						{orders.length === 0 && (
							<tr>
								<td colSpan={6}>No orders match this search.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<nav
				className={styles.nav}
				aria-label="Order pages"
			>
				{currentPage > 1 && (
					<Link href={pageLink(currentPage - 1)}>← Previous</Link>
				)}
				{currentPage * 50 < count && (
					<Link href={pageLink(currentPage + 1)}>Next →</Link>
				)}
			</nav>
		</div>
	);
}
