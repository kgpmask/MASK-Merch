import { describe, expect, it } from "vitest";
import { designProducts, type DesignFolder } from "@/lib/store/design-files";

const defaults = {
	garmentType: "normal_tshirt",
	sizes: ["S", "M"],
	colour: "Black",
	pricePaise: 59900,
	moq: 1,
	preorderClose: "2027-01-31T18:29:59.000Z",
	material: "To be confirmed",
	gsm: null
};
const folder: DesignFolder = {
	folder: "1",
	files: ["02-back.png", "01-front.png", "source.psd"]
};

describe("design folder catalogue", () => {
	it("groups front/back images and keeps hoodies fixed while T-shirts offer both fits", () => {
		const products = designProducts(
			[folder, { folder: "2", files: ["01.webp"] }],
			{
				defaults,
				designs: {
					"1": {
						garmentType: "hoodie",
						pricePaise: 119900,
						material: "Cotton",
						gsm: 320
					}
				}
			}
		);
		expect(products).toHaveLength(2);
		expect(products[0].slug).toBe("1");
		expect(products[0].variants.map((item) => item.garmentType)).toEqual([
			"hoodie",
			"hoodie"
		]);
		expect(products[0].variants.map((item) => item.size)).toEqual(["S", "M"]);
		expect(products[0].variants[0].pricePaise).toBe(119900);
		expect(products[0].material).toBe("Cotton");
		expect(products[0].gsm).toBe(320);
		expect(products[1].variants[0].garmentType).toBe("normal_tshirt");
		expect(products[1].variants.map((variant) => variant.garmentType)).toEqual([
			"normal_tshirt",
			"normal_tshirt",
			"oversized_tshirt",
			"oversized_tshirt"
		]);
		expect(products[0].images).toEqual([
			"/api/store/designs/1/01-front.png",
			"/api/store/designs/1/02-back.png"
		]);
	});
	it("supports individual normal and oversized prices for a T-shirt design", () => {
		const [product] = designProducts([folder], {
			defaults,
			designs: {
				"1": {
					garmentType: "tshirt",
					pricePaise: 59900,
					oversizedPricePaise: 69900
				}
			}
		});
		expect(
			product.variants
				.filter((variant) => variant.garmentType === "normal_tshirt")
				.map((variant) => variant.pricePaise)
		).toEqual([59900, 59900]);
		expect(
			product.variants
				.filter((variant) => variant.garmentType === "oversized_tshirt")
				.map((variant) => variant.pricePaise)
		).toEqual([69900, 69900]);
		expect(() =>
			designProducts([folder], {
				defaults,
				designs: { "1": { oversizedPricePaise: -1 } }
			})
		).toThrow("Oversized price");
	});
	it("uses independent size names, lists and prices for each fit", () => {
		const [product] = designProducts([folder], {
			defaults,
			designs: {
				"1": {
					garmentType: "tshirt",
					normalSizes: ["S", "M"],
					oversizedSizes: ["OS Small", "OS Large"],
					normalPricePaise: 49900,
					oversizedPricePaise: 79900
				}
			}
		});
		expect(
			product.variants.map(({ garmentType, size, pricePaise }) => ({
				garmentType,
				size,
				pricePaise
			}))
		).toEqual([
			{ garmentType: "normal_tshirt", size: "S", pricePaise: 49900 },
			{ garmentType: "normal_tshirt", size: "M", pricePaise: 49900 },
			{ garmentType: "oversized_tshirt", size: "OS Small", pricePaise: 79900 },
			{ garmentType: "oversized_tshirt", size: "OS Large", pricePaise: 79900 }
		]);
		expect(() =>
			designProducts([folder], {
				defaults,
				designs: { "1": { oversizedSizes: ["OS Small", "OS Small"] } }
			})
		).toThrow("duplicate sizes");
	});
	it("detects a chart image separately from garment gallery images", () => {
		const [product] = designProducts(
			[{ ...folder, files: [...folder.files, "size-chart.png"] }],
			{ defaults, designs: {} }
		);
		expect(product.sizeChart?.image).toBe("/api/store/designs/1/size-chart.png");
		expect(product.images).toHaveLength(2);
	});
	it("supports configured chart image and table measurements together", () => {
		const chart = {
			image: "measurements.webp",
			columns: ["Size", "Chest (cm)"],
			rows: [["M", "50"]],
			note: "Flat measurements"
		};
		const [product] = designProducts(
			[{ ...folder, files: [...folder.files, "measurements.webp"] }],
			{ defaults, designs: { "1": { sizeChart: chart } } }
		);
		expect(product.sizeChart).toEqual({
			...chart,
			image: "/api/store/designs/1/measurements.webp"
		});
		expect(product.images).toHaveLength(2);
	});
	it("skips empty folders and folders containing only a size chart", () => {
		expect(
			designProducts(
				[
					{ folder: "empty", files: [] },
					{ folder: "chart-only", files: ["size-chart.png"] }
				],
				{ defaults, designs: {} }
			)
		).toEqual([]);
	});
	it("rejects multiple garments, duplicate slugs, fractional prices and invalid GSM", () => {
		expect(() =>
			designProducts([folder], {
				defaults: { ...defaults, garmentType: ["hoodie", "normal_tshirt"] },
				designs: {}
			})
		).toThrow("garmentType");
		expect(() =>
			designProducts(
				[
					{ folder: "My Design", files: ["a.png"] },
					{ folder: "my-design", files: ["a.png"] }
				],
				{ defaults, designs: {} }
			)
		).toThrow("slug");
		expect(() =>
			designProducts([folder], {
				defaults: { ...defaults, pricePaise: 1.5 },
				designs: {}
			})
		).toThrow("integer paise");
		expect(() =>
			designProducts([folder], { defaults: { ...defaults, gsm: -1 }, designs: {} })
		).toThrow("GSM");
	});
	it("rejects missing chart files and malformed measurement tables", () => {
		expect(() =>
			designProducts([folder], {
				defaults,
				designs: { "1": { sizeChart: { image: "../secret.png" } } }
			})
		).toThrow("Size chart image");
		expect(() =>
			designProducts([folder], {
				defaults,
				designs: {
					"1": { sizeChart: { columns: ["Size", "Chest"], rows: [["M"]] } }
				}
			})
		).toThrow("rows must match");
	});
});
