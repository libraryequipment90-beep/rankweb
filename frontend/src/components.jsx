import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SeoManager } from "./seo.jsx";

const LINKS = [
  { to: "/", label: "Websites", end: true },
  { to: "/revenue", label: "Revenue Checker" },
  { to: "/compare", label: "Compare" },
  { to: "/calculator", label: "Calculator" },
  { to: "/top", label: "Top Lists" }
];

export function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  return (
    <>
      <SeoManager />
      <header className="nav">
        <div className="shell nav-inner">
          <Link to="/" className="brand" aria-label="Worthly home">
            <span className="mark">W</span>
            WORTHLY
          </Link>
          <nav className={`nav-links ${open ? "is-open" : ""}`}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
            ))}
            <Link to="/revenue" className="primary-btn nav-cta-mobile">Check Now</Link>
          </nav>
          <Link to="/revenue" className="primary-btn nav-cta">Check Now</Link>
          <button
            className={`menu-btn ${open ? "is-open" : ""}`}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      {open && <button className="nav-backdrop" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <main id="main">{children}</main>
      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <div className="brand"><span className="mark">W</span> WORTHLY</div>
            <p>Free website worth, traffic, and revenue intelligence. No sign-up required.</p>
          </div>
          <div>
            <strong>Tools</strong>
            <p><Link to="/revenue">Revenue Checker</Link></p>
            <p><Link to="/compare">Compare Sites</Link></p>
            <p><Link to="/calculator">Revenue Calculator</Link></p>
          </div>
          <div>
            <strong>Learn</strong>
            <p><Link to="/how-it-works">How estimates work</Link></p>
            <p><Link to="/faq">FAQ</Link></p>
            <p><Link to="/top">Popular websites</Link></p>
          </div>
          <div>
            <strong>Legal</strong>
            <p><Link to="/privacy">Privacy</Link></p>
            <p><Link to="/terms">Terms</Link></p>
            <p><a href="/sitemap.xml">Sitemap</a></p>
          </div>
        </div>
        <div className="shell" style={{ marginTop: 24 }}>
          <small>© 2026 Worthly. Estimates only — not financial advice.</small>
        </div>
      </footer>
    </>
  );
}

export function SearchForm({ defaultValue = "", onSubmitPath = "/site" }) {
  const [q, setQ] = useState(defaultValue);
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    const domain = q.trim();
    if (!domain) return;
    nav(`${onSubmitPath}/${encodeURIComponent(domain)}`);
  }

  return (
    <form className="search-box" onSubmit={submit}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Enter any domain"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        aria-label="Website domain"
      />
      <button className="primary-btn" type="submit">Check Revenue</button>
    </form>
  );
}

export function Metric({ label, value, tone }) {
  return (
    <div className="metric">
      <div className="label">{label}</div>
      <b className={tone || ""}>{value}</b>
    </div>
  );
}
