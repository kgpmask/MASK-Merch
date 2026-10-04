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
		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		const body = (await response.json()) as { error?: string; changed?: boolean };
		setBusy(false);
		setMessage(
			response.ok
				? body.changed === false
					? "Already applied"
					: "Done"
				: (body.error ?? "Action failed")
		);
		if (response.ok) router.refresh();
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
					/>
				</label>
			))}
			<button disabled={busy}>{busy ? "Working…" : label}</button>
			{message && <small>{message}</small>}
		</form>
	);
}
