import {defineConfig} from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	use: {
		baseURL: "http://localhost:3456",
	},
	webServer: {
		command: "bun e2e/fixtures/serve.ts",
		url: "http://localhost:3456",
		reuseExistingServer: true,
	},
});
