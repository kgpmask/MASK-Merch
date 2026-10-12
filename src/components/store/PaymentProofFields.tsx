"use client";
import PaymentProofDropzone from "./PaymentProofDropzone";

export default function PaymentProofFields({
	file,
	onFileChange,
	disabled
}: {
	file: File | null;
	onFileChange: (file: File | null) => void;
	disabled: boolean;
}): React.ReactElement {
	return (
		<>
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
				file={file}
				onFileChange={onFileChange}
				disabled={disabled}
			/>
		</>
	);
}
