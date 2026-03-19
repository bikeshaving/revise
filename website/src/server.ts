import "./ssr-polyfill.js";
import {jsx} from "@b9g/crank/standalone";
import {renderer} from "@b9g/crank/html";
import {Router} from "@b9g/router";
import {trailingSlash} from "@b9g/router/middleware";
import {assets as assetsMiddleware} from "@b9g/assets/middleware";

import HomeView from "./views/home.js";
import GuideView from "./views/guide.js";
import BlogHomeView from "./views/blog-home.js";
import BlogView from "./views/blog.js";
import NotFoundView from "./views/not-found.js";

import {collectDocuments} from "./models/document.js";

// Prism setup for SSR syntax highlighting (language components loaded inside)
import "./utils/prism.js";

// Import assets with content-hashed URLs
import clientCSS from "./styles/client.css" with {assetBase: "/static/"};
import demosScript from "./clients/demos.tsx" with {assetBase: "/static/"};
import navbarScript from "./clients/navbar.ts" with {assetBase: "/static/"};
import codeBlocksScript from "./clients/code-blocks.ts" with {
	assetBase: "/static/",
};

// Import Crank client bundles for live code preview iframe
import crankModule from "./clients/crank/index.ts" with {assetBase: "/static/"};
import crankDomModule from "./clients/crank/dom.ts" with {
	assetBase: "/static/",
};
import crankStandaloneModule from "./clients/crank/standalone.ts" with {
	assetBase: "/static/",
};
import crankJsxRuntimeModule from "./clients/crank/jsx-runtime.ts" with {
	assetBase: "/static/",
};
import crankJsxDevRuntimeModule from "./clients/crank/jsx-dev-runtime.ts" with {
	assetBase: "/static/",
};
import crankJsxTagModule from "./clients/crank/jsx-tag.ts" with {
	assetBase: "/static/",
};
import crankAsyncModule from "./clients/crank/async.ts" with {
	assetBase: "/static/",
};
import crankEventTargetModule from "./clients/crank/event-target.ts" with {
	assetBase: "/static/",
};
import crankHtmlModule from "./clients/crank/html.ts" with {
	assetBase: "/static/",
};

// Import Revise client bundles for live code preview iframe
import reviseModule from "./clients/revise/index.ts" with {
	assetBase: "/static/",
};
import reviseContentAreaModule from "./clients/revise/contentarea.ts" with {
	assetBase: "/static/",
};
import reviseEditModule from "./clients/revise/edit.ts" with {
	assetBase: "/static/",
};
import reviseKeyerModule from "./clients/revise/keyer.ts" with {
	assetBase: "/static/",
};
import reviseHistoryModule from "./clients/revise/history.ts" with {
	assetBase: "/static/",
};
import reviseStateModule from "./clients/revise/state.ts" with {
	assetBase: "/static/",
};

// Import CrankEditable client bundle for live code preview iframe
import crankEditableModule from "./clients/crankeditable/index.ts" with {
	assetBase: "/static/",
};

export const assets = {
	clientCSS,
	demosScript,
	navbarScript,
	codeBlocksScript,
};

// Static URLs for live code preview iframe (maps module specifiers to bundled URLs)
export const staticURLs: Record<string, string> = {
	"client.css": clientCSS,
	"@b9g/crank": crankModule,
	"@b9g/crank/dom": crankDomModule,
	"@b9g/crank/standalone": crankStandaloneModule,
	"@b9g/crank/jsx-runtime": crankJsxRuntimeModule,
	"@b9g/crank/jsx-dev-runtime": crankJsxDevRuntimeModule,
	"@b9g/crank/jsx-tag": crankJsxTagModule,
	"@b9g/crank/async": crankAsyncModule,
	"@b9g/crank/event-target": crankEventTargetModule,
	"@b9g/crank/html": crankHtmlModule,
	"@b9g/revise": reviseModule,
	"@b9g/revise/contentarea.js": reviseContentAreaModule,
	"@b9g/revise/edit.js": reviseEditModule,
	"@b9g/revise/keyer.js": reviseKeyerModule,
	"@b9g/revise/history.js": reviseHistoryModule,
	"@b9g/revise/state.js": reviseStateModule,
	"@b9g/crankeditable": crankEditableModule,
};

// Create router
const router = new Router();

// Request logging middleware
const logger = self.loggers.get(["app", "revise-website"]);
router.use(async (request) => {
	const url = new URL(request.url);
	logger.info("{method} {path}", {
		method: request.method,
		path: url.pathname,
	});
	return;
});

router.use(trailingSlash("append"));
router.use(assetsMiddleware());

// Serve raw static files (images, etc.) from the static directory
const mimeTypes: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".webp": "image/webp",
};

router.route("/static/:filename").get(async (request, context) => {
	const {filename} = context.params;

	try {
		const staticDir = await self.directories.open("static");
		const fileHandle = await staticDir.getFileHandle(filename);
		const file = await fileHandle.getFile();
		const content = await file.arrayBuffer();
		const dotIndex = filename.lastIndexOf(".");
		const ext = dotIndex !== -1 ? filename.slice(dotIndex).toLowerCase() : "";
		const contentType = mimeTypes[ext] || "application/octet-stream";

		return new Response(content, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000",
			},
		});
	} catch {
		return new Response("Not Found", {status: 404});
	}
});

// Helper to render a Crank view
async function renderView(
	View: any,
	url: string,
	status: number = 200,
): Promise<Response> {
	const result = await renderer.render(jsx`
		<${View} url=${url} />
	`);

	if (result instanceof Response) {
		return result;
	}

	return new Response(result, {
		status,
		headers: {"Content-Type": "text/html"},
	});
}

// Routes
router.route("/").get(async (request) => {
	const url = new URL(request.url);
	return renderView(HomeView, url.pathname);
});

router.route("/guides/:slug/").get(async (request) => {
	const url = new URL(request.url);
	return renderView(GuideView, url.pathname);
});

router.route("/blog/").get(async (request) => {
	const url = new URL(request.url);
	return renderView(BlogHomeView, url.pathname);
});

router.route("/blog/:slug/").get(async (request) => {
	const url = new URL(request.url);
	return renderView(BlogView, url.pathname);
});

// 404 catch-all
router.route("*").all(async (request) => {
	const url = new URL(request.url);
	return renderView(NotFoundView, url.pathname, 404);
});

// ServiceWorker fetch event
self.addEventListener("fetch", (event) => {
	event.respondWith(router.handle(event.request));
});

// ServiceWorker install event for SSG
self.addEventListener("install", (event) => {
	event.waitUntil(generateStaticSite());
});

async function generateStaticSite() {
	if (import.meta.env.MODE !== "production") {
		return;
	}

	const logger = self.loggers.get(["app", "revise-website"]);
	logger.info("Starting static site generation...");

	try {
		const staticBucket = await self.directories.open("public");
		const staticRoutes = ["/"];

		// Add guide routes
		try {
			const docsDir = await self.directories.open("docs");
			const guidesDir = await docsDir.getDirectoryHandle("guides");
			const docs = await collectDocuments(guidesDir, "guides");
			for (const doc of docs) {
				staticRoutes.push(doc.url);
			}
		} catch (e: any) {
			logger.info("No docs directory found, skipping guide routes");
		}

		// Add blog routes
		try {
			const docsDir = await self.directories.open("docs");
			const blogDir = await docsDir.getDirectoryHandle("blog");
			const docs = await collectDocuments(blogDir, "blog");
			staticRoutes.push("/blog/");
			for (const doc of docs) {
				staticRoutes.push(doc.url);
			}
		} catch (e: any) {
			logger.info("No blog directory found, skipping blog routes");
		}

		logger.info(`Pre-rendering ${staticRoutes.length} routes...`);

		for (const route of staticRoutes) {
			try {
				const response = await fetch(route);
				if (response.ok) {
					const content = await response.text();
					const base = route.replace(/^\/|\/$/g, "");
					const filePath =
						base === "" ? "index.html" : `${base}/index.html`;

					const parts = filePath.split("/");
					let currentDir = staticBucket;
					for (let i = 0; i < parts.length - 1; i++) {
						currentDir = await currentDir.getDirectoryHandle(parts[i], {
							create: true,
						});
					}

					const fileName = parts[parts.length - 1];
					const fileHandle = await currentDir.getFileHandle(fileName, {
						create: true,
					});
					const writable = await fileHandle.createWritable();
					await writable.write(content);
					await writable.close();

					logger.info(`Generated ${route} -> ${filePath}`);
				}
			} catch (error: any) {
				logger.error(`Failed to generate ${route}:`, error.message);
			}
		}

		// Generate 404 page
		try {
			const response = await fetch("/404");
			if (response.ok) {
				const content = await response.text();
				const fileHandle = await staticBucket.getFileHandle("404.html", {
					create: true,
				});
				const writable = await fileHandle.createWritable();
				await writable.write(content);
				await writable.close();
				logger.info("Generated 404.html");
			}
		} catch (e: any) {
			logger.error("Failed to generate 404:", e.message);
		}

		// Copy static files (images, etc.)
		try {
			const srcStatic = await self.directories.open("static");
			let destStatic: FileSystemDirectoryHandle;
			try {
				destStatic = await staticBucket.getDirectoryHandle("static", {create: true});
			} catch {
				destStatic = await staticBucket.getDirectoryHandle("static", {create: true});
			}
			for await (const [name, handle] of (srcStatic as any).entries()) {
				if (handle.kind === "file") {
					const file = await handle.getFile();
					const content = await file.arrayBuffer();
					const destHandle = await destStatic.getFileHandle(name, {create: true});
					const writable = await destHandle.createWritable();
					await writable.write(content);
					await writable.close();
				}
			}
		} catch (e: any) {
			logger.info("No static files to copy: " + e.message);
		}

		logger.info("Static site generation complete!");
	} catch (error: any) {
		logger.error("Static site generation failed:", error.message);
	}
}
