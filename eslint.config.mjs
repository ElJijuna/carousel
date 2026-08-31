import reactNativeTsx from "super-configs/eslint/react-native/tsx";

export default [
	{
		ignores: [
			"lib/**",
			"coverage/**",
			"storybook-static/**",
			"docs/**",
			"node_modules/**",
			"playwright-report/**",
			"test-results/**",
		],
	},
	...reactNativeTsx,
	{
		name: "real-native-carousel/stories",
		files: ["**/*.stories.tsx", ".storybook/**/*.{ts,tsx}"],
		rules: {
			"react-hooks/rules-of-hooks": "off",
		},
	},
];
