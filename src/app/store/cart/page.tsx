import CartPageClient from "@/components/store/CartPageClient";
import styles from "@/styles/StorePage.module.css";
export default function CartPage(): React.ReactElement {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Your selections</p>
				<h1>Cart</h1>
				<p>
					Mix designs and garment types in one order. Paid quantities contribute to
					each design’s campaign separately.
				</p>
			</header>
			<CartPageClient />
		</div>
	);
}
