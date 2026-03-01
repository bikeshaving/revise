import esbuild, {type Plugin} from "esbuild";
import {compile} from "svelte/compiler";
import {readFileSync} from "fs";

const sveltePlugin: Plugin = {
	name: "svelte",
	setup(build) {
		build.onLoad({filter: /\.svelte$/}, (args) => {
			const source = readFileSync(args.path, "utf-8");
			const result = compile(source, {
				filename: args.path,
				generate: "client",
			});
			return {contents: result.js.code, loader: "js"};
		});
	},
};

async function bundleSize(
	entry: string,
	opts?: {external?: string[]; conditions?: string[]; plugins?: Plugin[]},
): Promise<{minified: number; gzipped: number}> {
	const result = await esbuild.build({
		stdin: {contents: entry, resolveDir: process.cwd()},
		bundle: true,
		minify: true,
		format: "esm",
		platform: "browser",
		write: false,
		external: opts?.external,
		conditions: opts?.conditions,
		plugins: opts?.plugins,
		define: {"process.env.NODE_ENV": '"production"'},
		logLevel: "silent",
	});

	const code = result.outputFiles[0].contents;
	const gzipped = Bun.gzipSync(code);
	return {minified: code.byteLength, gzipped: gzipped.byteLength};
}

const components: Record<string, {entry: string; conditions?: string[]; plugins?: Plugin[]}> = {
	Crank: {
		entry: "export * from '@b9g/crank/crank.js'; export * from '@b9g/crank/dom.js';",
	},
	React: {
		entry: "export * from 'react'; export * from 'react-dom/client';",
	},
	Svelte: {
		entry: "export * from 'svelte';",
		conditions: ["svelte"],
		plugins: [sveltePlugin],
	},
};

const componentSizes: Record<string, {minified: number; gzipped: number}> = {};
for (const [name, comp] of Object.entries(components)) {
	try {
		componentSizes[name] = await bundleSize(comp.entry, comp);
	} catch (err) {
		console.error(`${name}: ${(err as Error).message}`);
	}
}

const frameworks = [
	{
		name: "Revise",
		component: "Crank",
		entry: [
			"export * from '@b9g/crank/crank.js';",
			"export * from '@b9g/crank/dom.js';",
			"export * from '@b9g/revise';",
			"export * from '@b9g/crankeditable';",
		].join("\n"),
	},
	{
		name: "ProseMirror",
		component: null,
		entry: [
			"export * from 'prosemirror-state';",
			"export * from 'prosemirror-view';",
			"export * from 'prosemirror-model';",
			"export * from 'prosemirror-keymap';",
			"export * from 'prosemirror-history';",
			"export * from 'prosemirror-commands';",
		].join("\n"),
	},
	{
		name: "Slate",
		component: "React",
		entry: [
			"export * from 'slate';",
			"export * from 'slate-react';",
			"export * from 'slate-history';",
		].join("\n"),
	},
	{
		name: "Lexical",
		component: "React",
		entry: [
			"export * from 'lexical';",
			"export * from '@lexical/react/LexicalComposer';",
			"export * from '@lexical/react/LexicalContentEditable';",
			"export * from '@lexical/react/LexicalHistoryPlugin';",
			"export * from '@lexical/react/LexicalRichTextPlugin';",
			"export * from '@lexical/react/LexicalOnChangePlugin';",
		].join("\n"),
	},
	{
		name: "CodeMirror 6",
		component: null,
		entry: "export * from 'codemirror';",
	},
	{
		name: "Svedit",
		component: "Svelte",
		entry: "export * from 'svedit';",
		conditions: ["svelte"],
		plugins: [sveltePlugin],
	},
	{
		name: "Tiptap",
		component: null,
		entry: [
			"export * from '@tiptap/core';",
			"export * from '@tiptap/starter-kit';",
		].join("\n"),
	},
];

function formatKB(bytes: number): string {
	return (bytes / 1024).toFixed(1) + " KB";
}

const results: Array<{
	name: string;
	component: string;
	minified: number;
	gzipped: number;
}> = [];

for (const fw of frameworks) {
	try {
		const size = await bundleSize(fw.entry, fw);
		const comp = fw.component;
		const compSize = comp && componentSizes[comp];
		results.push({
			name: fw.name,
			component: comp
				? `${comp} (${compSize ? formatKB(compSize.gzipped) : "?"})`
				: "—",
			minified: size.minified,
			gzipped: size.gzipped,
		});
	} catch (err) {
		console.error(fw.name + ": " + (err as Error).message);
	}
}

results.sort((a, b) => a.gzipped - b.gzipped);

console.log("");
console.log(
	"Framework".padEnd(16) +
		"Component".padEnd(20) +
		"Minified".padStart(12) +
		"Gzipped".padStart(12),
);
console.log("-".repeat(60));
for (const r of results) {
	console.log(
		r.name.padEnd(16) +
			r.component.padEnd(20) +
			formatKB(r.minified).padStart(12) +
			formatKB(r.gzipped).padStart(12),
	);
}
console.log("");
