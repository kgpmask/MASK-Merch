export type PriceLine = { unitPricePaise: number; quantity: number };
export function calculateTotal(lines: PriceLine[]): number {
	return lines.reduce((total, line) => {
		if (!Number.isSafeInteger(line.unitPricePaise) || line.unitPricePaise < 0)
			throw new Error("Invalid unit price.");
		if (
			!Number.isSafeInteger(line.quantity) ||
			line.quantity < 1 ||
			line.quantity > 20
		)
			throw new Error("Quantity must be between 1 and 20.");
		return total + line.unitPricePaise * line.quantity;
	}, 0);
}

export function groupCampaignQuantities(
	lines: Array<{ campaignId: string; quantity: number }>
): Map<string, number> {
	const grouped = new Map<string, number>();
	for (const line of lines)
		grouped.set(
			line.campaignId,
			(grouped.get(line.campaignId) ?? 0) + line.quantity
		);
	return grouped;
}
