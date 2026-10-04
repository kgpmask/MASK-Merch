"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentProofDropzone from "./PaymentProofDropzone";
import styles from "./CheckoutClient.module.css";
export default function PaymentProofForm({
	orderNumber
}: {
	orderNumber: string;
}): React.ReactElement {
	const router = useRouter();
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [proofFile, setProofFile] = useState<File | null>(null);
	async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		if (!proofFile) {
			setError("Choose or drop a payment screenshot before submitting.");
			return;
		}
		setBusy(true);
		setError("");
		const data = new FormData(event.currentTarget);
		data.set("orderNumber", orderNumber);
		data.set("proof", proofFile, proofFile.name);
		try {
			const response = await fetch("/api/store/payments/submit", {
				method: "POST",
				body: data
			});
			const body = (await response.json().catch(() => ({}))) as { error?: string };
			if (!response.ok)
				throw new Error(body.error ?? "Upload failed. Please try again.");
			router.refresh();
		} catch (submissionError) {
			setError(
				submissionError instanceof Error
					? submissionError.message
					: "Upload failed. Please check your connection and try again."
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<form
			className={styles.form}
			onSubmit={submit}
		>
			<h2>Submit payment proof</h2>
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
			<PaymentProofDropzone
				file={proofFile}
				onFileChange={setProofFile}
				disabled={busy}
			/>
			<small>
				A screenshot alone never verifies payment. MASK will match it to the
				receiving account.
			</small>
			{error && <p className={styles.error}>{error}</p>}
			<button disabled={busy || !proofFile}>
				{busy ? "Submitting…" : "Submit for review"}
			</button>
		</form>
	);
}
