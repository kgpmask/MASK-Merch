import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/lib/database";
import { Product, Variant } from "../src/models";
import { placeholderProducts } from "../src/lib/store/seed-data";

config({ path: ".env.local" });

async function seed(): Promise<void> {
	await connectDatabase();
	for (const item of placeholderProducts) {
		const product = await Product.findOneAndUpdate(
			{ slug: item.slug },
			{
				$set: {
					title: item.title,
					artistCredit: item.artistCredit,
					description: item.description,
					images: item.images
				},
				$setOnInsert: { sortOrder: 0 }
			},
			{ upsert: true, new: true }
		);
		await Promise.all(
			item.variants.map((variant) =>
				Variant.findOneAndUpdate(
					{ sku: variant.sku },
					{
						$set: {
							productId: product._id,
							garmentType: variant.garmentType,
							size: variant.size,
							colour: variant.colour,
							pricePaise: variant.pricePaise
						}
					},
					{ upsert: true }
				)
			)
		);
		console.log(`Seeded ${product.slug}`);
	}
	await mongoose.disconnect();
}
seed().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
