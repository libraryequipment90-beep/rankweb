import {
  KNOWN_DOMAINS,
  NICHE_BY_ID,
  NICHES,
  TLD_WEIGHT,
  KEYWORD_NICHE,
  POPULAR_SITES
} from "./data.js";

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(str, min, max) {
  const h = hash32(str);
  const t = (h % 100000) / 100000;
  return min + t * (max - min);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function roundTo(n, step) {
  if (n < 10) return Math.round(n);
  if (n < 1000) return Math.round(n / 10) * 10;
  if (n < 10000) return Math.round(n / 50) * 50;
  if (n < 100000) return Math.round(n / 500) * 500;
  if (n < 1000000) return Math.round(n / 5000) * 5000;
  if (n < 10000000) return Math.round(n / 50000) * 50000;
  return Math.round(n / 100000) * 100000;
}

export function normalizeDomain(raw) {
  if (!raw || typeof raw !== "string") return "";
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  d = d.replace(/:\d+$/, "");
  d = d.replace(/[^a-z0-9.-]/g, "");
  if (!d || !d.includes(".") || d.startsWith(".") || d.endsWith(".")) return "";
  const labels = d.split(".");
  if (labels.some((l) => !l || l.length > 63)) return "";
  return d;
}

export function detectNiche(domain) {
  const known = KNOWN_DOMAINS[domain];
  if (known) return known.niche;
  const host = domain.split(".")[0];
  for (const rule of KEYWORD_NICHE) {
    if (rule.re.test(host) || rule.re.test(domain)) return rule.niche;
  }
  const bucket = hash32(domain) % 8;
  const fallback = ["saas", "ecommerce", "education", "news", "home", "food", "travel", "entertainment"];
  return fallback[bucket];
}

function tldOf(domain) {
  const parts = domain.split(".");
  return parts[parts.length - 1];
}

function estimateUnknown(domain) {
  const tld = tldOf(domain);
  const tldW = TLD_WEIGHT[tld] ?? 0.74;
  const name = domain.split(".")[0];
  const lenScore = clamp(1.35 - name.length * 0.045, 0.42, 1.35);
  const hyphenPenalty = name.includes("-") ? 0.72 : 1;
  const digitPenalty = /\d/.test(name) ? 0.8 : 1;
  const brandBoost = name.length <= 6 ? 1.25 : 1;
  const h = hash32(domain);
  const rankBase = Math.pow((h % 900000) + 8000, 1.05);
  const rank = Math.round(clamp(rankBase / tldW / lenScore, 1200, 9800000));
  const visitsRaw = (1800000000 / Math.pow(rank, 0.72)) * tldW * lenScore * hyphenPenalty * digitPenalty * brandBoost;
  const visits = roundTo(clamp(visitsRaw * seeded(domain + ":v", 0.72, 1.28), 1200, 85000000));
  const da = Math.round(clamp(92 - Math.log10(rank) * 9.4 + seeded(domain + ":da", -4, 6), 12, 78));
  const backlinks = roundTo(clamp(visits * seeded(domain + ":bl", 2.4, 18), 80, 420000000));
  const pages = roundTo(clamp(visits * seeded(domain + ":pg", 0.018, 0.42), 12, 18000000));
  const age = Math.round(seeded(domain + ":age", 1, 18));
  return { visits, da, rank, backlinks, pages, age };
}

function adNetworkFor(visits) {
  if (visits >= 100000) {
    return {
      name: "Raptive / Premium",
      note: "Traffic qualifies for top-tier ad networks with the highest RPM bands."
    };
  }
  if (visits >= 50000) {
    return {
      name: "Mediavine",
      note: "Sessions meet typical premium-network thresholds. RPM often jumps 3x–5x vs AdSense."
    };
  }
  return {
    name: "Google AdSense",
    note: "Best fit for newer sites under 50k monthly sessions. RPM is lower and more variable."
  };
}

function trafficTier(visits) {
  if (visits >= 500000) return { label: "Large media", range: "$4,000–$15,000+" };
  if (visits >= 100000) return { label: "Established publisher", range: "$800–$3,000" };
  if (visits >= 50000) return { label: "Premium-network ready", range: "$400–$1,200" };
  if (visits >= 10000) return { label: "Growing content site", range: "$100–$400" };
  if (visits >= 1000) return { label: "Early monetization", range: "$10–$75" };
  return { label: "Pre-monetization", range: "$0–$15" };
}

function confidenceBand(domain, known) {
  if (known) return { label: "High", pct: 86, note: "Calibrated against public ranking and traffic benchmarks." };
  const tld = tldOf(domain);
  if (["com", "org", "net", "io", "ai"].includes(tld)) {
    return { label: "Medium", pct: 68, note: "Modeled from domain signals. Treat as an order-of-magnitude estimate." };
  }
  return { label: "Low", pct: 48, note: "Limited public signals. Confidence band is wider for this domain." };
}

function gradeFrom(da, visits) {
  const score = clamp(da * 0.55 + Math.log10(visits + 1) * 7.2, 8, 99);
  if (score >= 90) return { letter: "A+", score: Math.round(score) };
  if (score >= 80) return { letter: "A", score: Math.round(score) };
  if (score >= 70) return { letter: "B+", score: Math.round(score) };
  if (score >= 60) return { letter: "B", score: Math.round(score) };
  if (score >= 50) return { letter: "C+", score: Math.round(score) };
  if (score >= 40) return { letter: "C", score: Math.round(score) };
  return { letter: "D", score: Math.round(score) };
}

function monthlySeries(visits, seed) {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return months.map((m, i) => {
    const wave = 0.88 + ((hash32(seed + m) % 240) / 1000) + i * 0.018;
    return { month: m, visits: roundTo(visits * wave) };
  });
}

function geoSplit(domain) {
  const a = seeded(domain + ":us", 28, 62);
  const b = seeded(domain + ":in", 6, 18);
  const c = seeded(domain + ":uk", 4, 12);
  const d = seeded(domain + ":de", 3, 9);
  const rest = Math.max(4, 100 - a - b - c - d);
  const rows = [
    { country: "United States", share: a },
    { country: "India", share: b },
    { country: "United Kingdom", share: c },
    { country: "Germany", share: d },
    { country: "Other", share: rest }
  ];
  const total = rows.reduce((s, r) => s + r.share, 0);
  return rows.map((r) => ({ ...r, share: Math.round((r.share / total) * 1000) / 10 }));
}

export function estimateSite(rawDomain) {
  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    return { error: "Enter a valid domain such as example.com" };
  }

  const known = KNOWN_DOMAINS[domain];
  const nicheId = known?.niche || detectNiche(domain);
  const niche = NICHE_BY_ID[nicheId] || NICHE_BY_ID.saas;
  const base = known
    ? {
        visits: known.visits,
        da: known.da,
        rank: known.rank,
        backlinks: known.backlinks,
        pages: known.pages,
        age: known.age
      }
    : estimateUnknown(domain);

  const rpm = seeded(domain + ":rpm", niche.rpmMin, niche.rpmMax);
  const rpmLow = niche.rpmMin * 0.85;
  const rpmHigh = niche.rpmMax * 1.05;
  const monthlyRevenue = (base.visits * rpm) / 1000;
  const revenueLow = (base.visits * rpmLow) / 1000;
  const revenueHigh = (base.visits * rpmHigh) / 1000;
  const yearly = monthlyRevenue * 12;
  const multiple = niche.multiplier + seeded(domain + ":mult", -4, 5);
  const value = monthlyRevenue * multiple;
  const valueLow = revenueLow * (multiple - 6);
  const valueHigh = revenueHigh * (multiple + 8);
  const pageviews = roundTo(base.visits * seeded(domain + ":pv", 1.6, 3.4));
  const bounce = Math.round(seeded(domain + ":bn", 28, 62) * 10) / 10;
  const pagesPerVisit = Math.round(seeded(domain + ":ppv", 1.4, 4.8) * 10) / 10;
  const duration = Math.round(seeded(domain + ":dur", 42, 280));
  const seo = gradeFrom(base.da, base.visits);
  const network = adNetworkFor(base.visits);
  const tier = trafficTier(base.visits);
  const confidence = confidenceBand(domain, Boolean(known));

  return {
    domain,
    niche: { id: niche.id, name: niche.name },
    traffic: {
      monthlyVisits: base.visits,
      monthlyPageviews: pageviews,
      globalRank: base.rank,
      bounceRate: bounce,
      pagesPerVisit,
      avgDurationSec: duration
    },
    seo: {
      domainAuthority: base.da,
      backlinks: base.backlinks,
      indexedPages: base.pages,
      domainAge: base.age,
      score: seo.score,
      grade: seo.letter
    },
    revenue: {
      rpm: Math.round(rpm * 100) / 100,
      rpmRange: [Math.round(rpmLow * 100) / 100, Math.round(rpmHigh * 100) / 100],
      monthly: Math.round(monthlyRevenue),
      monthlyLow: Math.round(revenueLow),
      monthlyHigh: Math.round(revenueHigh),
      yearly: Math.round(yearly),
      adNetwork: network.name,
      adNetworkNote: network.note,
      trafficTier: tier.label,
      typicalRange: tier.range
    },
    valuation: {
      multiple: Math.round(multiple * 10) / 10,
      value: Math.round(value),
      valueLow: Math.max(0, Math.round(valueLow)),
      valueHigh: Math.round(valueHigh)
    },
    confidence,
    series: monthlySeries(base.visits, domain),
    geo: geoSplit(domain),
    known: Boolean(known),
    favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
  };
}

export function compareSites(a, b) {
  const left = estimateSite(a);
  const right = estimateSite(b);
  if (left.error) return left;
  if (right.error) return right;
  return { left, right };
}

export function calculateRevenue({ visits, rpm, nicheId, multiple }) {
  const niche = NICHE_BY_ID[nicheId] || NICHE_BY_ID.saas;
  const v = clamp(Number(visits) || 0, 0, 5e11);
  const r = clamp(Number(rpm) || (niche.rpmMin + niche.rpmMax) / 2, 0.1, 80);
  const m = clamp(Number(multiple) || niche.multiplier, 8, 60);
  const monthly = (v * r) / 1000;
  return {
    visits: v,
    rpm: Math.round(r * 100) / 100,
    niche: { id: niche.id, name: niche.name },
    monthly: Math.round(monthly),
    yearly: Math.round(monthly * 12),
    valuation: Math.round(monthly * m),
    multiple: Math.round(m * 10) / 10,
    adNetwork: adNetworkFor(v)
  };
}

export function listNiches() {
  return NICHES.map((n) => ({
    id: n.id,
    name: n.name,
    rpmMin: n.rpmMin,
    rpmMax: n.rpmMax,
    revenueAt50kLow: Math.round((50000 * n.rpmMin) / 1000),
    revenueAt50kHigh: Math.round((50000 * n.rpmMax) / 1000)
  }));
}

export function listPopular() {
  return POPULAR_SITES.map((s) => {
    const est = estimateSite(s.domain);
    return {
      domain: s.domain,
      niche: est.niche.name,
      visits: est.traffic.monthlyVisits,
      revenue: est.revenue.monthly,
      da: est.seo.domainAuthority,
      favicon: est.favicon
    };
  });
}

export { NICHES };
