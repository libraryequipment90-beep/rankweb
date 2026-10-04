import { Routes, Route, Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout, SearchForm, Metric } from "./components.jsx";
import { estimateDomain, compareDomains, fetchNiches, fetchPopular, calculate } from "./api.js";
import { money, compact, duration } from "./format.js";

function Home() {
  const [popular, setPopular] = useState([]);
  useEffect(() => {
    fetchPopular().then((d) => setPopular(d.sites.slice(0, 10))).catch(() => {});
  }, []);

  return (
    <>
      <section className="hero shell">
        <div className="kicker">Free Revenue Intelligence · No Account Needed</div>
        <h1>Free Website Revenue Checker</h1>
        <p className="lede">
          Estimate how much any website earns per month from organic traffic and display advertising.
          Enter any domain for instant revenue, traffic, and valuation data.
        </p>
        <SearchForm />
        <div className="chips">
          {["google.com", "reddit.com", "netflix.com", "nytimes.com", "shopify.com"].map((d) => (
            <Link key={d} className="chip" to={`/site/${d}`}>{d}</Link>
          ))}
        </div>
        <div className="stats-row">
          <div className="stat"><span>Revenue estimates</span><b>RPM × traffic</b></div>
          <div className="stat"><span>RPM by niche</span><b>17 categories</b></div>
          <div className="stat"><span>Lookups</span><b>Unlimited</b></div>
          <div className="stat"><span>Any domain</span><b>No sign-up</b></div>
        </div>
      </section>

      <section className="section shell">
        <h2>How website revenue is estimated</h2>
        <p className="intro">
          Monthly Revenue ≈ Monthly Organic Traffic × Niche RPM ÷ 1,000. A finance blog with 50,000 visitors
          and a $12 RPM would earn about $600 per month from display ads alone.
        </p>
        <div className="cards" style={{ marginTop: 24 }}>
          <article className="card">
            <h3>1. Search domain</h3>
            <p className="muted">Pull ranking, authority, and content-depth signals for any public website.</p>
          </article>
          <article className="card">
            <h3>2. Model traffic</h3>
            <p className="muted">Blend global rank, backlinks, indexed pages, and niche clickstream ratios.</p>
          </article>
          <article className="card">
            <h3>3. Apply niche RPM</h3>
            <p className="muted">Finance and insurance pay far more per thousand visits than gaming or entertainment.</p>
          </article>
        </div>
      </section>

      <RpmTable />

      <section className="section shell">
        <h2>Popular websites</h2>
        <div className="grid popular" style={{ marginTop: 18 }}>
          {popular.map((s) => (
            <Link key={s.domain} className="site-tile" to={`/site/${s.domain}`}>
              <img src={s.favicon} alt="" />
              <div>
                {s.domain}
                <small>{s.niche} · {money(s.revenue)}/mo</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function RpmTable() {
  const [niches, setNiches] = useState([]);
  useEffect(() => {
    fetchNiches().then((d) => setNiches(d.niches)).catch(() => {});
  }, []);
  return (
    <section className="section shell">
      <h2>RPM benchmarks by niche</h2>
      <p className="intro">RPM (revenue per 1,000 visitors) is the largest swing factor in website earnings.</p>
      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Niche</th>
              <th>Average RPM</th>
              <th>Monthly revenue (50K visitors)</th>
            </tr>
          </thead>
          <tbody>
            {niches.map((n) => (
              <tr key={n.id}>
                <td>{n.name}</td>
                <td>${n.rpmMin}–${n.rpmMax}</td>
                <td>{money(n.revenueAt50kLow)}–{money(n.revenueAt50kHigh)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SiteResult() {
  const { domain } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setErr("");
    estimateDomain(domain)
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setErr(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [domain]);

  if (loading) return <div className="page shell loading">Fetching revenue intelligence…</div>;
  if (err) {
    return (
      <div className="page shell">
        <SearchForm defaultValue={domain} />
        <div className="error">{err}</div>
      </div>
    );
  }

  const maxVisits = Math.max(...data.series.map((s) => s.visits));

  return (
    <div className="page shell">
      <SearchForm defaultValue={data.domain} />
      <div className="domain-head" style={{ marginTop: 28 }}>
        <img src={data.favicon} alt="" />
        <div>
          <h1 className="domain-title">{data.domain}</h1>
          <p className="muted">{data.niche.name} · Grade {data.seo.grade} · {data.confidence.label} confidence ({data.confidence.pct}%)</p>
        </div>
      </div>

      <div className="grid metrics">
        <Metric label="Est. monthly revenue" value={money(data.revenue.monthly)} tone="gold" />
        <Metric label="Monthly visits" value={compact(data.traffic.monthlyVisits)} tone="mint" />
        <Metric label="Site value" value={money(data.valuation.value)} tone="blue" />
        <Metric label="Domain authority" value={data.seo.domainAuthority} />
      </div>

      <div className="grid compare" style={{ marginTop: 18 }}>
        <div className="panel">
          <h3>Revenue breakdown</h3>
          <p className="big gold">{money(data.revenue.monthly)}<span className="muted"> / month</span></p>
          <p className="muted">Range {money(data.revenue.monthlyLow)} – {money(data.revenue.monthlyHigh)}</p>
          <p>Yearly display ads: <b>{money(data.revenue.yearly)}</b></p>
          <p>RPM: <b>${data.revenue.rpm}</b> ({data.revenue.rpmRange[0]}–{data.revenue.rpmRange[1]})</p>
          <p>Ad network: <b>{data.revenue.adNetwork}</b></p>
          <p className="note">{data.revenue.adNetworkNote}</p>
        </div>
        <div className="panel">
          <h3>Traffic trend</h3>
          <div className="bars">
            {data.series.map((s) => (
              <div key={s.month} className="bar" style={{ height: `${Math.max(8, (s.visits / maxVisits) * 100)}%` }}>
                <span>{s.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid compare" style={{ marginTop: 18 }}>
        <div className="panel">
          <h3>SEO & reach</h3>
          <p>Global rank <b>#{compact(data.traffic.globalRank)}</b></p>
          <p>Backlinks <b>{compact(data.seo.backlinks)}</b></p>
          <p>Indexed pages <b>{compact(data.seo.indexedPages)}</b></p>
          <p>Domain age <b>{data.seo.domainAge} years</b></p>
          <p>Bounce rate <b>{data.traffic.bounceRate}%</b> · Pages/visit <b>{data.traffic.pagesPerVisit}</b></p>
          <p>Avg. duration <b>{duration(data.traffic.avgDurationSec)}</b></p>
        </div>
        <div className="panel">
          <h3>Audience geography</h3>
          {data.geo.map((g) => (
            <div className="geo-row" key={g.country}>
              <span className="geo-name">{g.country}</span>
              <div className="geo-bar"><i style={{ width: `${g.share}%` }} /></div>
              <span className="mono">{g.share}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h3>Valuation</h3>
        <p className="big">{money(data.valuation.value)}</p>
        <p className="muted">
          {data.valuation.multiple}× monthly revenue multiple for {data.niche.name}.
          Band {money(data.valuation.valueLow)} – {money(data.valuation.valueHigh)}.
        </p>
        <p className="note">{data.confidence.note} Affiliate, product, and subscription income are not included.</p>
        <div className="action-row">
          <Link className="primary-btn" to={`/compare?a=${data.domain}`}>Compare this site</Link>
          <Link className="ghost-btn" to="/calculator">Model a different RPM</Link>
        </div>
      </div>
    </div>
  );
}

function Compare() {
  const [a, setA] = useState("github.com");
  const [b, setB] = useState("gitlab.com");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(e) {
    e?.preventDefault();
    setLoading(true);
    setErr("");
    try {
      setData(await compareDomains(a, b));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); }, []);

  function Side({ site }) {
    return (
      <div className="panel">
        <div className="domain-head">
          <img src={site.favicon} alt="" />
          <div>
            <h3 style={{ margin: 0 }}>{site.domain}</h3>
            <small className="muted">{site.niche.name}</small>
          </div>
        </div>
        <p>Revenue <b className="gold">{money(site.revenue.monthly)}</b></p>
        <p>Visits <b>{compact(site.traffic.monthlyVisits)}</b></p>
        <p>Value <b>{money(site.valuation.value)}</b></p>
        <p>DA <b>{site.seo.domainAuthority}</b> · Rank <b>#{compact(site.traffic.globalRank)}</b></p>
        <p>RPM <b>${site.revenue.rpm}</b></p>
      </div>
    );
  }

  return (
    <div className="page shell">
      <h1>Side-by-side comparison</h1>
      <p className="lede" style={{ marginLeft: 0 }}>See who leads in traffic, revenue, and authority.</p>
      <form className="search-box compare-form" onSubmit={run}>
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="First domain" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
        <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Second domain" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
        <button className="primary-btn" disabled={loading} type="submit">Compare</button>
      </form>
      {err && <div className="error">{err}</div>}
      {data && (
        <>
          <div className="vs">VS</div>
          <div className="grid compare">
            <Side site={data.left} />
            <Side site={data.right} />
          </div>
        </>
      )}
    </div>
  );
}

function Calculator() {
  const [niches, setNiches] = useState([]);
  const [visits, setVisits] = useState(50000);
  const [rpm, setRpm] = useState(8);
  const [nicheId, setNicheId] = useState("saas");
  const [multiple, setMultiple] = useState(28);
  const [out, setOut] = useState(null);

  useEffect(() => {
    fetchNiches().then((d) => setNiches(d.niches)).catch(() => {});
  }, []);

  useEffect(() => {
    calculate({ visits, rpm, nicheId, multiple }).then(setOut).catch(() => {});
  }, [visits, rpm, nicheId, multiple]);

  return (
    <div className="page shell">
      <h1>Revenue calculator</h1>
      <p className="lede" style={{ marginLeft: 0 }}>Model display-ad income from traffic, RPM, and a sale multiple.</p>
      <div className="calc">
        <div className="panel">
          <label className="field">
            Monthly visitors
            <input type="number" min="0" value={visits} onChange={(e) => setVisits(Number(e.target.value))} />
          </label>
          <label className="field">
            RPM ($)
            <input type="number" step="0.1" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} />
          </label>
          <label className="field">
            Niche
            <select value={nicheId} onChange={(e) => setNicheId(e.target.value)}>
              {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </label>
          <label className="field">
            Sale multiple
            <input type="number" step="0.5" value={multiple} onChange={(e) => setMultiple(Number(e.target.value))} />
          </label>
        </div>
        <div className="panel">
          {out && (
            <>
              <p className="label">Estimated monthly ad revenue</p>
              <p className="big gold">{money(out.monthly)}</p>
              <p>Yearly <b>{money(out.yearly)}</b></p>
              <p>Implied site value <b>{money(out.valuation)}</b> at {out.multiple}×</p>
              <p>Suggested network: <b>{out.adNetwork.name}</b></p>
              <p className="note">{out.adNetwork.note}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Top() {
  const [sites, setSites] = useState([]);
  useEffect(() => {
    fetchPopular().then((d) => setSites(d.sites)).catch(() => {});
  }, []);
  return (
    <div className="page shell">
      <h1>Top websites by estimated revenue</h1>
      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <thead>
            <tr><th>Domain</th><th>Niche</th><th>Visits</th><th>Revenue</th><th>DA</th></tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.domain}>
                <td><Link to={`/site/${s.domain}`}>{s.domain}</Link></td>
                <td>{s.niche}</td>
                <td>{compact(s.visits)}</td>
                <td>{money(s.revenue)}</td>
                <td>{s.da}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Faq() {
  const items = [
    ["How much does a site with 10,000 visitors earn?", "Typically $30–$150 per month from display ads, more in finance or legal. Affiliate income can be several times higher."],
    ["How much traffic is needed for $1,000/month?", "At a $5 blended RPM you need about 200,000 visits. High-RPM niches can get there at 30,000–50,000 visits."],
    ["Does this include affiliate income?", "No. Only modeled display advertising. Product sales and subscriptions are not publicly measurable."],
    ["Why does niche change the number so much?", "Advertisers pay more for high-intent buyers. Mortgage-rate traffic converts; gaming walkthroughs usually do not."]
  ];
  return (
    <div className="page shell faq">
      <h1>Website revenue FAQ</h1>
      {items.map(([q, a]) => (
        <details key={q} open>
          <summary><h2>{q}</h2></summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

function How() {
  return (
    <div className="page shell">
      <h1>How Worthly works</h1>
      <div className="steps">
        <div className="step"><h3>Global ranking</h3><p className="muted">Start from a calibrated rank baseline for the domain.</p></div>
        <div className="step"><h3>Backlinks & pages</h3><p className="muted">Referring domains and indexed URL volume cap realistic sessions.</p></div>
        <div className="step"><h3>Niche RPM</h3><p className="muted">Apply category ad rates, then a marketplace earnings multiple for valuation.</p></div>
      </div>
      <p className="note">Estimates are order-of-magnitude. Your ad-network dashboard is always more accurate for a site you own.</p>
    </div>
  );
}

function RevenueLanding() {
  return (
    <div className="page shell">
      <div className="kicker">Display ads · Organic traffic · Any domain</div>
      <h1>Check any website's revenue free</h1>
      <p className="lede" style={{ marginLeft: 0 }}>Unlimited searches. No account. Instant RPM-based estimate.</p>
      <SearchForm />
      <RpmTable />
    </div>
  );
}

function Privacy() {
  return (
    <div className="page shell">
      <h1>Privacy policy</h1>
      <p className="lede" style={{ marginLeft: 0 }}>Worthly does not require an account. Domain lookups are used only to generate public estimates.</p>
      <div className="panel">
        <p>We do not sell personal data. Searched domains may be cached briefly to speed up repeat lookups.</p>
        <p>Analytics, if enabled later, would be aggregated. Do not submit passwords or private credentials into the checker.</p>
        <p>Revenue figures are modeled from public signals and niche RPM bands, not from a site's private ad dashboard.</p>
      </div>
    </div>
  );
}

function Terms() {
  return (
    <div className="page shell">
      <h1>Terms of use</h1>
      <p className="lede" style={{ marginLeft: 0 }}>Traffic, revenue, and valuation numbers are estimates, not financial, investment, or tax advice.</p>
      <div className="panel">
        <p>Use Worthly for research and competitive context. Actual earnings depend on ad networks, geography, seasonality, and affiliate mix.</p>
        <p>You may not scrape the service in a way that degrades availability for other users.</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page shell">
      <h1>Page not found</h1>
      <p className="lede" style={{ marginLeft: 0 }}>That URL does not exist. Check any domain's estimated revenue instead.</p>
      <SearchForm />
      <p style={{ marginTop: 18 }}><Link to="/">Back to home</Link></p>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/revenue" element={<RevenueLanding />} />
        <Route path="/site/:domain" element={<SiteResult />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/top" element={<Top />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/how-it-works" element={<How />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
