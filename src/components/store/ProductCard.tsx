import Link from "next/link";
import type { StoreProduct } from "@/types/store";
import { formatMoney } from "@/lib/store/config";
import MOQProgress from "./MOQProgress";
import StatusBadge from "./StatusBadge";
import styles from "./ProductCard.module.css";
export default function ProductCard({ product }: { product: StoreProduct }): React.ReactElement { const prices = product.variants.map((item) => item.pricePaise); return <article className={styles.card}><Link href={`/store/products/${product.slug}`} className={styles.art}>{product.images[0] ? <img src={product.images[0]} alt={`${product.title} mockup`} /> : <span>ARTWORK<br />PLACEHOLDER</span>}<b>MASK / {product.title}</b></Link><div className={styles.body}><div className={styles.top}><div><p className={styles.eyebrow}>{product.artistCredit}</p><h2><Link href={`/store/products/${product.slug}`}>{product.title}</Link></h2></div><StatusBadge status={product.campaign.status} /></div><p className={styles.price}>From {formatMoney(Math.min(...prices))}</p><MOQProgress paid={product.campaign.paidQuantity} moq={product.campaign.moq} /><Link href={`/store/products/${product.slug}`} className={styles.action}>View preorder <span>→</span></Link></div></article>; }
