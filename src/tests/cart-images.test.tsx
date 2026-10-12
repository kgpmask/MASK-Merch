// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import CartPageClient from "@/components/store/CartPageClient";

vi.mock("@/components/store/CartProvider", () => ({
	useCart: () => ({
		lines: [
			{
				variantId: "v1",
				productSlug: "1",
				productTitle: "Design 1",
				garmentType: "normal_tshirt",
				size: "M",
				colour: "Black",
				sku: "MASK-1",
				unitPricePaise: 59900,
				quantity: 1
			}
		],
		update: vi.fn(),
		remove: vi.fn()
	})
}));
afterEach(cleanup);
it("shows catalogue artwork for existing cart lines without stored images", () => {
	render(
		createElement(CartPageClient, {
			productImages: { "1": "/api/store/designs/1/01.png" }
		})
	);
	expect(screen.getByRole("img", { name: "Design 1" }).getAttribute("src")).toBe(
		"/api/store/designs/1/01.png"
	);
	expect(
		screen.getByRole("link", { name: "View Design 1" }).getAttribute("href")
	).toBe("/store/products/1");
});
it("retains the cart when a product has no available artwork", () => {
	render(createElement(CartPageClient, { productImages: {} }));
	expect(screen.getByText("MASK")).toBeDefined();
	expect(
		screen.getByRole("link", { name: "Continue to checkout" })
	).toBeDefined();
});
