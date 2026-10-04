import { connectDatabase } from "@/lib/database";
import { Order, Payment } from "@/models";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Admin.module.css";
export default async function AdminPage(): Promise<React.ReactElement> {
	await connectDatabase();
	const [paid, refunded, confirmed, ready, collected] = await Promise.all([
		Payment.countDocuments({ status: "verified" }),
		Order.countDocuments({ status: "refunded" }),
		Order.aggregate<{ total: number }>([
			{
				$match: { status: { $in: ["confirmed", "ready_for_pickup", "collected"] } }
			},
			{ $unwind: "$items" },
			{ $group: { _id: null, total: { $sum: "$items.quantity" } } }
		]),
		Order.aggregate<{ total: number }>([
			{ $match: { status: "ready_for_pickup" } },
			{ $unwind: "$items" },
			{ $group: { _id: null, total: { $sum: "$items.quantity" } } }
		]),
		Order.aggregate<{ total: number }>([
			{ $match: { status: "collected" } },
			{ $unwind: "$items" },
			{ $group: { _id: null, total: { $sum: "$items.quantity" } } }
		])
	]);
	const metrics = [
		["Verified payments", paid],
		["Refunded orders", refunded],
		["Confirmed pieces", confirmed[0]?.total ?? 0],
		["Ready pieces", ready[0]?.total ?? 0],
		["Collected pieces", collected[0]?.total ?? 0]
	];
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Restricted MASK operations</p>
				<h1>Admin dashboard</h1>
				<p>
					Never mark paid from a screenshot alone. Compare UTR, amount, payer and
					transaction time against authorised UPI/bank history.
				</p>
			</header>
			<div className={styles.metrics}>
				{metrics.map(([label, value]) => (
					<div
						className={styles.metric}
						key={label}
					>
						<small>{label}</small>
						<strong>{value}</strong>
					</div>
				))}
			</div>
		</div>
	);
}
