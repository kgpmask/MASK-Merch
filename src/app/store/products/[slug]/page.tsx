import { notFound } from "next/navigation";
import MOQProgress from "@/components/store/MOQProgress";
import StatusBadge from "@/components/store/StatusBadge";
import VariantSelector from "@/components/store/VariantSelector";
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
				<div className={styles.artLarge}>
					<span>FINAL ARTWORK / MOCKUP PLACEHOLDER</span>
					<strong>{product.title}</strong>
				</div>
				<section className={styles.details}>
					<p className={styles.kicker}>{product.artistCredit}</p>
					<h1>{product.title}</h1>
					<StatusBadge status={product.campaign.status} />
					<p>{product.description}</p>
					<MOQProgress
						paid={product.campaign.paidQuantity}
						moq={product.campaign.moq}
					/>
					<div className={styles.facts}>
						<div className={styles.fact}>
							<small>Preorder closes</small>
							<strong>
								{new Date(product.campaign.preorderClose).toLocaleDateString("en-IN", {
									dateStyle: "medium"
								})}
							</strong>
						</div>
						<div className={styles.fact}>
							<small>Collection</small>
							<strong>Gymkhana only</strong>
						</div>
						<div className={styles.fact}>
							<small>Material</small>
							<strong>Placeholder</strong>
						</div>
						<div className={styles.fact}>
							<small>Size chart</small>
							<strong>Placeholder</strong>
						</div>
					</div>
					<VariantSelector product={product} />
				</section>
			</div>
		</div>
	);
}
