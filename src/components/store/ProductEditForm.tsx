"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProductAdminForm.module.css";
type EditableVariant = {
	id: string;
	label: string;
	pricePaise: number;
	active: boolean;
};
type Props = {
	product: {
		id: string;
		title: string;
		artistCredit: string;
		description: string;
		images: string[];
	};
	campaign: { moq: number; preorderClose: string };
	variants: EditableVariant[];
};
export default function ProductEditForm({
	product,
	campaign,
	variants
}: Props): React.ReactElement {
	const router = useRouter();
	const [message, setMessage] = useState("");
	async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const payload = {
			productId: product.id,
			action: "update",
			title: form.get("title"),
			artistCredit: form.get("artistCredit"),
			description: form.get("description"),
			images: String(form.get("images") ?? "")
				.split(",")
				.map((value) => value.trim())
				.filter(Boolean),
			moq: Number(form.get("moq")),
			preorderClose: form.get("preorderClose"),
			variants: variants.map((variant) => ({
				id: variant.id,
				pricePaise: Math.round(Number(form.get(`price-${variant.id}`)) * 100),
				active: form.get(`active-${variant.id}`) === "on"
			}))
		};
		const response = await fetch("/api/store/admin/products", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		const body = (await response.json()) as { error?: string };
		setMessage(response.ok ? "Changes saved." : (body.error ?? "Update failed."));
		if (response.ok) router.refresh();
	}
	return (
		<form
			className={styles.form}
			onSubmit={submit}
		>
			<div className={styles.grid}>
				<label>
					Title
					<input
						name="title"
						defaultValue={product.title}
						required
					/>
				</label>
				<label>
					Artist credit
					<input
						name="artistCredit"
						defaultValue={product.artistCredit}
						required
					/>
				</label>
				<label>
					MOQ
					<input
						name="moq"
						type="number"
						min={1}
						defaultValue={campaign.moq}
						required
					/>
				</label>
				<label>
					Deadline
					<input
						name="preorderClose"
						type="datetime-local"
						defaultValue={campaign.preorderClose.slice(0, 16)}
						required
					/>
				</label>
				<label>
					Mockup image URLs
					<input
						name="images"
						defaultValue={product.images.join(", ")}
					/>
				</label>
			</div>
			<label>
				Description
				<textarea
					name="description"
					defaultValue={product.description}
					required
				/>
			</label>
			<fieldset>
				<legend>Variant prices and availability</legend>
				{variants.map((variant) => (
					<label key={variant.id}>
						<input
							name={`active-${variant.id}`}
							type="checkbox"
							defaultChecked={variant.active}
						/>{" "}
						{variant.label} ₹
						<input
							name={`price-${variant.id}`}
							type="number"
							min={0}
							defaultValue={variant.pricePaise / 100}
							required
						/>
					</label>
				))}
			</fieldset>
			<button>Save changes</button>
			{message && <p>{message}</p>}
		</form>
	);
}
