import type { StoreProduct } from "@/types/store";
export const placeholderProducts: StoreProduct[] = [
	{
		id: "placeholder-01",
		title: "Red Eclipse",
		slug: "red-eclipse",
		artistCredit: "Artist credit placeholder",
		description:
			"A bold MASK society design. Final artwork, placement, ink specification and material details are placeholders pending approval.",
		status: "open",
		images: [],
		variants: [
			{
				id: "variant-01-s",
				garmentType: "normal_tshirt",
				size: "S",
				colour: "Black",
				pricePaise: 59900,
				sku: "MASK-RE-N-S"
			},
			{
				id: "variant-01-m",
				garmentType: "normal_tshirt",
				size: "M",
				colour: "Black",
				pricePaise: 59900,
				sku: "MASK-RE-N-M"
			},
			{
				id: "variant-01-o",
				garmentType: "oversized_tshirt",
				size: "M",
				colour: "Black",
				pricePaise: 69900,
				sku: "MASK-RE-O-M"
			},
			{
				id: "variant-01-h",
				garmentType: "hoodie",
				size: "L",
				colour: "Black",
				pricePaise: 119900,
				sku: "MASK-RE-H-L"
			}
		]
	},
	{
		id: "placeholder-02",
		title: "Kharagpur Yokai Club",
		slug: "kharagpur-yokai-club",
		artistCredit: "Artist credit placeholder",
		description:
			"A campus-inspired supernatural club graphic. Replace this copy, artwork and garment specifications from admin data before launch.",
		status: "open",
		images: [],
		variants: [
			{
				id: "variant-02-s",
				garmentType: "normal_tshirt",
				size: "S",
				colour: "Charcoal",
				pricePaise: 59900,
				sku: "MASK-YK-N-S"
			},
			{
				id: "variant-02-l",
				garmentType: "oversized_tshirt",
				size: "L",
				colour: "Charcoal",
				pricePaise: 69900,
				sku: "MASK-YK-O-L"
			},
			{
				id: "variant-02-h",
				garmentType: "hoodie",
				size: "XL",
				colour: "Charcoal",
				pricePaise: 119900,
				sku: "MASK-YK-H-XL"
			}
		]
	}
];
