import CartPageClient from "@/components/store/CartPageClient";
import { getProducts } from "@/lib/store/catalog";
import styles from "@/styles/StorePage.module.css";
export const dynamic = "force-dynamic";
export default async function CartPage(): Promise<React.ReactElement> {
	const products = await getProducts();
	const productImages = Object.fromEntries(
		products.map((product) => [product.slug, product.images[0] ?? ""])
	);
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Your selections</p>
				<h1>Cart</h1>
				<p>Review your designs, fits, sizes and quantities before checkout.</p>
			</header>
			<CartPageClient productImages={productImages} />
		</div>
	);
}
