import * as fs from "fs";
import * as path from "path";

import ts from "rollup-plugin-typescript2";

const input = ["src/subseq.js", "src/patch.js", "src/content-observer.js"];

export default [
	{
		input,
		output: {
			format: "esm",
			dir: "./",
			sourcemap: true,
			chunkFileNames: "dist/[hash].js",
		},
		plugins: [ts({clean: true})],
	},
];
