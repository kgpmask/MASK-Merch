import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { connectDatabase } from "@/lib/database";
import { formatMoney } from "@/lib/store/config";
import { Order } from "@/models";
import StatusBadge from "@/components/store/StatusBadge";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Orders.module.css";
export const dynamic = "force-dynamic";
export default async function OrdersPage(): Promise<React.ReactElement> {
	const session = await auth();
	if (!session?.user?.email)
		return (
			<div className={pageStyles.page}>
				<header className={pageStyles.header}>
					<p className={pageStyles.kicker}>Student account</p>
					<h1>Your orders</h1>
				</header>
				<div className={pageStyles.empty}>
					<p>Sign in with the Google account used at checkout.</p>
					<form
						action={async () => {
							"use server";
							await signIn("google", { redirectTo: "/store/orders" });
						}}
					>
						<button className={pageStyles.primary}>Continue with Google</button>
					</form>
				</div>
			</div>
		);
	if (!process.env.MONGO_URL) redirect("/store");
	await connectDatabase();
	const orders = await Order.find({
		"user.email": session.user.email.toLowerCase()
	})
		.sort({ createdAt: -1 })
		.lean();
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Student account</p>
				<h1>Your orders</h1>
				<p>Payment, MOQ, refund and Gymkhana pickup status in one place.</p>
			</header>
			<div className={styles.list}>
				{orders.length ? (
					orders.map((order) => (
						<Link
							key={order.orderNumber}
							href={`/store/orders/${order.orderNumber}`}
							className={styles.order}
						>
							<div>
								<h2>{order.orderNumber}</h2>
								<p>
									{order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces ·{" "}
									{new Date(order.createdAt).toLocaleDateString("en-IN")}
								</p>
							</div>
							<strong>{formatMoney(order.totalPaise)}</strong>
							<StatusBadge status={order.status} />
						</Link>
					))
				) : (
					<div className={pageStyles.empty}>No orders yet.</div>
				)}
			</div>
		</div>
	);
}
