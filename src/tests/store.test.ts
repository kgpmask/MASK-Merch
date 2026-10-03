import { describe, expect, it } from "vitest";
import { emailIsAllowed, parseEmailAllowList } from "@/lib/store/access";
import { calculateTotal, groupCampaignQuantities } from "@/lib/store/pricing";
import { campaignOutcome, canTransitionOrder, shouldApplyPaymentVerification, shouldApplyRefund } from "@/lib/store/transitions";

describe("price calculation", () => {
  it("uses integer paise and quantity", () => expect(calculateTotal([{ unitPricePaise: 59_900, quantity: 2 }, { unitPricePaise: 119_900, quantity: 1 }])).toBe(239_700));
  it("rejects invalid quantities", () => expect(() => calculateTotal([{ unitPricePaise: 10_000, quantity: 0 }])).toThrow());
});
describe("MOQ counting", () => {
  it("groups paid variants by design campaign", () => { const grouped = groupCampaignQuantities([{ campaignId: "design-a", quantity: 2 }, { campaignId: "design-a", quantity: 3 }, { campaignId: "design-b", quantity: 1 }]); expect(grouped.get("design-a")).toBe(5); expect(campaignOutcome(grouped.get("design-a") ?? 0, 5)).toBe("MOQ_met"); expect(campaignOutcome(grouped.get("design-b") ?? 0, 5)).toBe("MOQ_failed"); });
});
describe("order transitions", () => {
  it("allows only specified edges", () => { expect(canTransitionOrder("payment_pending", "payment_submitted")).toBe(true); expect(canTransitionOrder("payment_pending", "paid_waiting_moq")).toBe(false); expect(canTransitionOrder("confirmed", "ready_for_pickup")).toBe(true); expect(canTransitionOrder("collected", "refund_pending")).toBe(false); });
});
describe("idempotency guards", () => {
  it("applies payment verification only once", () => { expect(shouldApplyPaymentVerification("payment_submitted")).toBe(true); expect(shouldApplyPaymentVerification("paid_waiting_moq")).toBe(false); });
  it("applies refund recording only once", () => { expect(shouldApplyRefund("refund_pending")).toBe(true); expect(shouldApplyRefund("refunded")).toBe(false); });
});
describe("admin authorisation", () => {
  it("normalises and restricts the server allow-list", () => { expect(parseEmailAllowList(" Admin@Example.com, ops@example.com ")).toEqual(["admin@example.com", "ops@example.com"]); expect(emailIsAllowed("ADMIN@example.com", "admin@example.com")).toBe(true); expect(emailIsAllowed("student@example.com", "admin@example.com")).toBe(false); });
});
