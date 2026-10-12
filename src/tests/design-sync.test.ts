import { describe, expect, it, vi } from "vitest";
import { designProducts } from "@/lib/store/design-files";

vi.mock("@/models", () => ({
	Product: {
		findOneAndUpdate: vi.fn().mockResolvedValue({ _id: "product-id" })
	},
	Variant: {
		findOneAndUpdate: vi.fn().mockResolvedValue({}),
		updateMany: vi.fn().mockResolvedValue({})
	}
}));

import { Product, Variant } from "@/models";
import { syncDesignProducts } from "@/lib/store/design-sync";

describe("design database sync", () => {
	it("preserves paid counts, retires other garments, and skips duplicate sync", async () => {
		const products = designProducts(
			[{ folder: "new-design", files: ["front.png", "back.png"] }],
			{
				defaults: {
					garmentType: "hoodie",
					sizes: ["M", "L"],
					colour: "Black",
					pricePaise: 119900,
					material: "Cotton",
					gsm: 320,
					moq: 5,
					preorderClose: "2027-01-31T18:29:59.000Z"
				},
				designs: {}
			}
		);
		await Promise.all([
			syncDesignProducts(products, "first"),
			syncDesignProducts(products, "first")
		]);
		expect(Product.findOneAndUpdate).toHaveBeenCalledTimes(1);
		expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
			{ slug: "new-design" },
			expect.objectContaining({
				$set: expect.objectContaining({
					material: "Cotton",
					gsm: 320,
					images: [
						"/api/store/designs/new-design/back.png",
						"/api/store/designs/new-design/front.png"
					]
				})
			}),
			{ upsert: true, returnDocument: "after" }
		);
		expect(Variant.updateMany).toHaveBeenCalledWith(
			{
				productId: "product-id",
				$nor: [
					{ garmentType: "hoodie", size: "M", colour: "Black" },
					{ garmentType: "hoodie", size: "L", colour: "Black" }
				]
			},
			{ $set: { active: false } }
		);
	});
});
