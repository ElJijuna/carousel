import type { StorybookConfig } from "@storybook/react-native-web-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
	framework: {
		name: "@storybook/react-native-web-vite",
		options: {
			// The carousel has no native modules of its own, so react-native-web
			// alone is enough to run every story in a browser — which is also what
			// lets Playwright drive the real component in CI.
			modulesToTranspile: [],
		},
	},
	docs: {},
	viteFinal: (config) => ({
		...config,
		// GitHub Pages serves this repo's site from `/carousel/`, not from the
		// domain root, so the built asset URLs have to carry that prefix or every
		// script and chunk 404s. Left at `/` for `storybook dev` and for the
		// Playwright suite, which both serve from the root.
		base: process.env.STORYBOOK_BASE_PATH ?? "/",
	}),
};

export default config;
