import { Types } from "mongoose";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	products: vi.fn(),
	variants: vi.fn(),
	campaigns: vi.fn(),
	read: vi.fn(),
	sync: vi.fn(),
	connect: vi.fn()
}));
vi.mock("@/lib/database", () => ({ connectDatabase: mocks.connect }));
vi.mock("@/lib/store/design-files", () => ({ readDesignProducts: mocks.read }));
vi.mock("@/lib/store/design-sync", () => ({ syncDesignProducts: mocks.sync }));
vi.mock("@/models", () => ({
	Product: { find: mocks.products },
	Variant: { find: mocks.variants },
	Campaign: { find: mocks.campaigns }
}));
import { getProducts } from "@/lib/store/catalog";

beforeEach(() => {
	vi.clearAllMocks();
	mocks.read.mockResolvedValue({ products: [], fingerprint: "test" });
});

it("keeps product/variant ordering, first campaign selection and omission of campaign-less products", async () => {
	const productId = new Types.ObjectId();
	const otherId = new Types.ObjectId();
	const firstCampaignId = new Types.ObjectId();
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
				{ _id: otherId, title: "No campaign", slug: "other", images: [] }
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
	mocks.campaigns.mockReturnValue({
		lean: async () => [
			{
				_id: firstCampaignId,
				productId,
				moq: 1,
				paidQuantity: 2,
				preorderClose: new Date("2027-01-01"),
				status: "open"
			},
			{
				_id: new Types.ObjectId(),
				productId,
				moq: 10,
				paidQuantity: 0,
				preorderClose: new Date("2027-01-01"),
				status: "closed"
			}
		]
	});
	const products = await getProducts();
	expect(products).toHaveLength(1);
	expect(products[0].id).toBe(productId.toString());
	expect(products[0].campaign.id).toBe(firstCampaignId.toString());
	expect(products[0].campaign.paidQuantity).toBe(2);
	expect(products[0].variants.map((variant) => variant.size)).toEqual([
		"L",
		"S"
	]);
	expect(products[0].variants.map((variant) => variant.pricePaise)).toEqual([
		59900, 59900
	]);
});
