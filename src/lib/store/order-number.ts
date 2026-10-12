export function formatOrderNumber(
	sequence: number,
	createdAt = new Date()
): string {
	if (!Number.isSafeInteger(sequence) || sequence < 1)
		throw new Error("Invalid order sequence.");
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Kolkata",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(createdAt);
	const value = (type: Intl.DateTimeFormatPartTypes): string =>
		parts.find((part) => part.type === type)?.value ?? "";
	const date = `${value("year")}${value("month")}${value("day")}`;
	return `MS-${date}-${String(sequence).padStart(4, "0")}`;
}

export function isOrderNumber(value: string): boolean {
	return /^(?:MS-\d{8}-\d{4,}|MASK-\d+)$/.test(value);
}
