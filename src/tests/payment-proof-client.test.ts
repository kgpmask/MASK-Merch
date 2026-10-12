import { afterEach, expect, it, vi } from "vitest";
import { submitPaymentProof } from "@/lib/store/payment-proof-client";

afterEach(() => vi.unstubAllGlobals());

it("sends the same multipart fields and file without marking payment verified", async () => {
	const fetchMock = vi
		.fn()
		.mockResolvedValue(new Response("{}", { status: 200 }));
	vi.stubGlobal("fetch", fetchMock);
	const file = new File(["image"], "proof.png", { type: "image/png" });
	const data = new FormData();
	data.set("utr", "1234567890");
	data.set("payerName", "Test User");
	data.set("transactionAt", "2026-10-12T12:00");
	await submitPaymentProof(data, "MASK-1042", file);
	expect(fetchMock).toHaveBeenCalledWith("/api/store/payments/submit", {
		method: "POST",
		body: data
	});
	expect(data.get("orderNumber")).toBe("MASK-1042");
	expect(data.get("utr")).toBe("1234567890");
	expect(data.get("payerName")).toBe("Test User");
	expect(data.get("transactionAt")).toBe("2026-10-12T12:00");
	expect((data.get("proof") as File).name).toBe("proof.png");
	expect(data.has("status")).toBe(false);
});

it("preserves server validation errors", async () => {
	vi.stubGlobal(
		"fetch",
		vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify({ error: "Duplicate UTR." }), { status: 400 })
			)
	);
	await expect(
		submitPaymentProof(new FormData(), "MASK-1042", new File(["x"], "proof.png"))
	).rejects.toThrow("Duplicate UTR.");
});

it("uses the existing fallback for non-JSON failures", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 }))
	);
	await expect(
		submitPaymentProof(new FormData(), "MASK-1042", new File(["x"], "proof.png"))
	).rejects.toThrow("Upload failed. Please try again.");
});
