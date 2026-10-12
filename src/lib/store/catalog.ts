import { Types } from "mongoose";
import { connectDatabase } from "@/lib/database";
import {
	Campaign,
	Product,
	Variant,
	type CampaignDoc,
	type ProductDoc,
	type VariantDoc
} from "@/models";
import { placeholderProducts } from "@/lib/store/seed-data";
import type { StoreProduct } from "@/types/store";
import { readDesignProducts } from "@/lib/store/design-files";
import { syncDesignProducts } from "@/lib/store/design-sync";

type LeanProduct = ProductDoc & { _id: Types.ObjectId };
type LeanVariant = VariantDoc & { _id: Types.ObjectId };
type LeanCampaign = CampaignDoc & { _id: Types.ObjectId };

export async function getProducts(
	includeInactive = false
): Promise<StoreProduct[]> {
	const designs = await readDesignProducts();
	if (!process.env.MONGO_URL)
		return [
			...placeholderProducts.filter(
				(product) =>
					!designs.products.some((design) => design.slug === product.slug)
			),
			...designs.products
		];
	await connectDatabase();
	await syncDesignProducts(designs.products, designs.fingerprint);
	const products = await Product.find(includeInactive ? {} : { active: true })
		.sort({ sortOrder: 1, title: 1 })
		.lean<LeanProduct[]>();
	const productIds = products.map((item) => item._id);
	const [variants, campaigns] = await Promise.all([
		Variant.find({
			productId: { $in: productIds },
			...(includeInactive ? {} : { active: true })
		}).lean<LeanVariant[]>(),
		Campaign.find({
			productId: { $in: productIds },
			...(includeInactive ? {} : { status: { $ne: "draft" } })
		}).lean<LeanCampaign[]>()
	]);
	return products.flatMap((product) => {
		const campaign = campaigns.find((item) => item.productId.equals(product._id));
		if (!campaign) return [];
		return [
			{
				id: product._id.toString(),
				title: product.title,
				slug: product.slug,
				artistCredit: product.artistCredit,
				description: product.description,
				images: product.images,
				material: product.material,
				gsm: product.gsm,
				sizeChart: product.sizeChart
					? {
							image: product.sizeChart.image,
							columns: product.sizeChart.columns,
							rows: product.sizeChart.rows,
							note: product.sizeChart.note
						}
					: null,
				campaign: {
					id: campaign._id.toString(),
					moq: campaign.moq,
					paidQuantity: campaign.paidQuantity,
					preorderClose: campaign.preorderClose.toISOString(),
					status: campaign.status
				},
				variants: variants
					.filter((item) => item.productId.equals(product._id))
					.map((item) => ({
						id: item._id.toString(),
						garmentType: item.garmentType,
						size: item.size,
						colour: item.colour,
						pricePaise: item.pricePaise,
						sku: item.sku
					}))
			}
		];
	});
}

export async function getProduct(slug: string): Promise<StoreProduct | null> {
	return (await getProducts()).find((item) => item.slug === slug) ?? null;
}
