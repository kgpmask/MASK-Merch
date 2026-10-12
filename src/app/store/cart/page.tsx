import CartPageClient from "@/components/store/CartPageClient";
import styles from "@/styles/StorePage.module.css";
export default function CartPage(): React.ReactElement {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Your selections</p>
				<h1>Cart</h1>
				<p>Review your designs, fits, sizes and quantities before checkout.</p>
			</header>
			<CartPageClient />
		</div>
	);
}
