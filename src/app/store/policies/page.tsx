import Link from "next/link";
import styles from "@/styles/StorePage.module.css";
export default function PoliciesPage(): React.ReactElement {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Launch policy draft</p>
				<h1>Clear rules, no fine print.</h1>
				<p>
					This is an unofficial community merch store. These placeholders must be
					finalised by the store operators before launch.
				</p>
			</header>
			<div className={styles.policyCopy}>
				<section>
					<h2>Orders</h2>
					<p>Choose your design, fit and size, then pay by UPI.</p>
				</section>
				<section>
					<h2>Payment and refunds</h2>
					<p>
						If your order is not fulfilled, you will receive a full refund. No refunds
						after delivery.
					</p>
				</section>
				<section>
					<h2>Contact</h2>
					<p>
						For questions about your order or a refund,{" "}
						<Link href="/store/contact">contact the store team</Link>.
					</p>
				</section>
			</div>
		</div>
	);
}
