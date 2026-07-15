import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { Search, RefreshCw, ExternalLink, SlidersHorizontal, X } from "lucide-react";

// ---------------------------------------------------------------------------
// CONFIG — edit these three things and the site is yours
// ---------------------------------------------------------------------------
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1JYrPAnoKZyDyT1EUv7DHtkDu-oa_NI15hSRN-YJu6Tc/edit?usp=sharing"; // paste your published Google Sheet CSV link here
const CONTACT_LABEL = "@Route301";
const CONTACT_URL = "https://discordapp.com/users/314530512293068802";

const CONDITION_ORDER = ["NM", "LP", "MP", "HP", "DMG"];

const SAMPLE_ROWS = [
  { name: "Charizard ex", set: "Obsidian Flames", number: "125/197", category: "TCG", condition: "NM", price: "42", image: "", available: "yes" },
  { name: "Umbreon VMAX Alt Art", set: "Evolving Skies", number: "215/203", category: "TCG", condition: "LP", price: "310", image: "", available: "yes" },
  { name: "Ken Griffey Jr. Rookie", set: "1989 Upper Deck", number: "1", category: "Sports", condition: "PSA 8", price: "180", image: "", available: "yes" },
  { name: "Mewtwo Base Set", set: "Base Set", number: "10/102", category: "TCG", condition: "MP", price: "65", image: "", available: "no" },
  { name: "LeBron James Rookie", set: "2003 Topps Chrome", number: "111", category: "Sports", condition: "PSA 7", price: "225", image: "", available: "yes" },
  { name: "Lugia 1st Edition", set: "Neo Genesis", number: "9/111", category: "TCG", condition: "HP", price: "95", image: "", available: "yes" },
];

// ---------------------------------------------------------------------------

function conditionRank(c) {
  const i = CONDITION_ORDER.indexOf((c || "").trim());
  return i === -1 ? 999 : i;
}

function normalizeRow(r, idx) {
  const get = (keys) => {
    for (const k of keys) {
      const found = Object.keys(r).find((rk) => rk.trim().toLowerCase() === k);
      if (found && r[found] !== undefined) return String(r[found]).trim();
    }
    return "";
  };
  return {
    id: idx,
    name: get(["name", "card", "card name"]),
    set: get(["set", "series"]),
    number: get(["number", "card number", "#"]),
    category: get(["category", "type"]) || "TCG",
    condition: get(["condition", "grade"]),
    price: get(["price", "cost"]),
    image: get(["image", "image url", "photo"]),
    available: (get(["available", "status", "in stock"]) || "yes").toLowerCase(),
  };
}

export default function CardInventory() {
  const [rows, setRows] = useState(SAMPLE_ROWS.map(normalizeRow));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sheetUrl, setSheetUrl] = useState(SHEET_CSV_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [query, setQuery] = useState("");
  const [setFilter, setSetFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sort, setSort] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const loadSheet = (url) => {
    if (!url) return;
    setLoading(true);
    setError("");
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const normalized = res.data.map(normalizeRow).filter((r) => r.name);
        if (normalized.length === 0) {
          setError("Sheet loaded, but no rows were found. Check your column headers.");
        } else {
          setRows(normalized);
        }
        setLoading(false);
      },
      error: () => {
        setError("Couldn't load that sheet. Make sure it's published to the web as CSV.");
        setLoading(false);
      },
    });
  };

  // Only reveal the "connect your inventory" panel to you, via a secret URL
  // like yoursite.com/?admin=1 — regular visitors never see it, even if
  // no sheet is connected yet.
  const isAdmin = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin") === "1";

  useEffect(() => {
    if (SHEET_CSV_URL) loadSheet(SHEET_CSV_URL);
  }, []);

  const sets = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.set).filter(Boolean))).sort()], [rows]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).sort()], [rows]);

  const filtered = useMemo(() => {
    let out = rows.filter((r) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.set.toLowerCase().includes(q);
      const matchesSet = setFilter === "All" || r.set === setFilter;
      const matchesCategory = categoryFilter === "All" || r.category === categoryFilter;
      return matchesQuery && matchesSet && matchesCategory;
    });
    out.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-asc") return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      if (sort === "price-desc") return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
      if (sort === "condition") return conditionRank(a.condition) - conditionRank(b.condition);
      return 0;
    });
    return out;
  }, [rows, query, setFilter, categoryFilter, sort]);

  const availableCount = rows.filter((r) => r.available !== "no" && r.available !== "sold").length;

  return (
    <div style={{ "--ink": "#151812", "--parchment": "#EFE7D3", "--sleeve": "#1F3D2B", "--foil": "#B8912F", "--foil-bright": "#D9AE44", "--rust": "#8C3B2E", "--paper-line": "#D8CBA6" }}
      className="min-h-screen w-full font-body" >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        .font-body { font-family: 'Oswald', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div style={{ background: "var(--ink)" }} className="text-[var(--parchment)]">
        {/* Header */}
        <header className="border-b" style={{ borderColor: "rgba(217,174,68,0.25)" }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--foil-bright)" }}>
                  Binder &middot; Est. Collection
                </div>
                <h1 className="font-display text-5xl sm:text-6xl leading-none" style={{ color: "var(--parchment)" }}>
                  The Trade Case
                </h1>
              </div>
              <div className="font-mono text-xs text-right" style={{ color: "rgba(239,231,211,0.6)" }}>
                <div>{availableCount} cards available</div>
                <div>{rows.length} total in binder</div>
              </div>
            </div>
          </div>
        </header>

        {/* Purchase info strip */}
        <div style={{ background: "var(--sleeve)" }} className="border-b" >
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
            <p className="font-body text-sm" style={{ color: "rgba(239,231,211,0.9)" }}>
              To purchase: message me with the card name to confirm price &amp; availability before sending payment.
            </p>
            <a href={CONTACT_URL} target="_blank" rel="noreferrer"
              className="font-mono text-xs px-4 py-2 rounded-sm inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: "var(--foil)", color: "var(--ink)" }}>
              Contact {CONTACT_LABEL} <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "var(--parchment)" }} className="min-h-screen">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-8">

          {/* Config banner for Google Sheet URL — visible only to you, at ?admin=1 */}
          {isAdmin && showConfig && (
            <div className="mb-6 rounded-sm border p-4 sm:p-5" style={{ borderColor: "var(--paper-line)", background: "#FBF7EC" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-mono text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--sleeve)" }}>Connect your inventory</div>
                  <p className="text-sm mb-3" style={{ color: "var(--ink)" }}>
                    Paste the "Publish to web &rarr; CSV" link from your Google Sheet. Until then, sample cards are shown below.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                      className="flex-1 min-w-[240px] px-3 py-2 text-sm rounded-sm border font-mono"
                      style={{ borderColor: "var(--paper-line)", background: "#fff" }}
                    />
                    <button
                      onClick={() => loadSheet(sheetUrl)}
                      className="px-4 py-2 text-sm rounded-sm inline-flex items-center gap-2"
                      style={{ background: "var(--sleeve)", color: "var(--parchment)" }}>
                      <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Load
                    </button>
                  </div>
                  {error && <div className="mt-2 text-xs" style={{ color: "var(--rust)" }}>{error}</div>}
                </div>
                <button onClick={() => setShowConfig(false)} aria-label="Dismiss" className="opacity-50 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {isAdmin && !showConfig && (
            <button onClick={() => setShowConfig(true)} className="font-mono text-[11px] uppercase tracking-widest mb-4 underline opacity-60 hover:opacity-100" style={{ color: "var(--sleeve)" }}>
              Change sheet source
            </button>
          )}
          {isAdmin && (
            <div className="font-mono text-[10px] uppercase tracking-widest mb-4 opacity-40" style={{ color: "var(--sleeve)" }}>
              Admin view — this bar and the panel above are hidden from regular visitors
            </div>
          )}

          {/* Search + filters */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards or sets..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-sm border"
                style={{ borderColor: "var(--paper-line)", background: "#fff" }}
              />
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="px-3 py-2.5 text-sm rounded-sm border inline-flex items-center gap-2 sm:hidden"
              style={{ borderColor: "var(--paper-line)", background: "#fff" }}>
              <SlidersHorizontal size={14} /> Filters
            </button>
            <div className={`${showFilters ? "flex" : "hidden"} sm:flex gap-3 flex-wrap w-full sm:w-auto`}>
              <select value={setFilter} onChange={(e) => setSetFilter(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-sm border" style={{ borderColor: "var(--paper-line)", background: "#fff" }}>
                {sets.map((s) => <option key={s} value={s}>{s === "All" ? "All sets" : s}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-sm border" style={{ borderColor: "var(--paper-line)", background: "#fff" }}>
                {categories.map((c) => <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>)}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2.5 text-sm rounded-sm border" style={{ borderColor: "var(--paper-line)", background: "#fff" }}>
                <option value="name">Sort: Name A-Z</option>
                <option value="price-asc">Sort: Price low-high</option>
                <option value="price-desc">Sort: Price high-low</option>
                <option value="condition">Sort: Condition</option>
              </select>
            </div>
          </div>

          {/* Grid — 9-pocket binder page feel */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 opacity-60 font-body">No cards match those filters.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px p-px" style={{ background: "var(--paper-line)" }}>
              {filtered.map((card) => {
                const sold = card.available === "no" || card.available === "sold";
                return (
                  <div key={card.id} style={{ background: "var(--parchment)" }} className="relative flex flex-col group">
                    <div className="aspect-[5/7] relative overflow-hidden flex items-center justify-center" style={{ background: "#E4DAC0" }}>
                      {card.image ? (
                        <img src={card.image} alt={card.name} className={`w-full h-full object-cover ${sold ? "grayscale opacity-50" : ""}`} />
                      ) : (
                        <div className="font-mono text-[10px] text-center px-2 opacity-40" style={{ color: "var(--ink)" }}>
                          NO IMAGE
                        </div>
                      )}
                      <div className="absolute top-2 left-2 font-mono text-[10px] px-1.5 py-0.5 rounded-sm"
                        style={{ background: "var(--ink)", color: "var(--foil-bright)" }}>
                        {card.condition || "—"}
                      </div>
                      {sold && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display text-xl px-3 py-0.5 -rotate-12" style={{ background: "var(--rust)", color: "var(--parchment)" }}>
                            SOLD
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="font-body text-sm font-medium leading-snug" style={{ color: "var(--ink)" }}>{card.name}</div>
                      <div className="font-mono text-[11px] opacity-60 mt-0.5" style={{ color: "var(--ink)" }}>{card.set}{card.number ? ` · ${card.number}` : ""}</div>
                      <div className="mt-auto pt-2 flex items-end justify-between">
                        <span className="font-display text-2xl" style={{ color: sold ? "rgba(21,24,18,0.35)" : "var(--sleeve)" }}>
                          {card.price ? `$${card.price}` : "—"}
                        </span>
                        {!sold && (
                          <a href={CONTACT_URL} target="_blank" rel="noreferrer"
                            className="font-mono text-[10px] uppercase tracking-wider underline opacity-70 hover:opacity-100">
                            Inquire
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
