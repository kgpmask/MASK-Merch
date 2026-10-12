import { notFound } from "next/navigation";
import StatusBadge from "@/components/store/StatusBadge";
import VariantSelector from "@/components/store/VariantSelector";
import ProductGallery from "@/components/store/ProductGallery";
import ProductSizeChart from "@/components/store/ProductSizeChart";
import { getProduct } from "@/lib/store/catalog";
import styles from "@/styles/StorePage.module.css";
export const dynamic = "force-dynamic";
export default async function ProductPage({
	params
}: {
	params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
	const { slug } = await params;
	const product = await getProduct(slug);
	if (!product) notFound();
	return (
		<div className={styles.page}>
			<div className={styles.detail}>
				<ProductGallery
					images={product.images}
					title={product.title}
				/>
				<section className={styles.details}>
					<p className={styles.kicker}>{product.artistCredit}</p>
					<h1>{product.title}</h1>
					<StatusBadge status={product.campaign.status} />
					<p>{product.description}</p>
					<div className={styles.facts}>
						<div className={styles.fact}>
							<small>Material</small>
							<strong>{product.material ?? "To be confirmed"}</strong>
						</div>
						<div className={styles.fact}>
							<small>Fabric weight (GSM)</small>
							<strong>{product.gsm ? `${product.gsm} GSM` : "To be confirmed"}</strong>
						</div>
					</div>
					<VariantSelector product={product} />
					<a href="#size-chart">View size guide</a>
				</section>
			</div>
			<ProductSizeChart
				chart={product.sizeChart}
				title={product.title}
			/>
		</div>
	);
}
