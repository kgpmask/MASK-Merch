"use client";

import { useId, useState } from "react";
import styles from "./PaymentProofDropzone.module.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

type PaymentProofDropzoneProps = {
	file: File | null;
	onFileChange: (file: File | null) => void;
	disabled?: boolean;
	maxBytes?: number;
};

export default function PaymentProofDropzone({
	file,
	onFileChange,
	disabled = false,
	maxBytes = DEFAULT_MAX_BYTES
}: PaymentProofDropzoneProps): React.ReactElement {
	const inputId = useId();
	const [dragging, setDragging] = useState(false);
	const [error, setError] = useState("");

	function selectFile(nextFile: File | null): void {
		setError("");
		if (!nextFile) {
			onFileChange(null);
			return;
		}
		if (!ACCEPTED_TYPES.includes(nextFile.type)) {
			setError("Choose a JPEG, PNG, or WebP image.");
			onFileChange(null);
			return;
		}
		if (nextFile.size < 1 || nextFile.size > maxBytes) {
			setError(
				`The image must be smaller than ${Math.floor(maxBytes / 1_048_576)} MB.`
			);
			onFileChange(null);
			return;
		}
		onFileChange(nextFile);
	}

	function handleDrop(event: React.DragEvent<HTMLLabelElement>): void {
		event.preventDefault();
		setDragging(false);
		if (!disabled) selectFile(event.dataTransfer.files.item(0));
	}

	return (
		<label
			htmlFor={inputId}
			className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${disabled ? styles.disabled : ""}`}
			onDragEnter={(event) => {
				event.preventDefault();
				if (!disabled) setDragging(true);
			}}
			onDragOver={(event) => event.preventDefault()}
			onDragLeave={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					setDragging(false);
				}
			}}
			onDrop={handleDrop}
		>
			<input
				id={inputId}
				className={styles.input}
				type="file"
				accept={ACCEPTED_TYPES.join(",")}
				disabled={disabled}
				onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
			/>
			{file ? (
				<>
					<span className={styles.fileName}>{file.name}</span>
					<span className={styles.fileMeta}>
						{(file.size / 1_048_576).toFixed(2)} MB · Click or drop another image to
						replace it
					</span>
				</>
			) : (
				<>
					<span className={styles.title}>Drop payment screenshot here</span>
					<span className={styles.hint}>
						or click to choose a file · JPEG, PNG, or WebP · up to 5 MB
					</span>
				</>
			)}
			{error && <span className={styles.error}>{error}</span>}
		</label>
	);
}
