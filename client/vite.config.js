import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	test: {
		globals: true,
	},
	plugins: [react()],
	server: {
		host: "0.0.0.0",
		port: 5173,
		// ../shared holds reference data bundled into the client (market history).
		fs: { allow: [searchForWorkspaceRoot(process.cwd()), "../shared"] },
		// Proxy API calls to Express server during development. Override with
		// API_URL when port 3000 is taken (e.g. API_URL=http://localhost:3100).
		proxy: {
			"/api": {
				target: process.env.API_URL || "http://localhost:3000",
				changeOrigin: true,
			},
		},
	},
});
