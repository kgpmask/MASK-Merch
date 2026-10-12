import { describe, expect, it } from "vitest";
import { cancellationStatus } from "@/lib/store/admin";

describe("admin order cancellation policy", () => {
	it("cancels unpaid orders without creating a false refund", () => {
		expect(cancellationStatus("payment_pending", "pending")).toBe("cancelled");
		expect(cancellationStatus("payment_rejected", "rejected")).toBe("cancelled");
	});

	it("sends verified paid orders into the refund workflow", () => {
		expect(cancellationStatus("confirmed", "verified")).toBe("refund_pending");
		expect(cancellationStatus("confirmed", "verified")).toBe("refund_pending");
		expect(cancellationStatus("ready_for_pickup", "verified")).toBe(
			"refund_pending"
		);
	});

	it("blocks unresolved submissions and final orders", () => {
		expect(() => cancellationStatus("payment_submitted", "submitted")).toThrow();
		expect(() => cancellationStatus("collected", "verified")).toThrow();
		expect(() => cancellationStatus("refunded", "verified")).toThrow();
	});
});
