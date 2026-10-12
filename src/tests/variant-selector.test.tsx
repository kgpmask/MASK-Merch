// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { designProducts } from "@/lib/store/design-files";
import VariantSelector from "@/components/store/VariantSelector";

const { add } = vi.hoisted(() => ({ add: vi.fn() }));
vi.mock("@/components/store/CartProvider", () => ({
	useCart: () => ({ add })
}));
afterEach(() => {
	cleanup();
	add.mockClear();
});

const defaults = {
	garmentType: "tshirt",
	sizes: ["S", "M"],
	pricePaise: 59900,
	oversizedPricePaise: 69900,
	colour: "Black",
	moq: 1,
	preorderClose: "2027-01-31T18:29:59.000Z"
};

describe("garment fit and size selection", () => {
	it("does not add a product without a back name", () => {
		const [product] = designProducts([{ folder: "1", files: ["front.png"] }], {
			defaults,
			designs: {}
		});
		render(createElement(VariantSelector, { product }));
		fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
		expect(add).not.toHaveBeenCalled();
		expect(screen.getByRole("alert").textContent).toContain("Enter the name");
	});
	it("preserves size when switching fits and adds the selected oversized variant at its configured price", () => {
		const [product] = designProducts([{ folder: "1", files: ["front.png"] }], {
			defaults,
			designs: {}
		});
		render(createElement(VariantSelector, { product }));
		fireEvent.change(screen.getByLabelText("Name to be displayed on the back"), {
			target: { value: "Arul" }
		});
		fireEvent.change(screen.getByLabelText("Size and colour"), {
			target: { value: "file-1-normal_tshirt-M" }
		});
		fireEvent.change(screen.getByLabelText("Fit"), {
			target: { value: "oversized_tshirt" }
		});
		expect(
			(screen.getByLabelText("Size and colour") as HTMLSelectElement).value
		).toBe("file-1-oversized_tshirt-M");
		fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
		expect(add).toHaveBeenCalledWith(
			expect.objectContaining({
				variantId: "file-1-oversized_tshirt-M",
				garmentType: "oversized_tshirt",
				size: "M",
				unitPricePaise: 69900
			})
		);
	});
	it("keeps hoodies fixed and offers only hoodie sizes", () => {
		const [product] = designProducts([{ folder: "2", files: ["front.png"] }], {
			defaults,
			designs: { "2": { garmentType: "hoodie" } }
		});
		render(createElement(VariantSelector, { product }));
		fireEvent.change(screen.getByLabelText("Name to be displayed on the back"), {
			target: { value: "Arul" }
		});
		expect(screen.queryByLabelText("Fit")).toBeNull();
		expect(screen.getByText("Hoodie")).toBeDefined();
		fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
		expect(add).toHaveBeenCalledWith(
			expect.objectContaining({
				garmentType: "hoodie",
				unitPricePaise: 59900,
				backName: "Arul"
			})
		);
	});
	it("switches to the oversized size list without retaining an unavailable normal size", () => {
		const [product] = designProducts([{ folder: "1", files: ["front.png"] }], {
			defaults,
			designs: {
				"1": {
					normalSizes: ["S", "M"],
					oversizedSizes: ["OS-S", "OS-L"],
					normalPricePaise: 49900,
					oversizedPricePaise: 79900
				}
			}
		});
		render(createElement(VariantSelector, { product }));
		fireEvent.change(screen.getByLabelText("Name to be displayed on the back"), {
			target: { value: "Arul" }
		});
		fireEvent.change(screen.getByLabelText("Size and colour"), {
			target: { value: "file-1-normal_tshirt-M" }
		});
		fireEvent.change(screen.getByLabelText("Fit"), {
			target: { value: "oversized_tshirt" }
		});
		const sizeSelect = screen.getByLabelText(
			"Size and colour"
		) as HTMLSelectElement;
		expect(Array.from(sizeSelect.options).map((option) => option.value)).toEqual([
			"file-1-oversized_tshirt-OS-S",
			"file-1-oversized_tshirt-OS-L"
		]);
		fireEvent.change(sizeSelect, {
			target: { value: "file-1-oversized_tshirt-OS-L" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
		expect(add).toHaveBeenCalledWith(
			expect.objectContaining({
				garmentType: "oversized_tshirt",
				size: "OS-L",
				unitPricePaise: 79900
			})
		);
	});
});
