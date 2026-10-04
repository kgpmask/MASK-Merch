import { defineConfig } from "vitest/config";
import nextEnv from "@next/env";
import dotenv from "dotenv";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
dotenv.config({ path: ".env.local", override: false, quiet: true });

export default defineConfig({
	test: {
		environment: "node"
	},
	resolve: {
		alias: {
			"@": new URL("./src", import.meta.url).pathname
		}
	}
});
