import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, ROUTES_SEO, SITE_NAME, absUrl, siteOrigin } from "./site.js";

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function websiteSchema() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${origin}/`,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/site/{search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Worthly Website Revenue Checker",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: DEFAULT_DESCRIPTION,
    url: absUrl("/")
  };
}

function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absUrl("/"),
    logo: absUrl("/favicon.svg")
  };
}

function faqSchema() {
  const items = [
    {
      q: "How much does a website with 10,000 monthly visitors earn?",
      a: "A website with 10,000 monthly visitors typically earns $30 to $150 per month from display advertising, depending on niche. Affiliate revenue can be several times higher."
    },
    {
      q: "How much traffic does a website need to make $1,000 a month?",
      a: "At a blended RPM of $5 you need about 200,000 monthly visitors from display ads alone. High-RPM niches like finance can reach $1,000 with 30,000 to 50,000 visitors."
    },
    {
      q: "Does the revenue checker show affiliate income?",
      a: "No. Worthly estimates display advertising income from traffic volume and niche RPM. Affiliate commissions and product sales are not included."
    },
    {
      q: "Is the website revenue checker free?",
      a: "Yes. Unlimited searches, no account, and no credit card. Estimates are order-of-magnitude figures, not financial advice."
    }
  ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };
}

function crumbSchema(parts) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: parts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      item: absUrl(p.path)
    }))
  };
}

export function SeoManager() {
  const { pathname } = useLocation();
  const siteMatch = pathname.match(/^\/site\/([^/]+)/);
  const domain = siteMatch ? decodeURIComponent(siteMatch[1]) : "";
  const route = ROUTES_SEO[pathname];

  let title = route?.title || DEFAULT_TITLE;
  let description = route?.description || DEFAULT_DESCRIPTION;
  let path = pathname === "/" ? "/" : pathname;
  const crumbs = [{ name: "Home", path: "/" }];

  if (domain) {
    title = `${domain} Estimated Revenue, Traffic & Value | Worthly`;
    description = `Free estimate of monthly visits, display-ad revenue, RPM, domain authority, and website value for ${domain}. Check any site on Worthly.`;
    path = `/site/${domain}`;
    crumbs.push({ name: `${domain} revenue`, path });
  } else if (route && pathname !== "/") {
    crumbs.push({ name: title.split("|")[0].trim(), path: pathname });
  }

  const known = Boolean(route) || Boolean(domain);
  if (!known) {
    title = "Page not found | Worthly";
    description = "That page does not exist. Check website revenue for any domain on Worthly.";
  }

  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", known ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, follow");
    upsertMeta("name", "googlebot", known ? "index, follow" : "noindex, follow");
    upsertMeta("name", "author", SITE_NAME);
    upsertMeta("name", "theme-color", "#071018");
    upsertMeta("name", "keywords", "website revenue checker, website worth, estimate ad revenue, RPM checker, site valuation, traffic estimator");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", absUrl(path));
    upsertMeta("property", "og:locale", "en_US");
    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertLink("canonical", absUrl(path));
    upsertJsonLd("ld-website", websiteSchema());
    upsertJsonLd("ld-app", softwareSchema());
    upsertJsonLd("ld-org", orgSchema());
    upsertJsonLd("ld-crumbs", crumbSchema(crumbs));
    if (pathname === "/faq" || pathname === "/" || pathname === "/revenue") {
      upsertJsonLd("ld-faq", faqSchema());
    } else {
      const extra = document.getElementById("ld-faq");
      if (extra) extra.remove();
    }
  }, [title, description, path, pathname, known]);

  return null;
}
