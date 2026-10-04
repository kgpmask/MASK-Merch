import { defineConfig } from "vitest/config";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

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
