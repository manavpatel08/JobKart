import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import JobCard from "../components/JobCard";
import JobDetailModal from "../components/JobDetailModal";
import { markApplied, addToQueue, customSearch } from "../api/api";

const SORT_OPTS = [
  { value: "match_desc",    label: "Best Match"         },
  { value: "aspirational",  label: "Top Brands First"   },
  { value: "match_asc",     label: "Lowest Match"       },
  { value: "recent",        label: "Most Recent"        },
];

/* ─── filter helpers ──────────────────────────────────────── */
const CAT_FILTERS = [
  { key: "internship",          label: "Internship",       icon: "" },
  { key: "full_time",           label: "Full-time",        icon: "" },
  { key: "research_internship", label: "Research",         icon: "" },
  { key: "summer_internship",   label: "Summer Intern",    icon: "" },
  { key: "consulting",          label: "Consulting",       icon: "" },
  { key: "government",          label: "Govt / PSU",       icon: "" },
  { key: "product_management",  label: "Product Mgmt",     icon: "" },
  { key: "part_time",           label: "Part-time",        icon: "" },
];

const COMPANY_FILTERS = [
  { key: "faang",    label: "FAANG / MNC",      icon: "" },
  { key: "startup",  label: "Unicorn Startup",  icon: "" },
  { key: "quant",    label: "Quant Firms",      icon: "" },
  { key: "consult",  label: "Consulting",       icon: "" },
  { key: "govt",     label: "Govt / Research",  icon: "" },
  { key: "service",  label: "IT Services",      icon: "" },
];

const WORK_MODES = [
  { key: "remote",  label: "Remote",  icon: "" },
  { key: "hybrid",  label: "Hybrid",  icon: "" },
  { key: "on-site", label: "On-site", icon: "" },
];

const MATCH_BANDS = [
  { key: "excellent", label: "Excellent (80%+)", min: 80, color: "var(--green)"  },
  { key: "strong",    label: "Strong (65–79%)",  min: 65, color: "var(--blue)"   },
  { key: "good",      label: "Good (45–64%)",    min: 45, color: "var(--yellow)" },
  { key: "any",       label: "Show All",          min: 0,  color: "var(--t3)"    },
];

/* ─── Sidebar ─────────────────────────────────────────────── */
function Sidebar({ filters, onChange, onReset, showing, total }) {
  const set    = (k, v) => onChange({ ...filters, [k]: v });
  const toggle = (k, v) => {
    const a = filters[k] || [];
    set(k, a.includes(v) ? a.filter(x => x !== v) : [...a, v]);
  };

  const chip = (active, color = "var(--blue)") => ({
    padding: "5px 11px", borderRadius: "20px", cursor: "pointer",
    fontSize: "11px", fontWeight: "600", transition: "var(--ease)",
    background: active ? `${color}22` : "var(--bg-el)",
    color: active ? color : "var(--t3)",
    border: `1px solid ${active ? `${color}55` : "var(--bd)"}`,
    display: "inline-flex", alignItems: "center", gap: "4px",
  });

  return (
    <aside style={{
      width: "228px", minWidth: "228px",
      borderRight: "1px solid var(--bd)",
      padding: "24px 18px",
      position: "sticky", top: "52px",
      height: "calc(100vh - 52px)", overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>🎛 Filters</span>
        <button onClick={onReset} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--blue)", fontWeight: "600" }}>
          Reset
        </button>
      </div>

      {/* Counter */}
      <div style={{ background: "var(--bg-el)", border: "1px solid var(--bd)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "var(--t3)", textAlign: "center", marginBottom: "20px" }}>
        <strong style={{ color: "var(--t1)", fontSize: "15px" }}>{showing}</strong> / {total} jobs
      </div>

      {/* Match band */}
      <Sec label="Match Quality">
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {MATCH_BANDS.map(b => (
            <button key={b.key} onClick={() => set("matchBand", b.key)} style={{
              ...chip(filters.matchBand === b.key, b.color),
              width: "100%", justifyContent: "flex-start",
              borderRadius: "8px",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: b.color, flexShrink: 0 }} />
              {b.label}
            </button>
          ))}
        </div>
      </Sec>

      {/* Role type */}
      <Sec label="Role Type">
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {CAT_FILTERS.map(c => (
            <button key={c.key} onClick={() => toggle("cats", c.key)} style={chip(filters.cats?.includes(c.key))}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </Sec>

      {/* Company type */}
      <Sec label="Company Type">
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {COMPANY_FILTERS.map(c => (
            <button key={c.key} onClick={() => toggle("compTypes", c.key)} style={chip(filters.compTypes?.includes(c.key), "var(--purple)")}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </Sec>

      {/* Work mode */}
      <Sec label="Work Mode">
        <div style={{ display: "flex", gap: "5px" }}>
          {WORK_MODES.map(m => (
            <button key={m.key} onClick={() => set("workMode", filters.workMode === m.key ? "all" : m.key)} style={{
              ...chip(filters.workMode === m.key, "var(--green)"),
              flex: 1, justifyContent: "center",
            }}>
              {m.icon}
              <span style={{ fontSize: "10px" }}>{m.label}</span>
            </button>
          ))}
        </div>
      </Sec>

      {/* Aspirational toggle */}
      <Sec label="Opportunities">
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "var(--t2)" }}>
          <input type="checkbox"
            checked={filters.showAspirational !== false}
            onChange={() => set("showAspirational", !(filters.showAspirational !== false))}
          />
          Show Aspirational (Tier-1 at low match)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "var(--t2)", marginTop: "8px" }}>
          <input type="checkbox"
            checked={!!filters.onlyWithGap}
            onChange={() => set("onlyWithGap", !filters.onlyWithGap)}
          />
          Only jobs with skill gaps
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "var(--t2)", marginTop: "8px" }}>
          <input type="checkbox"
            checked={!!filters.onlyWithSalary}
            onChange={() => set("onlyWithSalary", !filters.onlyWithSalary)}
          />
          Salary / Stipend listed
        </label>
      </Sec>
    </aside>
  );
}

function Sec({ label, children }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", marginBottom: "9px", textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</div>
      {children}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────── */
function SectionHeader({ icon, title, count, accent = "var(--blue)" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", marginTop: "4px" }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)" }}>{title}</span>
      {count != null && (
        <span style={{ fontSize: "11px", color: accent, fontWeight: "700", background: `${accent}18`, border: `1px solid ${accent}33`, borderRadius: "20px", padding: "1px 8px" }}>
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: "1px", background: "var(--bd)" }} />
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function JobResultsPage({ onCartChange }) {
  const [topJobs, setTopJobs]           = useState([]);
  const [aspJobs, setAspJobs]           = useState([]);
  const [moreJobs, setMoreJobs]         = useState([]);
  const [showMore, setShowMore]         = useState(false);
  const [cart, setCart]                 = useState({});
  const [cartJobs, setCartJobs]         = useState({});
  const [selected, setSelected]         = useState(null);
  const [sortBy, setSortBy]             = useState("match_desc");
  const [query, setQuery]               = useState("");
  const [searching, setSearching]       = useState(false);
  const [customRes, setCustomRes]       = useState(null);
  const [src, setSrc]                   = useState("matched");
  const [filters, setFilters] = useState({
    matchBand: "any", cats: [], compTypes: [], workMode: "all",
    showAspirational: true, onlyWithGap: false, onlyWithSalary: false,
  });

  const resumeId   = localStorage.getItem("resume_id");
  const totalFound = localStorage.getItem("total_found");
  const resumeName = localStorage.getItem("resume_name");
  const navigate   = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("jobs");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setTopJobs(parsed);
        } else {
          setTopJobs(parsed.jobs || []);
          setAspJobs(parsed.aspirational_jobs || []);
          setMoreJobs(parsed.remaining_jobs || []);
        }
      } catch {}
    }
    const c  = localStorage.getItem("cart");    if (c)  setCart(JSON.parse(c));
    const cj = localStorage.getItem("cartJobs"); if (cj) setCartJobs(JSON.parse(cj));
  }, []);

  const persist = (nc, ncj) => {
    localStorage.setItem("cart", JSON.stringify(nc));
    localStorage.setItem("cartJobs", JSON.stringify(ncj));
    onCartChange?.(Object.keys(nc).length);
  };

  const removeFromView = (link) => {
    setTopJobs(p => p.filter(j => j.apply_link !== link));
    setAspJobs(p => p.filter(j => j.apply_link !== link));
    setMoreJobs(p => p.filter(j => j.apply_link !== link));
    setCustomRes(p => p ? { ...p, jobs: p.jobs.filter(j => j.apply_link !== link) } : p);
  };

  const handleQueue = async (job) => {
    const nc  = { ...cart,     [job.apply_link]: "queued" };
    const ncj = { ...cartJobs, [job.apply_link]: job };
    setCart(nc); setCartJobs(ncj); persist(nc, ncj);
    removeFromView(job.apply_link);
    try { await addToQueue(resumeId, job); } catch {}
  };

  const handleApply = async (job) => {
    const nc  = { ...cart,     [job.apply_link]: "applied" };
    const ncj = { ...cartJobs, [job.apply_link]: job };
    setCart(nc); setCartJobs(ncj); persist(nc, ncj);
    removeFromView(job.apply_link);
    try { await markApplied(resumeId, job); } catch {}
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await customSearch(query, "India", resumeId);
      setCustomRes(r); setSrc("custom");
    } catch (e) {
      alert("Search failed: " + (e.response?.data?.detail || e.message));
    } finally { setSearching(false); }
  };

  const reset = () => setFilters({
    matchBand: "any", cats: [], compTypes: [], workMode: "all",
    showAspirational: true, onlyWithGap: false, onlyWithSalary: false,
  });

  /* ── Filtering ─────────────────────────────────────────── */
  const applyFilters = useCallback((list) => {
    let out = list.filter(j => !cart[j.apply_link]);

    // Match band
    if (filters.matchBand && filters.matchBand !== "any") {
      const band = MATCH_BANDS.find(b => b.key === filters.matchBand);
      if (band) out = out.filter(j => j.is_aspirational || (j.match_score ?? 0) >= band.min);
    }

    // Role type categories
    if (filters.cats?.length) {
      out = out.filter(j =>
        j.is_aspirational ||
        filters.cats.some(c => (j.job_category || "").toLowerCase().includes(c))
      );
    }

    // Company type
    if (filters.compTypes?.length) {
      out = out.filter(j => filters.compTypes.some(c => {
        if (c === "faang")   return j.company_tier <= 2 && !j.is_govt && !j.is_research && !j.is_quant;
        if (c === "startup") return j.is_aspirational && !j.is_govt && !j.is_research && !j.is_quant;
        if (c === "quant")   return j.is_quant;
        if (c === "consult") return j.is_consulting;
        if (c === "govt")    return j.is_govt || j.is_research;
        if (c === "service") return j.company_tier === 4;
        return true;
      }));
    }

    // Work mode
    if (filters.workMode && filters.workMode !== "all") {
      out = out.filter(j =>
        (j.work_mode || "").toLowerCase().includes(filters.workMode) ||
        (j.location  || "").toLowerCase().includes(filters.workMode)
      );
    }

    // Only with skill gap
    if (filters.onlyWithGap) {
      out = out.filter(j => (j.missing_skills || []).length > 0 || j.critical_count > 0);
    }

    // Only with salary
    if (filters.onlyWithSalary) {
      out = out.filter(j => j.salary && j.salary !== "Not listed");
    }

    // Sort
    if (sortBy === "match_desc")   out = [...out].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    if (sortBy === "match_asc")    out = [...out].sort((a, b) => (a.match_score || 0) - (b.match_score || 0));
    if (sortBy === "aspirational") out = [...out].sort((a, b) => (b.is_aspirational ? 1 : 0) - (a.is_aspirational ? 1 : 0));

    return out;
  }, [cart, filters, sortBy]);

  const isCustom = src === "custom";
  const customList = customRes?.jobs || [];

  const vTop  = useMemo(() => applyFilters(isCustom ? customList : topJobs),  [topJobs, customList, applyFilters, isCustom]);
  const vAsp  = useMemo(() => filters.showAspirational !== false ? applyFilters(aspJobs)  : [], [aspJobs, applyFilters, filters.showAspirational]);
  const vMore = useMemo(() => applyFilters(moreJobs), [moreJobs, applyFilters]);

  const totalVisible = vTop.length + vAsp.length + (showMore ? vMore.length : 0);
  const totalAvail   = [...topJobs, ...aspJobs, ...moreJobs].filter(j => !cart[j.apply_link]).length;

  const grid = (jobs) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "14px", marginBottom: "24px" }}>
      {jobs.map((job, i) => (
        <div key={job.apply_link || i} className="fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.35)}s` }}>
          <JobCard job={job} onQueue={handleQueue} onApply={handleApply} onDetails={setSelected} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 52px)" }}>
      <Sidebar filters={filters} onChange={setFilters} onReset={reset} showing={totalVisible} total={totalAvail} />

      <div style={{ flex: 1, padding: "28px 28px 48px", minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "21px", fontWeight: "800", color: "var(--t1)", letterSpacing: "-0.4px", marginBottom: "4px" }}>
              Recommended Roles
            </h1>
            <p style={{ fontSize: "12px", color: "var(--t3)" }}>
              {resumeName ? `Matched for ${resumeName}` : "AI-matched to your resume"}
              {totalFound && <span style={{ color: "var(--blue)", marginLeft: "8px", fontWeight: "600" }}>· {totalFound} jobs found</span>}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--t3)", letterSpacing: "0.4px" }}>SORT:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              background: "var(--bg-card)", border: "1px solid var(--bd)",
              borderRadius: "8px", padding: "5px 10px", color: "var(--t1)",
              fontSize: "12px", fontWeight: "600", cursor: "pointer", outline: "none",
            }}>
              {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: "8px",
            background: "var(--bg-card)", border: "1px solid var(--bd)",
            borderRadius: "10px", padding: "0 14px", transition: "var(--ease)",
          }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--blue-b)"}
            onBlur={e  => e.currentTarget.style.borderColor = "var(--bd)"}
          >
            <span style={{ color: "var(--t3)", flexShrink: 0 }}>
              {searching ? <span style={{ animation: "spin 0.6s linear infinite", display: "inline-block" }}>⟳</span> : "🔍"}
            </span>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search roles, companies, skills, quant, govt, consulting…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: "var(--t1)", padding: "10px 0" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setCustomRes(null); setSrc("matched"); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", fontSize: "18px", lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
          <button onClick={handleSearch} disabled={!query.trim() || searching} style={{
            padding: "10px 18px", background: "var(--blue)", color: "#fff",
            border: "none", borderRadius: "10px", fontWeight: "600",
            fontSize: "13px", cursor: "pointer", transition: "var(--ease)",
            opacity: (!query.trim() || searching) ? 0.5 : 1,
          }}>
            {searching ? "…" : "Search"}
          </button>
        </div>

        {/* Source tabs */}
        {customRes && (
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
            {[
              { k: "matched", lbl: `AI Matched (${topJobs.length})` },
              { k: "custom",  lbl: `"${query}" (${customRes.jobs?.length || 0})` },
            ].map(({ k, lbl }) => (
              <button key={k} onClick={() => setSrc(k)} style={{
                padding: "5px 14px", borderRadius: "20px", cursor: "pointer",
                fontSize: "12px", fontWeight: "600", transition: "var(--ease)",
                background: src === k ? "var(--blue)" : "var(--bg-el)",
                color:      src === k ? "#fff"        : "var(--t2)",
                border: `1px solid ${src === k ? "var(--blue)" : "var(--bd)"}`,
              }}>{lbl}</button>
            ))}
          </div>
        )}

        {/* Empty states */}
        {!resumeId && (
          <Empty icon="📄" title="Upload a resume first" sub="Head to Resumes page to upload your CV and start matching." cta="Go to Resumes →" onClick={() => navigate("/resumes")} />
        )}
        {resumeId && topJobs.length === 0 && aspJobs.length === 0 && !isCustom && (
          <Empty icon="🔍" title="No jobs loaded yet" sub='Go to Resumes and click "Find Jobs" to start a 50-query search.' cta="Find Jobs →" onClick={() => navigate("/resumes")} />
        )}

        {/* ── Top Matches ── */}
        {vTop.length > 0 && (
          <>
            {!isCustom && <SectionHeader icon="🎯" title="Top Matches" count={vTop.length} accent="var(--blue)" />}
            {grid(vTop)}
          </>
        )}

        {/* ── Aspirational ── */}
        {!isCustom && vAsp.length > 0 && (
          <>
            <SectionHeader icon="🌟" title="Aspirational Opportunities" count={vAsp.length} accent="var(--yellow)" />
            <div style={{
              background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
              borderRadius: "10px", padding: "10px 16px", marginBottom: "16px",
              fontSize: "12px", color: "var(--t3)", lineHeight: "1.6",
            }}>
              🚀 These top-tier companies may show lower match scores but are always worth applying to. Use the missing skills section on each card to close the gap.
            </div>
            {grid(vAsp)}
          </>
        )}

        {/* ── Filter empty ── */}
        {(topJobs.length > 0 || aspJobs.length > 0) && totalVisible === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--t3)", fontSize: "14px" }}>
            No jobs match active filters.{" "}
            <button onClick={reset} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontWeight: "600" }}>
              Reset all filters
            </button>
          </div>
        )}

        {/* ── Load More ── */}
        {!isCustom && moreJobs.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            {showMore ? (
              <>
                <SectionHeader icon="📋" title="More Opportunities" count={vMore.length} accent="var(--t3)" />
                {grid(vMore)}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <button onClick={() => setShowMore(false)} style={{ padding: "9px 24px", background: "var(--bg-el)", border: "1px solid var(--bd)", borderRadius: "8px", color: "var(--t3)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                    Collapse ↑
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", marginTop: "16px", marginBottom: "48px" }}>
                <button onClick={() => setShowMore(true)} style={{
                  padding: "12px 32px",
                  background: "var(--bg-card)", border: "1px solid var(--bd)",
                  borderRadius: "12px", color: "var(--t2)",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "var(--ease)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue-b)"; e.currentTarget.style.color = "var(--blue)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)"; e.currentTarget.style.color = "var(--t2)"; }}
                >
                  Load {vMore.length} More Opportunities ↓
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <JobDetailModal job={selected} onClose={() => setSelected(null)} onQueue={handleQueue} onApply={handleApply} resumeId={resumeId} />
      )}
    </div>
  );
}

function Empty({ icon, title, sub, cta, onClick }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "16px" }}>
      <div style={{ fontSize: "40px", marginBottom: "14px" }}>{icon}</div>
      <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--t1)", marginBottom: "8px" }}>{title}</h3>
      <p style={{ color: "var(--t3)", marginBottom: "20px", fontSize: "13px", maxWidth: "360px", margin: "0 auto 20px" }}>{sub}</p>
      <button onClick={onClick} style={{ padding: "10px 24px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{cta}</button>
    </div>
  );
}