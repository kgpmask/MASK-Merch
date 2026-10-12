import { expect, it } from "vitest";
import { normalizeBackName, cartLineKey } from "@/lib/store/personalization";

it("keeps blank/legacy names optional and preserves spelling and case", () => {
	expect(normalizeBackName(undefined)).toBe("");
	expect(normalizeBackName("   ")).toBe("");
	expect(normalizeBackName("  Arul Rana  ")).toBe("Arul Rana");
	expect(normalizeBackName("O'Neil")).toBe("O'Neil");
	expect(normalizeBackName("आरुल")).toBe("आरुल");
});
it("rejects invalid types, excessive lengths, markup, line breaks and formula prefixes", () => {
	for (const name of [
		123,
		{},
		"a".repeat(31),
		"<script>",
		"A\nB",
		"=SUM(1)",
		"+123",
		"@name"
	])
		expect(() => normalizeBackName(name)).toThrow();
});
it("separates names within the same variant and preserves legacy unnamed identity", () => {
	expect(cartLineKey({ variantId: "v1", backName: "Arul" })).not.toBe(
		cartLineKey({ variantId: "v1", backName: "MASK" })
	);
	expect(cartLineKey({ variantId: "v1" })).toBe(
		cartLineKey({ variantId: "v1", backName: "" })
	);
});
