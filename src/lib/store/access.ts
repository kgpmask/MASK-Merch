export function parseEmailAllowList(value: string | undefined): string[] {
	return (value ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
}
export function emailIsAllowed(
	email: string | null | undefined,
	allowList: string | undefined
): boolean {
	return Boolean(
		email && parseEmailAllowList(allowList).includes(email.toLowerCase())
	);
}
