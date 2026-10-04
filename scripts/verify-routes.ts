import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import path from "node:path";
import { config } from "dotenv";
import { encode } from "@auth/core/jwt";
import mongoose from "mongoose";
import { connectDatabase } from "../src/lib/database";
import { parseEmailAllowList } from "../src/lib/store/access";
import { Campaign, Order, Product, User, Variant } from "../src/models";

config({ path: ".env.local", quiet: true });

interface RouteResult {
	route: string;
	fixture: string;
	status: string;
	result: "PASS" | "FAIL";
}

const results: RouteResult[] = [];
const cookieName = "authjs.session-token";
const normalEmail = `route-user-${randomUUID()}@example.invalid`;
const fixtureOrderNumber = `MASK-ROUTE-${Date.now()}`;
let productionServer: ChildProcess | undefined;

async function availablePort(): Promise<number> {
	const server = createServer();
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const address = server.address();
	if (!address || typeof address === "string")
		throw new Error("Could not allocate a test port.");
	const port = address.port;
	server.close();
	await once(server, "close");
	return port;
}

async function sessionCookie(
	email: string,
	name: string,
	secret: string
): Promise<string> {
	const token = await encode({
		secret,
		salt: cookieName,
		maxAge: 15 * 60,
		token: { email, name, sub: `route-check-${email}` }
	});
	return `${cookieName}=${token}`;
}

async function waitForServer(origin: string): Promise<void> {
	for (let attempt = 0; attempt < 60; attempt += 1) {
		try {
			const response = await fetch(`${origin}/store`, { redirect: "manual" });
			if (response.status > 0) return;
		} catch {
			// The compiled server is still starting.
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error("Production server did not become ready.");
}

async function expectStatus(
	origin: string,
	route: string,
	fixture: string,
	expected: number,
	cookie?: string
): Promise<void> {
	const response = await fetch(`${origin}${route}`, {
		headers: cookie ? { cookie } : undefined,
		redirect: "manual"
	});
	const passed = response.status === expected;
	results.push({
		route,
		fixture,
		status: String(response.status),
		result: passed ? "PASS" : "FAIL"
	});
	if (!passed)
		throw new Error(
			`${route} returned ${response.status}; expected ${expected}.`
		);
}

async function expectRedirectTo200(
	origin: string,
	route: string,
	destination: string
): Promise<void> {
	const first = await fetch(`${origin}${route}`, { redirect: "manual" });
	const location = first.headers.get("location");
	const redirected = first.status === 307 || first.status === 308;
	if (!redirected || location !== destination)
		throw new Error(`${route} did not redirect to ${destination}.`);
	const final = await fetch(`${origin}${destination}`, { redirect: "manual" });
	const passed = final.status === 200;
	results.push({
		route,
		fixture: `redirect to ${destination}`,
		status: `${first.status} -> ${final.status}`,
		result: passed ? "PASS" : "FAIL"
	});
	if (!passed)
		throw new Error(`${destination} returned ${final.status}; expected 200.`);
}

async function expectDeniedRedirect(
	origin: string,
	route: string,
	cookie: string
): Promise<void> {
	const response = await fetch(`${origin}${route}`, {
		headers: { cookie },
		redirect: "manual"
	});
	const passed =
		(response.status === 307 || response.status === 308) &&
		response.headers.get("location") === "/store";
	results.push({
		route,
		fixture: "normal user denied",
		status: `${response.status} -> /store`,
		result: passed ? "PASS" : "FAIL"
	});
	if (!passed)
		throw new Error(
			`Normal-user admin boundary failed for ${route} (${response.status}).`
		);
}

async function main(): Promise<void> {
	const secret = process.env.AUTH_SECRET;
	const adminEmail = parseEmailAllowList(process.env.ADMIN_EMAILS)[0];
	if (!secret)
		throw new Error("AUTH_SECRET is required for route verification.");
	if (!adminEmail)
		throw new Error("ADMIN_EMAILS must contain an authorised test admin.");

	await connectDatabase();
	const product = await Product.findOne({ active: true }).sort({ sortOrder: 1 });
	if (!product)
		throw new Error("No active product found. Run npm run seed first.");
	const [variant, campaign] = await Promise.all([
		Variant.findOne({ productId: product._id, active: true }),
		Campaign.findOne({ productId: product._id })
	]);
	if (!variant || !campaign)
		throw new Error("The seeded product needs an active variant and campaign.");

	await User.create({
		googleId: `route-check-${randomUUID()}`,
		name: "Route Test User",
		email: normalEmail,
		firstLoginAt: new Date(),
		lastLoginAt: new Date()
	});
	await Order.create({
		orderNumber: fixtureOrderNumber,
		user: { name: "Route Test User", email: normalEmail },
		items: [
			{
				productId: product._id,
				variantId: variant._id,
				campaignId: campaign._id,
				productTitle: product.title,
				productSlug: product.slug,
				garmentType: variant.garmentType,
				size: variant.size,
				colour: variant.colour,
				sku: variant.sku,
				unitPricePaise: variant.pricePaise,
				quantity: 1
			}
		],
		totalPaise: variant.pricePaise,
		status: "payment_pending",
		paymentStatus: "pending",
		policyAcceptedAt: new Date()
	});

	const port = await availablePort();
	const origin = `http://127.0.0.1:${port}`;
	const standaloneDirectory = path.join(process.cwd(), ".next", "standalone");
	const serverEntry = path.join(
		process.cwd(),
		".next",
		"standalone",
		"server.js"
	);
	productionServer = spawn(process.execPath, [serverEntry], {
		cwd: standaloneDirectory,
		env: {
			...process.env,
			AUTH_URL: origin,
			AUTH_TRUST_HOST: "true",
			HOSTNAME: "127.0.0.1",
			PORT: String(port),
			NODE_ENV: "production"
		},
		stdio: ["ignore", "ignore", "pipe"]
	});
	let serverError = "";
	productionServer.stderr?.on("data", (chunk: Buffer) => {
		serverError += chunk.toString();
	});
	await waitForServer(origin);

	const userCookie = await sessionCookie(normalEmail, "Route Test User", secret);
	const adminCookie = await sessionCookie(
		adminEmail,
		"Route Test Admin",
		secret
	);

	await expectRedirectTo200(origin, "/", "/store");
	for (const route of [
		"/store",
		"/store/products",
		"/store/cart",
		"/store/policies",
		"/store/contact"
	])
		await expectStatus(origin, route, "public", 200);
	await expectStatus(
		origin,
		`/store/products/${product.slug}`,
		`seeded slug: ${product.slug}`,
		200
	);
	await expectStatus(
		origin,
		"/store/checkout",
		"authenticated user",
		200,
		userCookie
	);
	await expectStatus(
		origin,
		"/store/orders",
		"authenticated user",
		200,
		userCookie
	);
	await expectStatus(
		origin,
		`/store/orders/${fixtureOrderNumber}`,
		`seeded order: ${fixtureOrderNumber}`,
		200,
		userCookie
	);

	const adminRoutes = [
		"/store/admin",
		"/store/admin/products",
		"/store/admin/campaigns",
		"/store/admin/orders"
	];
	for (const route of adminRoutes) {
		await expectDeniedRedirect(origin, route, userCookie);
		await expectStatus(origin, route, "authorised admin", 200, adminCookie);
	}

	await expectStatus(
		origin,
		"/api/store/admin/export/vendor",
		"normal user denied",
		403,
		userCookie
	);
	await expectStatus(
		origin,
		"/api/store/admin/export/vendor",
		"authorised admin",
		200,
		adminCookie
	);

	console.table(results);
	console.log(
		"Admin boundary: normal user redirected; authorised admin received 200."
	);
	if (serverError.trim()) {
		const sensitiveValues = [
			process.env.MONGO_URL,
			process.env.AUTH_SECRET,
			process.env.AUTH_GOOGLE_SECRET,
			process.env.AUTH_GOOGLE_ID,
			process.env.ADMIN_EMAILS
		].filter((value): value is string => Boolean(value));
		const safeDiagnostics = sensitiveValues.reduce(
			(output, value) => output.replaceAll(value, "[REDACTED]"),
			serverError.trim()
		);
		console.log(`Production server diagnostics:\n${safeDiagnostics}`);
	}
}

main()
	.catch((error: unknown) => {
		console.error(
			error instanceof Error ? error.message : "Route verification failed."
		);
		process.exitCode = 1;
	})
	.finally(async () => {
		if (productionServer && !productionServer.killed) {
			productionServer.kill();
			await Promise.race([
				once(productionServer, "exit"),
				new Promise((resolve) => setTimeout(resolve, 5_000))
			]);
		}
		if (mongoose.connection.readyState !== 0) {
			await Promise.all([
				Order.deleteOne({
					orderNumber: fixtureOrderNumber,
					"user.email": normalEmail
				}),
				User.deleteOne({ email: normalEmail })
			]);
			await mongoose.disconnect();
		}
	});
