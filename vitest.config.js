import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations(path.join(process.cwd(), "migrations"));

export default defineConfig({
	plugins: [cloudflareTest({
		wrangler: { configPath: "./wrangler.jsonc" },
		miniflare: {
			bindings: {
				TEST_MIGRATIONS: migrations,
				JWT_SECRET: "test-jwt-secret-not-for-production",
				REFRESH_TOKEN_PEPPER: "test-refresh-pepper",
				PASSWORD_PEPPER: "test-password-pepper",
				OTP_PEPPER: "test-otp-pepper",
				ADMIN_API_TOKEN: "test-admin-token",
				GOWA_API_TOKEN: "test-gowa-token",
			},
		},
	})],
	test: {
		setupFiles: ["./test/setup.js"],
	},
});
