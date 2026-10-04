import express from "express";
import { estimateSite, compareSites, calculateRevenue, listNiches, listPopular, normalizeDomain } from "./estimator.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

function cached(key, factory) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  const value = factory();
  cache.set(key, { at: Date.now(), value });
  return value;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "worthly", time: new Date().toISOString() });
});

app.get("/api/niches", (_req, res) => {
  res.json({ niches: listNiches() });
});

app.get("/api/popular", (_req, res) => {
  res.json({ sites: cached("popular", listPopular) });
});

app.get("/api/estimate", (req, res) => {
  const domain = normalizeDomain(String(req.query.domain || ""));
  if (!domain) {
    return res.status(400).json({ error: "Enter a valid domain such as example.com" });
  }
  const result = cached(`est:${domain}`, () => estimateSite(domain));
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.get("/api/compare", (req, res) => {
  const a = normalizeDomain(String(req.query.a || ""));
  const b = normalizeDomain(String(req.query.b || ""));
  if (!a || !b) {
    return res.status(400).json({ error: "Provide two valid domains to compare" });
  }
  const result = cached(`cmp:${a}|${b}`, () => compareSites(a, b));
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

app.post("/api/calculate", (req, res) => {
  const body = req.body || {};
  res.json(calculateRevenue(body));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Worthly API listening on ${PORT}`);
});
