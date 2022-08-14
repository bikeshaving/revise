import * as fs from "fs";
import * as path from "path";

import typescript2 from "rollup-plugin-typescript2";
import MagicString from "magic-string";

/**
 * A hack to add triple-slash references to sibling d.ts files for deno.
 */
function dts() {
	return {
		name: "dts",
		renderChunk(code, info) {
			if (info.isEntry) {
				const dts = path.join("./", info.fileName.replace(/js$/, "d.ts"));
				const ms = new MagicString(code);
				ms.prepend(`/// <reference types="${dts}" />\n`);
				code = ms.toString();
				const map = ms.generateMap({hires: true});
				return {code, map};
			}

			return code;
		},
	};
}

import pkg from "./package.json";
function copyPackage() {
	return {
		name: "copy-stuff",
		writeBundle() {
			const pkg1 = {...pkg};
			delete pkg1.private;
			delete pkg1.scripts;
			delete pkg1.typesVersions;
			rewriteExports(pkg1.exports);
			fs.writeFileSync("./dist/package.json", JSON.stringify(pkg1, null, 2));
			fs.copyFileSync("./README.md", "./dist/README.md");
		},
	};
}

function rewriteExports(exports) {
	for (const key of Object.keys(exports)) {
		if (typeof exports[key] === "object") {
			rewriteExports(exports[key]);
		} else {
			exports[key] = exports[key].replace(
				new RegExp(`^.${path.sep}dist${path.sep}`),
				`.${path.sep}`,
			);
		}
	}
}

const input = [
	"src/edit.ts",
	"src/contentarea.ts",
	"src/keyer.ts",
	"src/history.ts",
];

const ts = typescript2({
	clean: true,
	tsconfigOverride: {
		exclude: ["test"],
	},
});

export default [
	{
		input,
		output: {
			format: "esm",
			dir: "dist",
			chunkFileNames: "[hash].js",
			sourcemap: true,
			exports: "named",
		},
		plugins: [ts, dts(), copyPackage()],
	},
	{
		input,
		output: {
			format: "cjs",
			dir: "dist",
			chunkFileNames: "[hash].cjs",
			entryFileNames: "[name].cjs",
			sourcemap: true,
			exports: "named",
		},
		plugins: [ts],
	},
];
