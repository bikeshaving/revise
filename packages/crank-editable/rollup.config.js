import typescript from "rollup-plugin-typescript2";

export default {
	input: "src/index.ts",
	output: [
		{
			file: "dist/index.js",
			format: "es",
		},
		{
			file: "dist/index.cjs",
			format: "cjs",
		},
	],
	external: [
		"@b9g/crank",
		"@b9g/crank/standalone",
		"@b9g/revise/edit.js",
		"@b9g/revise/contentarea.js",
		"@b9g/revise/keyer.js",
		"@b9g/revise/history.js",
		"@b9g/revise/state.js",
	],
	plugins: [
		typescript({
			typescript: require("typescript"),
			tsconfigOverride: {
				compilerOptions: {
					declaration: true,
					declarationMap: true,
				},
			},
		}),
	],
};
