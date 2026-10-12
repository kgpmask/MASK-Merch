import { Types } from "mongoose";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	products: vi.fn(),
	variants: vi.fn(),
	read: vi.fn(),
	sync: vi.fn(),
	connect: vi.fn()
}));
vi.mock("@/lib/database", () => ({ connectDatabase: mocks.connect }));
vi.mock("@/lib/store/design-files", () => ({ readDesignProducts: mocks.read }));
vi.mock("@/lib/store/design-sync", () => ({ syncDesignProducts: mocks.sync }));
vi.mock("@/models", () => ({
	Product: { find: mocks.products },
	Variant: { find: mocks.variants }
}));
import { getProducts } from "@/lib/store/catalog";

beforeEach(() => {
	vi.clearAllMocks();
	mocks.read.mockResolvedValue({ products: [], fingerprint: "test" });
});

it("keeps product/variant ordering", async () => {
	const productId = new Types.ObjectId();
	const otherId = new Types.ObjectId();
	mocks.products.mockReturnValue({
		sort: () => ({
			lean: async () => [
				{
					_id: productId,
					title: "Design",
					slug: "design",
					images: [],
					artistCredit: "MASK",
					description: "Test"
				},
				{ _id: otherId, title: "No idk", slug: "other", images: [] }
			]
		})
	});
	const variants = ["L", "S"].map((size) => ({
		_id: new Types.ObjectId(),
		productId,
		garmentType: "normal_tshirt",
		size,
		colour: "Black",
		pricePaise: 59900,
		sku: size
	}));
	mocks.variants.mockReturnValue({ lean: async () => variants });
	const products = await getProducts();
	expect(products).toHaveLength(2);
	expect(products[0].id).toBe(productId.toString());
	expect(products[0].variants.map((variant) => variant.size)).toEqual([
		"L",
		"S"
	]);
	expect(products[0].variants.map((variant) => variant.pricePaise)).toEqual([
		59900, 59900
	]);
});
