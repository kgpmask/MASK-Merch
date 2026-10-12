import { Types } from "mongoose";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	variants: vi.fn(),
	products: vi.fn(),
	orders: vi.fn(),
	create: vi.fn(),
	payment: vi.fn(),
	cart: vi.fn(),
	counter: vi.fn()
}));
vi.mock("@/lib/database", () => ({ connectDatabase: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdminApi: vi.fn() }));
vi.mock("@/models", () => ({
	Variant: { find: mocks.variants },
	Product: { find: mocks.products },
	Order: { find: mocks.orders, create: mocks.create },
	Payment: { create: mocks.payment },
	Cart: { findOneAndUpdate: mocks.cart },
	Counter: { findOneAndUpdate: mocks.counter },
	AuditLog: {}
}));
import { createOrder } from "@/lib/store/orders";
import { GET as exportVendor } from "@/app/api/store/admin/export/vendor/route";

const productId = new Types.ObjectId();
const variantId = new Types.ObjectId();
const variant = {
	_id: variantId,
	productId,
	garmentType: "normal_tshirt",
	size: "M",
	colour: "Black",
	sku: "MASK-1-M",
	pricePaise: 59900
};
const product = { _id: productId, title: "Design 1", slug: "1" };

beforeEach(() => {
	vi.clearAllMocks();
	mocks.variants.mockReturnValue({ lean: async () => [variant] });
	mocks.products.mockReturnValue({ lean: async () => [product] });
	mocks.counter.mockResolvedValue({ value: 1042 });
	mocks.create.mockResolvedValue({ _id: new Types.ObjectId() });
});

it("stores each back name in the order snapshot and saved cart without changing prices", async () => {
	const result = await createOrder(
		{ name: "Buyer", email: "buyer@example.invalid" },
		[
			{ variantId: variantId.toString(), quantity: 1, backName: "  Arul  " },
			{ variantId: variantId.toString(), quantity: 2, backName: "MASK" }
		],
		true
	);
	expect(result.orderNumber).toMatch(/^MS-\d{8}-1042$/);
	expect(result.totalPaise).toBe(179700);
	expect(mocks.create).toHaveBeenCalledWith(
		expect.objectContaining({
			items: [
				expect.objectContaining({
					backName: "Arul",
					quantity: 1,
					unitPricePaise: 59900
				}),
				expect.objectContaining({
					backName: "MASK",
					quantity: 2,
					unitPricePaise: 59900
				})
			]
		})
	);
	expect(mocks.cart).toHaveBeenCalledWith(
		expect.anything(),
		expect.objectContaining({
			$set: expect.objectContaining({
				items: [
					expect.objectContaining({ backName: "Arul" }),
					expect.objectContaining({ backName: "MASK" })
				]
			})
		}),
		{ upsert: true }
	);
});

it.each(["<script>", "", "   ", undefined])(
	"rejects invalid or missing names before persisting an order: %s",
	async (backName) => {
		await expect(
			createOrder(
				{ name: "Buyer", email: "buyer@example.invalid" },
				[{ variantId: variantId.toString(), quantity: 1, backName }],
				true
			)
		).rejects.toThrow();
		expect(mocks.create).not.toHaveBeenCalled();
	}
);

it("exports different names separately and groups identical names", async () => {
	const item = {
		productTitle: "Design 1",
		garmentType: "normal_tshirt",
		size: "M",
		sku: "MASK-1-M",
		quantity: 1
	};
	mocks.orders.mockReturnValue({
		lean: async () => [
			{
				items: [
					{ ...item, backName: "Arul" },
					{ ...item, backName: "MASK" }
				]
			},
			{ items: [{ ...item, backName: "Arul", quantity: 2 }, item] }
		]
	});
	const response = await exportVendor();
	expect(response.status).toBe(200);
	const csv = await response.text();
	expect(csv).toContain("Vendor Notes,Name on Back");
	expect(csv).toContain("Design 1,normal_tshirt,M,3,MASK-1-M,,Arul");
	expect(csv).toContain("Design 1,normal_tshirt,M,1,MASK-1-M,,MASK");
	expect(csv.split("\r\n")).toHaveLength(4);
});
