import { describe, expect, it } from "vitest";
import { formatOrderNumber, isOrderNumber } from "@/lib/store/order-number";

describe("order numbers", () => {
	it("uses the India calendar date and a padded sequence", () => {
		expect(formatOrderNumber(42, new Date("2026-10-11T19:00:00.000Z"))).toBe(
			"MS-20261012-0042"
		);
	});

	it("accepts new IDs and legacy IDs needed by existing orders", () => {
		expect(isOrderNumber("MS-20261012-0042")).toBe(true);
		expect(isOrderNumber("MASK-1042")).toBe(true);
		expect(isOrderNumber("MS-42")).toBe(false);
	});
});
