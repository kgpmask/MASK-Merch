import { connectDatabase } from "@/lib/database";
import { Product, Variant } from "@/models";
import ProductAdminForm from "@/components/store/ProductAdminForm";
import ProductAdminAction from "@/components/store/ProductAdminAction";
import ProductEditForm from "@/components/store/ProductEditForm";
import { garmentLabels } from "@/lib/store/config";
import pageStyles from "@/styles/StorePage.module.css";
import styles from "@/styles/Admin.module.css";
export default async function AdminProductsPage(): Promise<React.ReactElement> {
	await connectDatabase();
	const products = await Product.find().sort({ sortOrder: 1, title: 1 }).lean();
	const productIds = products.map((item) => item._id);
	const [variants] = await Promise.all([
		Variant.find({ productId: { $in: productIds } }).lean()
	]);
	return (
		<div className={pageStyles.page}>
			<header className={pageStyles.header}>
				<p className={pageStyles.kicker}>Catalogue management</p>
				<h1>Products</h1>
				<p>
					Create, edit, publish, archive and reorder designs. Replace all placeholder
					content before launch.
				</p>
			</header>
			<section className={pageStyles.section}>
				<div className={pageStyles.sectionHead}>
					<h2>Create product</h2>
				</div>
				<ProductAdminForm />
			</section>
			<section className={pageStyles.section}>
				<div className={styles.products}>
					{products.map((product) => {
						const productVariants = variants.filter(
							(item) => item.productId.toString() === product._id.toString()
						);
						return (
							<article
								className={styles.product}
								key={product.slug}
							>
								<div>
									<h2>{product.title}</h2>
									<p>
										/{product.slug} · {productVariants.length} variants ·{" "}
										{product.status ? "Published" : "Draft/archived"}
									</p>
									<details>
										<summary>Edit listing and prices</summary>
										<ProductEditForm
											product={{
												id: product._id.toString(),
												title: product.title,
												artistCredit: product.artistCredit,
												description: product.description,
												images: product.images
											}}
											variants={productVariants.map((variant) => ({
												id: variant._id.toString(),
												label: `${garmentLabels[variant.garmentType]} ${variant.size} ${variant.colour}`,
												pricePaise: variant.pricePaise,
												active: variant.active
											}))}
										/>
									</details>
								</div>
								<div className={styles.actions}>
									<ProductAdminAction
										productId={product._id.toString()}
										action={product.status ? "archive" : "publish"}
										label={product.status ? "Archive" : "Publish"}
									/>
									<ProductAdminAction
										productId={product._id.toString()}
										action="move_up"
										label="Move up"
									/>
									<ProductAdminAction
										productId={product._id.toString()}
										action="move_down"
										label="Move down"
									/>
								</div>
							</article>
						);
					})}
				</div>
			</section>
		</div>
	);
}
