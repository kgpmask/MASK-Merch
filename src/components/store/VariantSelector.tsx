"use client";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney, garmentLabels } from "@/lib/store/config";
import type { StoreProduct } from "@/types/store";
import styles from "./VariantSelector.module.css";
export default function VariantSelector({
	product
}: {
	product: StoreProduct;
}): React.ReactElement {
	const { add } = useCart();
	const [selected, setSelected] = useState(product.variants[0]?.id ?? "");
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);
	const variant = useMemo(
		() => product.variants.find((item) => item.id === selected),
		[product.variants, selected]
	);
	return (
		<div className={styles.box}>
			<label htmlFor="variant">Garment, size and colour</label>
			<select
				id="variant"
				value={selected}
				onChange={(event) => {
					setSelected(event.target.value);
					setAdded(false);
				}}
			>
				{product.variants.map((item) => (
					<option
						key={item.id}
						value={item.id}
					>
						{garmentLabels[item.garmentType]} · {item.size} · {item.colour} ·{" "}
						{formatMoney(item.pricePaise)}
					</option>
				))}
			</select>
			<div className={styles.row}>
				<label htmlFor="quantity">Quantity</label>
				<input
					id="quantity"
					type="number"
					min={1}
					max={20}
					value={quantity}
					onChange={(event) =>
						setQuantity(Math.max(1, Math.min(20, Number(event.target.value))))
					}
				/>
			</div>
			<button
				type="button"
				disabled={!variant}
				onClick={() => {
					if (!variant) return;
					add({
						variantId: variant.id,
						productSlug: product.slug,
						productTitle: product.title,
						garmentType: variant.garmentType,
						size: variant.size,
						colour: variant.colour,
						sku: variant.sku,
						unitPricePaise: variant.pricePaise,
						quantity
					});
					setAdded(true);
				}}
			>
				{added ? "Added to cart ✓" : "Add to cart"}
			</button>
			<p>
				Final prices and garment specifications remain placeholders until MASK
				publishes the campaign.
			</p>
		</div>
	);
}
