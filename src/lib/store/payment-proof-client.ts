/** Shared transport for checkout and order-page proof submission. */
export async function submitPaymentProof(
	data: FormData,
	orderNumber: string,
	file: File
): Promise<void> {
	data.set("orderNumber", orderNumber);
	data.set("proof", file, file.name);
	const response = await fetch("/api/store/payments/submit", {
		method: "POST",
		body: data
	});
	const body = (await response.json().catch(() => ({}))) as { error?: string };
	if (!response.ok)
		throw new Error(body.error ?? "Upload failed. Please try again.");
}
