import ProductCard from "@/components/store/ProductCard";
import { getProducts } from "@/lib/store/catalog";
import styles from "@/styles/StorePage.module.css";
export const dynamic = "force-dynamic";
export default async function ProductsPage({
	searchParams
}: {
	searchParams: Promise<{ type?: string }>;
}): Promise<React.ReactElement> {
	const { type } = await searchParams;
	const products = await getProducts();
	const filtered = type
		? products.filter((product) =>
				product.variants.some((variant) => variant.garmentType === type)
			)
		: products;
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>The catalogue</p>
				<h1>The collection.</h1>
				<p>
					Normal T-shirts, oversized fits and hoodies. Choose your design, fit and
					size.
				</p>
			</header>
			<nav
				className={styles.filters}
				aria-label="Catalogue filters"
			>
				<a
					href="/store/products"
					aria-current={!type ? "page" : undefined}
				>
					All
				</a>
				<a
					href="?type=normal_tshirt"
					aria-current={type === "normal_tshirt" ? "page" : undefined}
				>
					Normal T-shirts
				</a>
				<a
					href="?type=oversized_tshirt"
					aria-current={type === "oversized_tshirt" ? "page" : undefined}
				>
					Oversized
				</a>
				<a
					href="?type=hoodie"
					aria-current={type === "hoodie" ? "page" : undefined}
				>
					Hoodies
				</a>
			</nav>
			<div className={styles.grid}>
				{filtered.map((product) => (
					<ProductCard
						key={product.id}
						product={product}
					/>
				))}
			</div>
		</div>
	);
}
