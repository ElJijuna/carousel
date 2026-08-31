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
};

export default config;
