import { storeConfig } from "@/lib/store/config";
import styles from "@/styles/StorePage.module.css";
export default function PoliciesPage(): React.ReactElement {
	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.kicker}>Launch policy draft</p>
				<h1>Clear rules, no fine print.</h1>
				<p>
					This is an unofficial community preorder store. These placeholders must be
					finalised by the store operators before launch.
				</p>
			</header>
			<div className={styles.policyCopy}>
				<section>
					<h2>Preorders and MOQ</h2>
					<p>
						Orders are preorders. A design is produced only when it receives at least
						five paid pieces, or its configured MOQ, before its preorder deadline.
						Variants of the same design count together. Only manually verified
						payments count.
					</p>
				</section>
				<section>
					<h2>Payment and refunds</h2>
					<p>
						A screenshot and UTR submit a payment for review; they do not prove
						receipt. If a design misses MOQ, affected paid orders enter refund
						pending. The authorised account holder sends the full refund manually and
						the operator records its UTR, amount, date/time and operator. Confirmed
						orders cannot be cancelled or refunded except where required by law or
						where the operators approve a quality or fulfilment issue.
					</p>
				</section>
				<section>
					<h2>Pickup</h2>
					<p>
						Confirmed orders are collected only from the configured campus pickup
						point. No shipping is available. Wait for ready-for-pickup status before
						visiting.
					</p>
				</section>
				<section>
					<h2>Privacy</h2>
					<p>
						Google profile details support account access and pickup. Transaction
						details and private payment proof are restricted to the buyer and
						authorised store admins. Retention periods must be finalised before
						launch.
					</p>
				</section>
				<section>
					<h2>Contact</h2>
					<p>
						Policy questions: {storeConfig.contactEmail} (placeholder until the
						operators confirm a contact).
					</p>
				</section>
			</div>
		</div>
	);
}
