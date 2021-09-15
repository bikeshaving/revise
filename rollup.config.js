import * as fs from "fs";
import * as path from "path";

import ts from "rollup-plugin-typescript2";

const input = ["src/subseq.ts", "src/edit.ts", "src/contentarea.ts", "src/keyer.ts"];

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
