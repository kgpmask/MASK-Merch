export const MAX_BACK_NAME_LENGTH = 30;

export function normalizeBackName(value: unknown): string {
	if (value === undefined || value === null || value === "") return "";
	if (typeof value !== "string")
		throw new Error("Enter a valid name for the back.");
	const name = value.trim().normalize("NFC");
	if (!name) return "";
	if (
		Array.from(name).length > MAX_BACK_NAME_LENGTH ||
		!/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'-]*$/u.test(name)
	)
		throw new Error(
			"Back names must be 30 characters or fewer, using letters, numbers, spaces, apostrophes, dots or hyphens."
		);
	return name;
}

export function cartLineKey(line: {
	variantId: string;
	backName?: string;
}): string {
	return JSON.stringify([line.variantId, line.backName ?? ""]);
}

export function requireBackName(value: unknown): string {
	const name = normalizeBackName(value);
	if (!name) throw new Error("Enter the name to be displayed on the back.");
	return name;
}
