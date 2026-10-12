import Link from "next/link";
import { getProducts } from "@/lib/store/catalog";
import ProductCard from "@/components/store/ProductCard";
import styles from "@/styles/StorePage.module.css";
export const dynamic = "force-dynamic";
export default async function StorePage(): Promise<React.ReactElement> {
	const products = await getProducts();
	const featured = products.find((product) => product.images.length > 0);
	return (
		<div className={styles.page}>
			<section className={styles.hero}>
				<div>
					<p className={styles.kicker}>Manga and Anime Society Kharagpur</p>
					<h1>
						MASK
						<br />
						<span>MERCH.</span>
					</h1>
					<p className={styles.heroCopy}>
						Designs from our community, off the canvas. Find your favourite artwork on
						a T-shirt, oversized fit or hoodie.
					</p>
					<div className={styles.heroActions}>
						<Link
							href="/store/products"
							className={styles.primary}
						>
							Explore the collection →
						</Link>
					</div>
				</div>
				{featured && (
					<Link
						href={`/store/products/${featured.slug}`}
						className={styles.featured}
					>
						<img
							src={featured.images[0]}
							alt={featured.title}
						/>
						<span>
							<small>From the collection</small>
							<strong>{featured.title}</strong>
							<b aria-hidden="true">↗</b>
						</span>
					</Link>
				)}
			</section>
			<aside
				className={styles.storeStrip}
				aria-label="Ordering information"
			>
				<strong>Choose a design. Find your fit.</strong>
				<p>
					Pay by UPI and submit your reference and proof. The store team verifies
					every payment before processing your order.
				</p>
				<Link href="/store/policies">How ordering works ↗</Link>
			</aside>
			<section className={styles.section}>
				<div className={styles.sectionHead}>
					<div>
						<p className={styles.kicker}>The collection</p>
						<h2>Designed by the MASK community</h2>
					</div>
					<Link href="/store/products">View catalogue →</Link>
				</div>
				<div className={`${styles.grid} ${styles.editorial}`}>
					{products.map((product) => (
						<ProductCard
							key={product.id}
							product={product}
						/>
					))}
				</div>
			</section>
		</div>
	);
}
