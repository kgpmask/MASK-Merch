import { Product, Variant } from "@/models";
import type { StoreProduct } from "@/types/store";

let lastFingerprint = "";
let pending: Promise<void> | undefined;

export async function syncDesignProducts(
	products: StoreProduct[],
	fingerprint: string
): Promise<void> {
	if (pending) await pending;
	if (fingerprint === lastFingerprint) return;
	pending = (async () => {
		for (const item of products) {
			const product = await Product.findOneAndUpdate(
				{ slug: item.slug },
				{
					$set: {
						title: item.title,
						images: item.images,
						material: item.material,
						gsm: item.gsm,
						sizeChart: item.sizeChart,
						description: item.description,
						artistCredit: item.artistCredit
					},
					$setOnInsert: { active: true, sortOrder: 0 }
				},
				{ upsert: true, returnDocument: "after" }
			);
			for (const variant of item.variants) {
				await Variant.findOneAndUpdate(
					{
						productId: product._id,
						garmentType: variant.garmentType,
						size: variant.size,
						colour: variant.colour
					},
					{
						$set: { pricePaise: variant.pricePaise, active: true },
						$setOnInsert: { sku: variant.sku }
					},
					{ upsert: true }
				);
			}
			await Variant.updateMany(
				{
					productId: product._id,
					$nor: item.variants.map((variant) => ({
						garmentType: variant.garmentType,
						size: variant.size,
						colour: variant.colour
					}))
				},
				{ $set: { active: false } }
			);
		}
		lastFingerprint = fingerprint;
	})();
	try {
		await pending;
	} finally {
		pending = undefined;
	}
}
