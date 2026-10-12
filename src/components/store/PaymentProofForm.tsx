"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PaymentProofFields from "./PaymentProofFields";
import { submitPaymentProof } from "@/lib/store/payment-proof-client";
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
		try {
			await submitPaymentProof(data, orderNumber, proofFile);
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
			<PaymentProofFields
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
