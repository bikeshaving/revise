import {jsx} from "@b9g/crank/standalone";
import {renderer} from "@b9g/crank/html";
import {Router} from "@b9g/router";
import {trailingSlash} from "@b9g/router/middleware";
import {assets as assetsMiddleware} from "@b9g/assets/middleware";

import HomeView from "./views/home.js";
import GuideView from "./views/guide.js";
import NotFoundView from "./views/not-found.js";

import {collectDocuments} from "./models/document.js";

// Import assets with content-hashed URLs
import clientCSS from "./styles/client.css" with {assetBase: "/static/"};
import demosScript from "./clients/demos.tsx" with {assetBase: "/static/"};
import navbarScript from "./clients/navbar.ts" with {assetBase: "/static/"};

export const assets = {
	clientCSS,
	demosScript,
	navbarScript,
};

// Create router
const router = new Router();

router.use(trailingSlash("append"));
router.use(assetsMiddleware());

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

		logger.info("Static site generation complete!");
	} catch (error: any) {
		logger.error("Static site generation failed:", error.message);
	}
}
