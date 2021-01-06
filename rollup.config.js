import * as fs from "fs";
import * as path from "path";

import ts from "rollup-plugin-typescript2";

const input = ["src/subseq.ts", "src/patch.ts", "src/content-observer.ts"];

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
