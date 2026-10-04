import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { originFromHost, robotsTxt, sitemapXml } from "./src/seoFiles.js";

function seoStaticPlugin() {
  function writeSeo(res, body, type) {
    res.statusCode = 200;
    res.setHeader("Content-Type", type);
    res.end(body);
  }

  return {
    name: "worthly-seo-files",
    configureServer(server) {
      const handler = (req, res, next) => {
        const url = (req.url || "").split("?")[0];
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        const protoHeader = req.headers["x-forwarded-proto"];
        const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || "http";
        const origin = originFromHost(host, proto);
        if (url === "/sitemap.xml") {
          return writeSeo(res, sitemapXml(origin), "application/xml; charset=utf-8");
        }
        if (url === "/robots.txt") {
          return writeSeo(res, robotsTxt(origin), "text/plain; charset=utf-8");
        }
        next();
      };
      server.middlewares.stack.unshift({ route: "", handle: handler });
    },
    generateBundle() {
      const origin = originFromHost(
        (process.env.VITE_SITE_URL || "https://worthly.app").replace(/^https?:\/\//, ""),
        "https"
      );
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(origin) });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt(origin) });
    }
  };
}

export default defineConfig({
  plugins: [react(), seoStaticPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".monkeycode-ai.live"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    }
  }
});
