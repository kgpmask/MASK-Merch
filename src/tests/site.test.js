import { describe, test, expect, beforeAll, afterAll, it } from "vitest";
import { createServer } from "http";
import next from "next";
import { connectDatabase } from '../lib/database.js';

describe('Environment Variables', () => {
  it('should load MONGO_URL from .env', () => {
    expect(process.env.MONGO_URL).toBeDefined();
    expect(process.env.MONGO_URL).not.toBe('');
  });
});

let appServer;
let PORT;

beforeAll(async () => {
	const app = next({ dev: true, dir: process.cwd() });
	const handle = app.getRequestHandler();
	await app.prepare();

	await connectDatabase();

	appServer = createServer((req, res) => handle(req, res));
	await new Promise((resolve) => appServer.listen(0, resolve));
	PORT = appServer.address().port;
});

afterAll(async () => {
	await new Promise((resolve) => appServer.close(resolve));
});

const pages = [""];

describe("Server", () => {
	describe("Database", () => {
		test("should connect without throwing an error", async () => {
			await expect(connectDatabase()).resolves.not.toThrow();
		});
	});

	pages.forEach(page => {
		test(`should serve page (${page || "/"})`, async () => {
			const response = await fetch(`http://localhost:${PORT}/${page}`);
			expect(response.ok).toBe(true);
			expect(response.status).toBe(200);
		}, 10000);
	});

	describe("Errors", () => {
		test("should display 404s for pages that don't exist", async () => {
			const response = await fetch(`http://localhost:${PORT}/hashire-sori-yo`);
			expect(response.ok).toBe(false);
			expect(response.status).toBe(404);
		});
	});
});
