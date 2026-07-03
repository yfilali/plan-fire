// Build-time static prerender of the public routes. Runs after the client and
// SSR builds: injects each route's server-rendered HTML into the built
// index.html template, gives each page its own title/description/canonical, and
// writes dist/<route>/index.html. Crawlers get real content; users still
// re-render on the client (no hydration).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");
const ORIGIN = "https://planfire.dev";

const { render } = await import(path.join(__dirname, "dist-ssr/entry-server.js"));
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

const META = {
	"/": {
		title: "PlanFIRE · Free, open-source FIRE retirement planner",
		desc: "Model your runway, stress-test against real market history, and see the exact day you can retire. Free and open source.",
	},
	"/signup": {
		title: "Sign up · PlanFIRE",
		desc: "Create a free PlanFIRE account and start planning your path to financial independence.",
	},
	"/login": {
		title: "Log in · PlanFIRE",
		desc: "Log in to PlanFIRE, the free and open-source FIRE retirement planner.",
	},
	"/privacy": {
		title: "Privacy Policy · PlanFIRE",
		desc: "How PlanFIRE handles your data. We never sell or share your financial figures.",
	},
	"/terms": {
		title: "Terms of Service · PlanFIRE",
		desc: "The terms for using PlanFIRE, a free and open-source FIRE planning tool.",
	},
};

for (const [url, m] of Object.entries(META)) {
	let appHtml = "";
	try {
		appHtml = render(url);
	} catch (err) {
		console.error(`prerender failed for ${url}:`, err.message);
		process.exit(1);
	}
	const canon = ORIGIN + (url === "/" ? "/" : url);
	const html = template
		.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
		.replace(/<title>[^<]*<\/title>/, `<title>${m.title}</title>`)
		.replace('href="https://planfire.dev/"', `href="${canon}"`)
		.replace(
			/(<meta name="description" content=")[^"]*(")/,
			`$1${m.desc}$2`,
		);

	const outPath =
		url === "/"
			? path.join(dist, "index.html")
			: path.join(dist, url, "index.html");
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, html);
	console.log(`prerendered ${url} -> ${path.relative(__dirname, outPath)}`);
}
