import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import next from "next";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectDatabase } from "@/lib/database";
import { emailIsAllowed, parseEmailAllowList } from "@/lib/store/access";
import { calculateTotal, groupCampaignQuantities } from "@/lib/store/pricing";
import {
	campaignOutcome,
	canTransitionOrder,
	shouldApplyPaymentVerification,
	shouldApplyRefund
} from "@/lib/store/transitions";

let appServer: Server | undefined;
let nextApp: ReturnType<typeof next> | undefined;
let serverOrigin = "";

beforeAll(async () => {
	nextApp = next({ dev: true, dir: process.cwd() });
	await nextApp.prepare();
	await connectDatabase();

	const handle = nextApp.getRequestHandler();
	appServer = createServer((request, response) => handle(request, response));
	await new Promise<void>((resolve, reject) => {
		appServer?.once("error", reject);
		appServer?.listen(0, "127.0.0.1", resolve);
	});
	const address = appServer.address() as AddressInfo;
	serverOrigin = `http://127.0.0.1:${address.port}`;
}, 30_000);

afterAll(async () => {
	if (appServer?.listening) {
		await new Promise<void>((resolve, reject) => {
			appServer?.close((error) => (error ? reject(error) : resolve()));
		});
	}
	await mongoose.disconnect();
}, 30_000);

describe("environment variables", () => {
	it("loads MONGO_URL from the environment", () => {
		expect(process.env.MONGO_URL).toBeDefined();
		expect(process.env.MONGO_URL).not.toBe("");
	});
});

describe("server", () => {
	it("connects to the database without throwing", async () => {
		await expect(connectDatabase()).resolves.toBeDefined();
	});

	it("serves the homepage", async () => {
		const response = await fetch(`${serverOrigin}/`);
		expect(response.ok).toBe(true);
		expect(response.status).toBe(200);
	}, 15_000);

	it("returns 404 for a page that does not exist", async () => {
		const response = await fetch(`${serverOrigin}/hashire-sori-yo`);
		expect(response.ok).toBe(false);
		expect(response.status).toBe(404);
	}, 15_000);
});

describe("price calculation", () => {
	it("uses integer paise and quantity", () =>
		expect(
			calculateTotal([
				{ unitPricePaise: 59_900, quantity: 2 },
				{ unitPricePaise: 119_900, quantity: 1 }
			])
		).toBe(239_700));
	it("rejects invalid quantities", () =>
		expect(() =>
			calculateTotal([{ unitPricePaise: 10_000, quantity: 0 }])
		).toThrow());
});
describe("MOQ counting", () => {
	it("groups paid variants by design campaign", () => {
		const grouped = groupCampaignQuantities([
			{ campaignId: "design-a", quantity: 2 },
			{ campaignId: "design-a", quantity: 3 },
			{ campaignId: "design-b", quantity: 1 }
		]);
		expect(grouped.get("design-a")).toBe(5);
		expect(campaignOutcome(grouped.get("design-a") ?? 0, 5)).toBe("MOQ_met");
		expect(campaignOutcome(grouped.get("design-b") ?? 0, 5)).toBe("MOQ_failed");
	});
});
describe("order transitions", () => {
	it("allows only specified edges", () => {
		expect(canTransitionOrder("payment_pending", "payment_submitted")).toBe(true);
		expect(canTransitionOrder("payment_pending", "paid_waiting_moq")).toBe(false);
		expect(canTransitionOrder("confirmed", "ready_for_pickup")).toBe(true);
		expect(canTransitionOrder("collected", "refund_pending")).toBe(false);
	});
});
describe("idempotency guards", () => {
	it("applies payment verification only once", () => {
		expect(shouldApplyPaymentVerification("payment_submitted")).toBe(true);
		expect(shouldApplyPaymentVerification("paid_waiting_moq")).toBe(false);
	});
	it("applies refund recording only once", () => {
		expect(shouldApplyRefund("refund_pending")).toBe(true);
		expect(shouldApplyRefund("refunded")).toBe(false);
	});
});
describe("admin authorisation", () => {
	it("normalises and restricts the server allow-list", () => {
		expect(parseEmailAllowList(" Admin@Example.com, ops@example.com ")).toEqual([
			"admin@example.com",
			"ops@example.com"
		]);
		expect(emailIsAllowed("ADMIN@example.com", "admin@example.com")).toBe(true);
		expect(emailIsAllowed("student@example.com", "admin@example.com")).toBe(
			false
		);
	});
});
