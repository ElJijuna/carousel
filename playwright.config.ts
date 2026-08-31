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
			// The visual project owns these; they assert pixels, not behaviour.
			testIgnore: "**/visual.spec.ts",
		},
		{
			name: "visual",
			testMatch: "**/visual.spec.ts",
			use: {
				...devices["Desktop Chrome"],
				// A stated viewport, so a screenshot never depends on the default
				// device size of whatever Playwright ships next.
				viewport: { width: 900, height: 720 },
			},
		},
	],
	// Baselines are per-platform on purpose: Chrome on macOS and on Linux render
	// the same page with different fonts and antialiasing, so one file compared
	// across both would either be permanently red or so tolerant it catches
	// nothing. `npm run test:visual` regenerates the set for whatever platform
	// you are on; see the Contributing section of the README.
	snapshotPathTemplate:
		"{testDir}/__screenshots__/{platform}/{arg}{-projectName}{ext}",
	webServer: {
		command: `storybook dev -p ${PORT} --no-open --quiet`,
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
