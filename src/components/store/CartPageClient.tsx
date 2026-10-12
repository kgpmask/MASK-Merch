"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatMoney, garmentLabels } from "@/lib/store/config";
import styles from "./CartPageClient.module.css";
import { cartLineKey } from "@/lib/store/personalization";
export default function CartPageClient({
	productImages
}: {
	productImages: Record<string, string>;
}): React.ReactElement {
	const { lines, update, remove } = useCart();
	const total = lines.reduce(
		(sum, line) => sum + line.unitPricePaise * line.quantity,
		0
	);
	if (!lines.length)
		return (
			<div className={styles.empty}>
				<h2>Your cart is waiting for a protagonist.</h2>
				<p>Add a design and it will stay in this browser until you check out.</p>
				<Link href="/store/products">Browse products</Link>
			</div>
		);
	return (
		<div className={styles.layout}>
			<div className={styles.lines}>
				{lines.map((line) => (
					<article
						key={cartLineKey(line)}
						className={styles.line}
					>
						<Link
							href={`/store/products/${line.productSlug}`}
							className={styles.thumb}
							aria-label={`View ${line.productTitle}`}
						>
							{productImages[line.productSlug] ? (
								<img
									src={productImages[line.productSlug]}
									alt={line.productTitle}
								/>
							) : (
								<span>MASK</span>
							)}
						</Link>
						<div className={styles.info}>
							<h2>
								<Link href={`/store/products/${line.productSlug}`}>
									{line.productTitle}
								</Link>
							</h2>
							<p>
								{garmentLabels[line.garmentType]} · {line.size} · {line.colour}
							</p>
							<small>{line.sku}</small>
							{line.backName && (
								<p>
									Name on back: <strong>{line.backName}</strong>
								</p>
							)}
						</div>
						<div className={styles.quantity}>
							<label htmlFor={`qty-${encodeURIComponent(cartLineKey(line))}`}>
								Qty
							</label>
							<input
								id={`qty-${encodeURIComponent(cartLineKey(line))}`}
								type="number"
								min={1}
								max={20}
								value={line.quantity}
								onChange={(event) =>
									update(cartLineKey(line), Number(event.target.value))
								}
							/>
							<button
								type="button"
								onClick={() => remove(cartLineKey(line))}
							>
								Remove
							</button>
						</div>
						<strong>{formatMoney(line.unitPricePaise * line.quantity)}</strong>
					</article>
				))}
			</div>
			<aside className={styles.summary}>
				<p>Cart subtotal</p>
				<strong>{formatMoney(total)}</strong>
				<small>
					Current prices and availability are checked before creating your order.
				</small>
				<Link href="/store/checkout">Continue to checkout</Link>
			</aside>
		</div>
	);
}
