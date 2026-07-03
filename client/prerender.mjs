// Build-time static prerender of the public routes. Runs after the client and
// SSR builds: injects each route's server-rendered HTML into the built
// index.html template and writes dist/<route>/index.html. Crawlers get real
// content; users still re-render on the client (no hydration).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");

const { render } = await import(path.join(__dirname, "dist-ssr/entry-server.js"));
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const ROUTES = ["/", "/privacy", "/terms", "/login", "/signup"];

for (const url of ROUTES) {
	let appHtml = "";
	try {
		appHtml = render(url);
	} catch (err) {
		console.error(`prerender failed for ${url}:`, err.message);
		process.exit(1);
	}
	const html = template.replace(
		'<div id="root"></div>',
		`<div id="root">${appHtml}</div>`,
	);
	const outPath =
		url === "/"
			? path.join(dist, "index.html")
			: path.join(dist, url, "index.html");
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, html);
	console.log(`prerendered ${url} -> ${path.relative(__dirname, outPath)}`);
}
