const dir = import.meta.dir;
Bun.serve({
	port: Number(process.env.PORT) || 3456,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname === "/" ? "/todo.html" : url.pathname;
		const file = Bun.file(dir + path);
		if (await file.exists()) {
			return new Response(file);
		}
		return new Response("Not found", {status: 404});
	},
});
