const PATHS = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/revenue", changefreq: "weekly", priority: "0.9" },
  { path: "/compare", changefreq: "weekly", priority: "0.8" },
  { path: "/calculator", changefreq: "weekly", priority: "0.8" },
  { path: "/top", changefreq: "daily", priority: "0.8" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" }
];

export function originFromHost(host, proto = "https") {
  if (!host) return "https://worthly.app";
  const safe = String(host).split(",")[0].trim();
  const scheme = safe.includes("localhost") || safe.startsWith("127.") ? "http" : proto;
  return `${scheme}://${safe}`;
}

export function sitemapXml(origin) {
  const base = origin.replace(/\/$/, "");
  const urls = PATHS.map((p) => {
    const loc = p.path === "/" ? `${base}/` : `${base}${p.path}`;
    return `  <url><loc>${loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function robotsTxt(origin) {
  const base = origin.replace(/\/$/, "");
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`;
}
