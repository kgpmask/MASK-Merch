"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/store/config";
import styles from "./CheckoutClient.module.css";

type Created = { orderNumber: string; totalPaise: number };
export default function CheckoutClient({
	upiId,
	recipient,
	qrUrl
}: {
	upiId: string;
	recipient: string;
	qrUrl: string;
}): React.ReactElement {
	const { lines, clear } = useCart();
	const router = useRouter();
	const [accepted, setAccepted] = useState(false);
	const [created, setCreated] = useState<Created | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [submitted, setSubmitted] = useState(false);
	async function placeOrder(): Promise<void> {
		setBusy(true);
		setError("");
		const response = await fetch("/api/store/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				items: lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
				policyAccepted: accepted
			})
		});
		const body = (await response.json()) as Created & { error?: string };
		setBusy(false);
		if (!response.ok) {
			setError(body.error ?? "Could not create order.");
			return;
		}
		setCreated(body);
		clear();
	}
	async function submitProof(
		event: React.FormEvent<HTMLFormElement>
	): Promise<void> {
		event.preventDefault();
		if (!created) return;
		setBusy(true);
		setError("");
		const data = new FormData(event.currentTarget);
		data.set("orderNumber", created.orderNumber);
		const response = await fetch("/api/store/payments/submit", {
			method: "POST",
			body: data
		});
		const body = (await response.json()) as { error?: string };
		setBusy(false);
		if (!response.ok) {
			setError(body.error ?? "Could not submit proof.");
			return;
		}
		setSubmitted(true);
	}
	if (!created)
		return (
			<div className={styles.layout}>
				<section className={styles.panel}>
					<h2>Review order</h2>
					{lines.length ? (
						lines.map((line) => (
							<div
								className={styles.item}
								key={line.variantId}
							>
								<span>
									{line.productTitle} · {line.size} × {line.quantity}
								</span>
								<strong>{formatMoney(line.unitPricePaise * line.quantity)}</strong>
							</div>
						))
					) : (
						<p className={styles.muted}>
							Your cart is empty. Add products before checkout.
						</p>
					)}
					<label className={styles.check}>
						<input
							type="checkbox"
							checked={accepted}
							onChange={(event) => setAccepted(event.target.checked)}
						/>
						<span>
							I accept the preorder, MOQ/refund, Gymkhana pickup and privacy policies.
						</span>
					</label>
					{error && <p className={styles.error}>{error}</p>}
					<button
						type="button"
						disabled={!lines.length || !accepted || busy}
						onClick={placeOrder}
					>
						{busy ? "Creating secure order…" : "Create order & show UPI"}
					</button>
				</section>
				<aside className={styles.help}>
					<strong>What happens next?</strong>
					<ol>
						<li>We create an order from current database prices.</li>
						<li>You pay the exact amount to the configured UPI recipient.</li>
						<li>You submit the UTR and proof.</li>
						<li>A MASK admin verifies it against bank/UPI history.</li>
					</ol>
				</aside>
			</div>
		);
	if (submitted)
		return (
			<div className={styles.success}>
				<h2>Proof submitted — not yet verified.</h2>
				<p>
					Your order is now <strong>payment_submitted</strong>. It counts toward MOQ
					only after a MASK admin matches the actual received transaction.
				</p>
				<button
					type="button"
					onClick={() => router.push(`/store/orders/${created.orderNumber}`)}
				>
					View {created.orderNumber}
				</button>
			</div>
		);
	return (
		<div className={styles.payment}>
			<section className={styles.qr}>
				<h2>Pay exactly {formatMoney(created.totalPaise)}</h2>
				<img
					src={qrUrl}
					alt="Configured MASK UPI QR code"
				/>
				<dl>
					<div>
						<dt>Recipient</dt>
						<dd>{recipient}</dd>
					</div>
					<div>
						<dt>UPI ID</dt>
						<dd>{upiId}</dd>
					</div>
					<div>
						<dt>UPI note</dt>
						<dd>{created.orderNumber}</dd>
					</div>
				</dl>
				<p>
					Include <strong>{created.orderNumber}</strong> in the UPI note where your
					app supports it.
				</p>
			</section>
			<form
				className={styles.form}
				onSubmit={submitProof}
			>
				<p className={styles.kicker}>After payment</p>
				<h2>Submit transaction details</h2>
				<label>
					UTR / reference number
					<input
						name="utr"
						required
						minLength={6}
						maxLength={40}
					/>
				</label>
				<label>
					Payer name
					<input
						name="payerName"
						required
						minLength={2}
					/>
				</label>
				<label>
					Transaction date and time
					<input
						name="transactionAt"
						type="datetime-local"
						required
					/>
				</label>
				<label>
					Payment screenshot
					<input
						name="proof"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						required
					/>
				</label>
				<small>
					JPEG, PNG or WebP, up to 5 MB. A screenshot is evidence for review, not
					proof that MASK received funds.
				</small>
				{error && <p className={styles.error}>{error}</p>}
				<button
					type="submit"
					disabled={busy}
				>
					{busy ? "Submitting…" : "Submit for admin verification"}
				</button>
			</form>
		</div>
	);
}
