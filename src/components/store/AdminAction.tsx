"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminAction.module.css";
type Field = {
	name: string;
	label: string;
	type?: string;
	required?: boolean;
	value?: string;
	step?: string;
};
export default function AdminAction({
	endpoint,
	action,
	label,
	fields = [],
	confirmText
}: {
	endpoint: string;
	action: string;
	label: string;
	fields?: Field[];
	confirmText?: string;
}): React.ReactElement {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		if (confirmText && !window.confirm(confirmText)) return;
		setBusy(true);
		setMessage("");
		const values = Object.fromEntries(new FormData(event.currentTarget));
		const payload: Record<string, string | number> = {
			action,
			...values
		} as Record<string, string>;
		if (typeof payload.amountPaise === "string")
			payload.amountPaise = Math.round(Number(payload.amountPaise) * 100);
		if (typeof payload.refundedAt === "string" && payload.refundedAt)
			payload.refundedAt = new Date(payload.refundedAt).toISOString();
		try {
			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			const body = (await response.json()) as {
				error?: string;
				changed?: boolean;
			};
			setMessage(
				response.ok
					? body.changed === false
						? "Not changed: already applied or this action is unavailable. Refresh to review."
						: "Done"
					: (body.error ?? "Action failed")
			);
			if (response.ok) router.refresh();
		} catch {
			setMessage(
				"Could not reach the server. Refresh to check the order before trying again."
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
			{fields.map((field) => (
				<label key={field.name}>
					{field.label}
					<input
						name={field.name}
						type={field.type ?? "text"}
						required={field.required}
						defaultValue={field.value}
						step={field.step}
					/>
				</label>
			))}
			<button disabled={busy}>{busy ? "Working…" : label}</button>
			{message && <small role="status">{message}</small>}
		</form>
	);
}
