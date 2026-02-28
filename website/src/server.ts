import {jsx} from "@b9g/crank/standalone";
import {renderer} from "@b9g/crank/html";
import {Router} from "@b9g/router";
import {trailingSlash} from "@b9g/router/middleware";
import {assets as assetsMiddleware} from "@b9g/assets/middleware";

import HomeView from "./views/home.js";

// Import assets with content-hashed URLs
import clientCSS from "./styles/client.css" with {assetBase: "/static/"};
import demosScript from "./clients/demos.tsx" with {assetBase: "/static/"};

export const assets = {
	clientCSS,
	demosScript,
};

// Create router
const router = new Router();

router.use(trailingSlash("strip"));
router.use(assetsMiddleware());

// Helper to render a Crank view
async function renderView(
	View: any,
	url: string,
	params: Record<string, string> = {},
): Promise<Response> {
	const html = await renderer.render(jsx`
		<${View} url=${url} params=${params} />
	`);

	return new Response(html, {
		headers: {"Content-Type": "text/html"},
	});
}

// Routes
router.route("/").get(async (request) => {
	const url = new URL(request.url);
	return renderView(HomeView, url.pathname);
});

// 404 catch-all
router.route("*").all(async (request) => {
	const url = new URL(request.url);
	return new Response(`<h1>404 Not Found</h1><p>${url.pathname}</p>`, {
		status: 404,
		headers: {"Content-Type": "text/html"},
	});
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

		logger.info(`Pre-rendering ${staticRoutes.length} routes...`);

		for (const route of staticRoutes) {
			try {
				const response = await fetch(route);
				if (response.ok) {
					const content = await response.text();
					const filePath =
						route === "/" ? "index.html" : `${route.slice(1)}/index.html`;

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

		logger.info("Static site generation complete!");
	} catch (error: any) {
		logger.error("Static site generation failed:", error.message);
	}
}
