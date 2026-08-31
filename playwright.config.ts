import { defineConfig, devices } from "@playwright/test";

const PORT = 6016;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: `storybook dev -p ${PORT} --no-open --quiet`,
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
