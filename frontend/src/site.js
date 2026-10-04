export const SITE_NAME = "Worthly";
export const DEFAULT_TITLE = "Worthly — Free Website Revenue Checker";
export const DEFAULT_DESCRIPTION =
  "Estimate monthly traffic, ad revenue, and website value for any domain. Free website revenue checker. Unlimited searches, no sign-up.";

export function siteOrigin() {
  const env = import.meta.env.VITE_SITE_URL;
  if (env) return String(env).replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://worthly.app";
}

export function absUrl(path = "/") {
  const origin = siteOrigin();
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export const ROUTES_SEO = {
  "/": {
    title: "Free Website Revenue Checker | Worthly",
    description:
      "Check estimated monthly ad revenue, traffic, and site value for any domain. Free website revenue checker with niche RPM benchmarks. No account required."
  },
  "/revenue": {
    title: "Website Revenue Checker — Estimate Ad Income | Worthly",
    description:
      "Free website revenue checker. Enter any domain to estimate organic traffic, display-ad RPM, monthly earnings, and site valuation in seconds."
  },
  "/compare": {
    title: "Compare Website Traffic & Revenue | Worthly",
    description:
      "Compare two websites side by side for estimated monthly visits, ad revenue, domain authority, and valuation. Free competitor intelligence."
  },
  "/calculator": {
    title: "Website Revenue Calculator — Traffic × RPM | Worthly",
    description:
      "Model website ad revenue from monthly visitors, niche RPM, and sale multiples. See AdSense, Mediavine, and premium-network thresholds."
  },
  "/top": {
    title: "Top Websites by Estimated Revenue | Worthly",
    description:
      "See estimated monthly traffic, ad revenue, and domain authority for popular websites including Google, YouTube, Amazon, and more."
  },
  "/faq": {
    title: "Website Revenue FAQ | Worthly",
    description:
      "How much does a website earn from 10,000 visitors? How much traffic is needed for $1,000 a month? Answers on RPM, AdSense, and affiliate income."
  },
  "/how-it-works": {
    title: "How Website Revenue Estimates Work | Worthly",
    description:
      "Learn how Worthly estimates website traffic and display-ad revenue using ranking signals, niche RPM benchmarks, and earnings multiples."
  },
  "/privacy": {
    title: "Privacy Policy | Worthly",
    description: "Worthly privacy policy. We do not require accounts. Domain lookups are used only to generate public estimates."
  },
  "/terms": {
    title: "Terms of Use | Worthly",
    description: "Worthly terms of use. Revenue and traffic figures are estimates, not financial, investment, or tax advice."
  }
};
