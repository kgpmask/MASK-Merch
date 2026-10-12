"use client";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney, garmentLabels } from "@/lib/store/config";
import type { StoreProduct } from "@/types/store";
import styles from "./VariantSelector.module.css";
import {
	MAX_BACK_NAME_LENGTH,
	requireBackName
} from "@/lib/store/personalization";
export default function VariantSelector({
	product
}: {
	product: StoreProduct;
}): React.ReactElement {
	const { add } = useCart();
	const [selected, setSelected] = useState(product.variants[0]?.id ?? "");
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);
	const [backName, setBackName] = useState("");
	const [nameError, setNameError] = useState("");
	const variant = useMemo(
		() =>
			product.variants.find((item) => item.id === selected) ?? product.variants[0],
		[product.variants, selected]
	);
	const garmentTypes = [
		...new Set(product.variants.map((item) => item.garmentType))
	];
	const sizeVariants = product.variants.filter(
		(item) => item.garmentType === variant?.garmentType
	);
	return (
		<div className={styles.box}>
			{garmentTypes.length > 1 ? (
				<>
					<label htmlFor="garment-fit">Fit</label>
					<select
						id="garment-fit"
						value={variant?.garmentType ?? ""}
						onChange={(event) => {
							const next =
								product.variants.find(
									(item) =>
										item.garmentType === event.target.value &&
										item.size === variant?.size &&
										item.colour === variant?.colour
								) ??
								product.variants.find(
									(item) => item.garmentType === event.target.value
								);
							setSelected(next?.id ?? "");
							setAdded(false);
						}}
					>
						{garmentTypes.map((type) => (
							<option
								key={type}
								value={type}
							>
								{garmentLabels[type]}
							</option>
						))}
					</select>
				</>
			) : (
				<p>
					{variant ? garmentLabels[variant.garmentType] : "Currently unavailable"}
				</p>
			)}
			<label htmlFor="variant">Size and colour</label>
			<select
				id="variant"
				value={variant?.id ?? ""}
				onChange={(event) => {
					setSelected(event.target.value);
					setAdded(false);
				}}
			>
				{sizeVariants.map((item) => (
					<option
						key={item.id}
						value={item.id}
					>
						{item.size} · {item.colour} · {formatMoney(item.pricePaise)}
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
			<label htmlFor="back-name">Name to be displayed on the back</label>
			<input
				id="back-name"
				required
				type="text"
				value={backName}
				maxLength={MAX_BACK_NAME_LENGTH}
				aria-describedby="back-name-hint"
				aria-invalid={Boolean(nameError)}
				onChange={(event) => {
					setBackName(event.target.value);
					setNameError("");
					setAdded(false);
				}}
			/>
			<p id="back-name-hint">
				Required. Check spelling carefully. The same name will be printed on every
				piece in this cart line; add separately for different names.
			</p>
			{nameError && <p role="alert">{nameError}</p>}
			<button
				type="button"
				disabled={!variant}
				onClick={() => {
					if (!variant) return;
					let name: string;
					try {
						name = requireBackName(backName);
					} catch (error) {
						setNameError(
							error instanceof Error ? error.message : "Enter a valid name."
						);
						return;
					}
					add({
						backName: name,
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
				finalises the listing.
			</p>
		</div>
	);
}
