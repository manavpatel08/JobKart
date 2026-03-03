import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getApplications, removeApplication, markApplied, updateApplication, addToQueue } from "../api/api";

/* ─────────────────────────────────────────────────────────────
   STATUS helpers
───────────────────────────────────────────────────────────── */
const isQueue    = s => ["queued", "Interested"].includes(s);
const isApplied  = s => ["applied",  "Applied" ].includes(s);
const isRejected = s => ["rejected", "Rejected"].includes(s);

const STATUS_CFG = {
  queued:     { color: "var(--blue)",   bg: "var(--blue-d)",   lbl: "In Queue" },
  Interested: { color: "var(--blue)",   bg: "var(--blue-d)",   lbl: "In Queue" },
  applied:    { color: "var(--green)",  bg: "var(--green-d)",  lbl: "Applied"  },
  Applied:    { color: "var(--green)",  bg: "var(--green-d)",  lbl: "Applied"  },
  rejected:   { color: "var(--red)",    bg: "var(--red-d)",    lbl: "Rejected" },
  Rejected:   { color: "var(--red)",    bg: "var(--red-d)",    lbl: "Rejected" },
};

/* ─────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────── */
const IcoSend    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoCart    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IcoBolt    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoSearch  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>;
const IcoCoach   = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoResume  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoX       = () => <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoArrow   = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IcoJobs    = () => <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
const IcoCheck   = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoLink    = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcoReject  = () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;

/* ─────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────── */
function StatCard({ ico, value, label, note, color = "var(--blue)" }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--bd)",
      borderRadius: "var(--r4)", padding: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "var(--r2)",
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", color,
        }}>{ico}</div>
        {note && <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: "600" }}>{note}</span>}
      </div>
      <div>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--t1)", lineHeight: 1, letterSpacing: "-1px", marginBottom: "4px" }}>
          {value}
        </div>
        <div style={{ fontSize: "11px", color: "var(--t2)" }}>{label}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   QUEUE CARD
   Shows: title, company, match%, In Queue badge
   Actions: [✓ Mark Applied] [↗ View Job] [✕ Remove]
───────────────────────────────────────────────────────────── */
function QCard({ app, onRemove, onApply }) {
  const [busy, setBusy] = useState(null); // "remove" | "apply" | null
  const url = app.apply_url || "";
  const isUrl = url.startsWith("http");

  const handleRemove = async () => {
    if (busy) return;
    setBusy("remove");
    await onRemove(app);
    // no setBusy(null) — card will be gone from the list
  };

  const handleApply = async () => {
    if (busy) return;
    setBusy("apply");
    await onApply(app);
    setBusy(null);
  };

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--bd)",
      borderRadius: "var(--r3)", overflow: "hidden",
      opacity: busy === "remove" ? 0.4 : 1,
      transition: "opacity .15s ease",
    }}
      onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = "var(--bd-h)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)"; }}
    >
      {/* Body */}
      <div style={{ padding: "13px 13px 10px", position: "relative" }}>
        {/* ✕ Remove */}
        <button
          onClick={handleRemove}
          disabled={!!busy}
          title="Remove from queue"
          style={{
            position: "absolute", top: "10px", right: "10px",
            width: "20px", height: "20px", borderRadius: "50%",
            background: "var(--bg-el)", border: "1px solid var(--bd)",
            cursor: busy ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--t3)", transition: "var(--ease)",
          }}
          onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = "var(--red-d)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "rgba(239,68,68,.3)"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-el)"; e.currentTarget.style.color = "var(--t3)"; e.currentTarget.style.borderColor = "var(--bd)"; }}
        >
          {busy === "remove" ? <span style={{ fontSize: "8px" }}>…</span> : <IcoX />}
        </button>

        <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--t1)", marginBottom: "2px", paddingRight: "24px", lineHeight: "1.3" }}>
          {app.job_title}
        </div>
        <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "9px" }}>{app.company}</div>

        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "10px", color: "var(--blue)", background: "var(--blue-d)", border: "1px solid var(--blue-b)", padding: "2px 8px", borderRadius: "20px" }}>
            In Queue
          </span>
          {app.match_score > 0 && (
            <span style={{ fontSize: "10px", color: "var(--t2)", background: "var(--bg-el)", border: "1px solid var(--bd)", padding: "2px 8px", borderRadius: "20px" }}>
              {app.match_score}%
            </span>
          )}
        </div>
      </div>

      {/* Action strip */}
      <div style={{ display: "flex", borderTop: "1px solid var(--bd)" }}>
        <button
          onClick={handleApply}
          disabled={!!busy}
          style={{
            flex: 1, padding: "8px 4px",
            background: "none", border: "none", borderRight: "1px solid var(--bd)",
            color: busy === "apply" ? "var(--t3)" : "var(--green)",
            fontSize: "10px", fontWeight: "700",
            cursor: busy ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
            transition: "var(--ease)",
          }}
          onMouseEnter={e => { if (!busy) e.currentTarget.style.background = "var(--green-d)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
        >
          <IcoCheck /> {busy === "apply" ? "Saving…" : "Mark Applied"}
        </button>

        {isUrl ? (
          <a href={url} target="_blank" rel="noreferrer" style={{
            flex: 1, padding: "8px 4px",
            background: "none",
            color: "var(--blue)", fontSize: "10px", fontWeight: "700",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
            textDecoration: "none", transition: "var(--ease)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--blue-d)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <IcoLink /> View Job
          </a>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "10px", color: "var(--t3)" }}>No link</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────── */
function Toast({ msg, color }) {
  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999,
      background: "var(--bg-card)", border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "var(--r3)", padding: "10px 20px",
      fontSize: "13px", fontWeight: "600", color: "var(--t1)",
      boxShadow: "0 8px 32px rgba(0,0,0,.25)",
      animation: "fadeUp .16s ease both",
      whiteSpace: "nowrap",
    }}>
      {msg}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN PAGE
   Single source of truth: `apps` state array from backend.
   localStorage cart is only used as a write-through mirror so
   JobResultsPage can filter out queued jobs from its display.
═════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [apps,    setApps]    = useState([]);   // ← THE single source of truth
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState(null);
  const [busy,    setBusy]    = useState({});   // { [app.id]: true } while API in-flight

  const navigate = useNavigate();
  const resumeId = localStorage.getItem("resume_id");
  const user     = (sessionStorage.getItem("user_email") || "").split("@")[0] || "there";

  /* ── Load ─────────────────────────────────────────────────
     Always fetch fresh from backend on mount.
     Also sync the cart localStorage so JobResultsPage
     knows which jobs are already in queue.
  ──────────────────────────────────────────────────────── */
  const loadApps = useCallback(async () => {
    try {
      const res = await getApplications();
      const list = res.applications || [];
      setApps(list);
      syncCartFromApps(list);
    } catch {}
  }, []);

  useEffect(() => {
    loadApps().finally(() => setLoading(false));
  }, [loadApps]);

  /* ── Sync localStorage cart from backend apps ─────────────
     JobResultsPage reads localStorage["cart"] to filter out
     already-queued/applied jobs. Keep it consistent with DB.
  ──────────────────────────────────────────────────────── */
  const syncCartFromApps = (list) => {
    const cart     = {};
    const cartJobs = {};
    for (const app of list) {
      if (!app.apply_url) continue;
      // Only active (non-removed) jobs stay in cart
      if (["queued", "Interested", "applied", "Applied"].includes(app.status)) {
        cart[app.apply_url]     = app.status;
        cartJobs[app.apply_url] = {
          apply_link:  app.apply_url,
          title:       app.job_title,
          job_title:   app.job_title,
          company:     app.company,
          match_score: app.match_score || 0,
        };
      }
    }
    localStorage.setItem("cart",     JSON.stringify(cart));
    localStorage.setItem("cartJobs", JSON.stringify(cartJobs));
  };

  /* ── Toast ──────────────────────────────────────────────── */
  const flash = (msg, color = "var(--green)") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  /* ── Optimistic state helpers ───────────────────────────── */
  const removeFromState = (id) =>
    setApps(prev => {
      const next = prev.filter(a => a.id !== id);
      syncCartFromApps(next);
      return next;
    });

  const updateStatusInState = (id, status) =>
    setApps(prev => {
      const next = prev.map(a => a.id === id ? { ...a, status } : a);
      syncCartFromApps(next);
      return next;
    });

  const setBusyFor = (id, val) =>
    setBusy(prev => ({ ...prev, [id]: val }));

  /* ── RESTORE job back to /jobs results page ─────────────── */
  const restoreToResults = (app) => {
    if (!app.apply_url) return;
    const jobObj = {
      apply_link:  app.apply_url,
      title:       app.job_title,
      job_title:   app.job_title,
      company:     app.company,
      match_score: app.match_score || 0,
    };
    try {
      const raw    = localStorage.getItem("jobs");
      if (!raw) { localStorage.setItem("jobs", JSON.stringify([jobObj])); return; }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (!parsed.some(j => j.apply_link === app.apply_url))
          localStorage.setItem("jobs", JSON.stringify([jobObj, ...parsed]));
      } else {
        const jobs = parsed.jobs || [];
        if (!jobs.some(j => j.apply_link === app.apply_url))
          localStorage.setItem("jobs", JSON.stringify({ ...parsed, jobs: [jobObj, ...jobs] }));
      }
    } catch {}
  };

  /* ══ ACTION: REMOVE FROM QUEUE ════════════════════════════
     1. Optimistically remove from state immediately
     2. Remove from localStorage cart
     3. Restore job back to /jobs results
     4. Call DELETE /api/applications/:id
     5. On failure → reload from backend to restore truth
  ═════════════════════════════════════════════════════════ */
  const handleRemove = async (app) => {
    // 1. Optimistic — remove from UI right now
    removeFromState(app.id);
    restoreToResults(app);
    flash(`"${app.job_title}" removed from queue`, "var(--blue)");

    // 2. Backend delete
    try {
      await removeApplication(app.id);
    } catch {
      // Rollback: reload fresh from backend
      flash("Failed to remove — refreshing…", "var(--red)");
      await loadApps();
    }
  };

  /* ══ ACTION: MARK APPLIED ══════════════════════════════════
     1. Optimistic status change
     2. PATCH /api/applications/:id  { status: "applied" }
     3. On failure → reload
  ═════════════════════════════════════════════════════════ */
  const handleApply = async (app) => {
    setBusyFor(app.id, true);
    updateStatusInState(app.id, "applied");
    flash(`Marked "${app.job_title}" as applied!`);

    try {
      await updateApplication(app.id, { status: "applied" });
    } catch {
      flash("Failed to update — refreshing…", "var(--red)");
      await loadApps();
    } finally {
      setBusyFor(app.id, false);
    }
  };

  /* ══ ACTION: MARK REJECTED ═════════════════════════════════
     1. Optimistic status change
     2. PATCH /api/applications/:id  { status: "rejected" }
     3. On failure → reload
  ═════════════════════════════════════════════════════════ */
  const handleReject = async (app) => {
    setBusyFor(app.id, true);
    updateStatusInState(app.id, "rejected");
    flash(`Marked "${app.job_title}" as rejected`, "var(--red)");

    try {
      await updateApplication(app.id, { status: "rejected" });
    } catch {
      flash("Failed to update — refreshing…", "var(--red)");
      await loadApps();
    } finally {
      setBusyFor(app.id, false);
    }
  };

  /* ── Derived data ───────────────────────────────────────── */
  const counts = useMemo(() => ({
    queue:    apps.filter(a => isQueue(a.status)).length,
    applied:  apps.filter(a => isApplied(a.status)).length,
    rejected: apps.filter(a => isRejected(a.status)).length,
    total:    apps.length,
  }), [apps]);

  const avgScore = apps.length
    ? Math.round(apps.reduce((s, a) => s + (a.match_score || 0), 0) / apps.length) : 0;

  const queueItems = useMemo(() => apps.filter(a => isQueue(a.status)), [apps]);

  const visible = useMemo(() => {
    let list = apps;
    if (filter === "queue")    list = list.filter(a => isQueue(a.status));
    if (filter === "applied")  list = list.filter(a => isApplied(a.status));
    if (filter === "rejected") list = list.filter(a => isRejected(a.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.job_title || "").toLowerCase().includes(q) ||
        (a.company   || "").toLowerCase().includes(q));
    }
    return list;
  }, [apps, filter, search]);

  const FILTERS = [
    { k: "all",      lbl: "All",      n: counts.total    },
    { k: "queue",    lbl: "Queue",    n: counts.queue    },
    { k: "applied",  lbl: "Applied",  n: counts.applied  },
    { k: "rejected", lbl: "Rejected", n: counts.rejected },
  ];

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: "22px", height: "22px", border: "2px solid var(--bd)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
    </div>
  );

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "32px 24px", boxSizing: "border-box" }}>

      {toast && <Toast {...toast} />}

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--t1)", letterSpacing: "-0.5px" }}>
            Welcome back, {user.charAt(0).toUpperCase() + user.slice(1)}
          </h1>
          <p style={{ fontSize: "12px", color: "var(--t3)", marginTop: "4px" }}>Here's what's happening with your career search.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => navigate("/resume-score")} style={{
            padding: "8px 14px", background: "var(--bg-el)", border: "1px solid var(--bd)",
            borderRadius: "var(--r2)", fontSize: "12px", fontWeight: "600",
            color: "var(--t2)", cursor: "pointer", transition: "var(--ease)",
            display: "flex", alignItems: "center", gap: "6px",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--bd-h)"; e.currentTarget.style.color = "var(--t1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)";   e.currentTarget.style.color = "var(--t2)"; }}
          ><IcoCoach /> AI Coach</button>
          <button onClick={() => navigate("/resumes")} style={{
            padding: "8px 14px", background: "var(--blue)", border: "none",
            borderRadius: "var(--r2)", fontSize: "12px", fontWeight: "600",
            color: "#fff", cursor: "pointer", transition: "var(--ease)",
            display: "flex", alignItems: "center", gap: "6px",
          }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
          ><IcoResume /> Update Resume</button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        <StatCard ico={<IcoSend />} value={counts.applied}  label="Applications Sent" color="var(--green)"  />
        <StatCard ico={<IcoCart />} value={counts.queue}    label="Jobs in Queue"      color="var(--blue)"   />
        <StatCard
          ico={<IcoReject />}       value={counts.rejected} label="Rejected"           color="var(--red)"
        />
        <StatCard
          ico={<IcoBolt />}         value={`${avgScore}%`}  label="Avg Match Score"
          note={avgScore >= 70 ? "Strong" : avgScore >= 50 ? "Good" : undefined}
          color="var(--purple)"
        />
      </div>

      {/* ── Main grid ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "20px", alignItems: "start" }}>

        {/* Left */}
        <div style={{ minWidth: 0 }}>

          {/* ── Jobs in Queue section ──────────────────────── */}
          {queueItems.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <IcoCart /> Jobs in Queue
                  <span style={{ fontSize: "11px", fontWeight: "400", color: "var(--t3)" }}>({queueItems.length})</span>
                </h2>
                <span style={{ fontSize: "11px", color: "var(--t3)" }}>× removes &amp; returns to job results</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
                {queueItems.map(app => (
                  <QCard
                    key={app.id}
                    app={app}
                    onRemove={handleRemove}
                    onApply={handleApply}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Applications table ─────────────────────────── */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "var(--r4)", overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid var(--bd)",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px",
            }}>
              <h2 style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>Applications</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "var(--bg-el)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r2)", padding: "5px 10px",
                }}>
                  <span style={{ color: "var(--t3)" }}><IcoSearch /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                    style={{ background: "none", border: "none", outline: "none", fontSize: "12px", color: "var(--t1)", width: "120px" }} />
                </div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {FILTERS.map(({ k, lbl, n }) => (
                    <button key={k} onClick={() => setFilter(k)} style={{
                      padding: "4px 9px", borderRadius: "20px", cursor: "pointer",
                      fontSize: "11px", fontWeight: "600", transition: "var(--ease)",
                      background: filter === k ? "var(--blue)" : "var(--bg-el)",
                      color:      filter === k ? "#fff"        : "var(--t2)",
                      border: `1px solid ${filter === k ? "var(--blue)" : "var(--bd)"}`,
                    }}>{lbl}{n > 0 ? ` (${n})` : ""}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table body */}
            {visible.length === 0 ? (
              <div style={{ padding: "56px", textAlign: "center" }}>
                {apps.length === 0 ? (
                  <>
                    <div style={{ color: "var(--bd-h)", marginBottom: "16px", display: "flex", justifyContent: "center" }}><IcoJobs /></div>
                    <div style={{ fontWeight: "600", color: "var(--t2)", marginBottom: "6px", fontSize: "14px" }}>No applications yet</div>
                    <div style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "20px" }}>Start adding jobs to your queue</div>
                    <button onClick={() => navigate("/jobs")} style={{
                      padding: "8px 20px", background: "var(--blue)", color: "#fff",
                      border: "none", borderRadius: "var(--r2)", fontWeight: "600", fontSize: "12px", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                    }}>
                      <IcoSearch /> Browse Jobs
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--t3)" }}>No results match your filters.</span>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-el)" }}>
                      {["Company", "Position", "Date", "Status", "Actions"].map(h => (
                        <th key={h} style={{
                          padding: "9px 14px", textAlign: "left",
                          fontSize: "10px", fontWeight: "700", color: "var(--t3)",
                          textTransform: "uppercase", letterSpacing: "0.6px",
                          borderBottom: "1px solid var(--bd)", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((app, i) => {
                      const cfg    = STATUS_CFG[app.status] || STATUS_CFG.applied;
                      const inQ    = isQueue(app.status);
                      const inApp  = isApplied(app.status);
                      const date   = app.applied_at || app.created_at;
                      const dateStr = date
                        ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "—";
                      const isBusy = busy[app.id];

                      return (
                        <tr key={app.id}
                          style={{ borderBottom: i < visible.length - 1 ? "1px solid var(--bd)" : "none", transition: "var(--ease)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hov)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <td style={{ padding: "11px 14px", fontSize: "12px", fontWeight: "700", color: "var(--t1)", whiteSpace: "nowrap" }}>
                            {app.company || "—"}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: "12px", color: "var(--t2)", maxWidth: "200px" }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.job_title}</div>
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: "11px", color: "var(--t3)", whiteSpace: "nowrap" }}>{dateStr}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{
                              fontSize: "10px", fontWeight: "700",
                              color: cfg.color, background: cfg.bg,
                              border: `1px solid ${cfg.color}33`,
                              padding: "3px 8px", borderRadius: "var(--r1)",
                              textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap",
                            }}>{cfg.lbl}</span>
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>

                              {/* Queued → Mark Applied */}
                              {inQ && (
                                <button onClick={() => handleApply(app)} disabled={isBusy} style={{
                                  padding: "4px 9px",
                                  background: "var(--green-d)", border: "1px solid rgba(16,185,129,.28)",
                                  borderRadius: "var(--r1)", color: "var(--green)",
                                  fontSize: "10px", fontWeight: "700",
                                  cursor: isBusy ? "not-allowed" : "pointer",
                                  display: "inline-flex", alignItems: "center", gap: "4px",
                                  transition: "var(--ease)", whiteSpace: "nowrap", opacity: isBusy ? .5 : 1,
                                }}
                                  onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.background = "var(--green)"; e.currentTarget.style.color = "#fff"; } }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "var(--green-d)"; e.currentTarget.style.color = "var(--green)"; }}
                                >
                                  <IcoCheck /> Applied
                                </button>
                              )}

                              {/* Applied → Mark Rejected */}
                              {inApp && (
                                <button onClick={() => handleReject(app)} disabled={isBusy} style={{
                                  padding: "4px 9px",
                                  background: "var(--red-d)", border: "1px solid rgba(239,68,68,.28)",
                                  borderRadius: "var(--r1)", color: "var(--red)",
                                  fontSize: "10px", fontWeight: "700",
                                  cursor: isBusy ? "not-allowed" : "pointer",
                                  display: "inline-flex", alignItems: "center", gap: "4px",
                                  transition: "var(--ease)", whiteSpace: "nowrap", opacity: isBusy ? .5 : 1,
                                }}
                                  onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.background = "var(--red)"; e.currentTarget.style.color = "#fff"; } }}
                                  onMouseLeave={e => { e.currentTarget.style.background = "var(--red-d)"; e.currentTarget.style.color = "var(--red)"; }}
                                >
                                  <IcoReject /> Rejected
                                </button>
                              )}

                              {/* View link */}
                              {app.apply_url?.startsWith("http") && (
                                <a href={app.apply_url} target="_blank" rel="noreferrer" style={{
                                  fontSize: "11px", color: "var(--blue)", fontWeight: "600",
                                  display: "inline-flex", alignItems: "center", gap: "3px",
                                }}>
                                  View <IcoArrow />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>

          {/* Aspirational */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "var(--r4)", padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--t1)", marginBottom: "4px" }}>Aspirational</div>
            <p style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "14px" }}>Top-tier firms worth targeting</p>
            {[
              { co: "Google",        role: "SDE III",      score: 82, c: "#4285f4" },
              { co: "Goldman Sachs", role: "Tech Analyst", score: 74, c: "#3b82f6" },
              { co: "McKinsey",      role: "BA",           score: 67, c: "#6366f1" },
            ].map(({ co, role, score, c }) => (
              <div key={co} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 0", borderBottom: "1px solid var(--bd)",
                transition: "var(--ease)", cursor: "pointer",
              }}
                onMouseEnter={e => e.currentTarget.style.paddingLeft = "4px"}
                onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
              >
                <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "var(--r1)",
                    background: `${c}18`, border: `1px solid ${c}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: "700", color: c,
                  }}>{co[0]}</div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--t1)" }}>{role}</div>
                    <div style={{ fontSize: "10px", color: "var(--t3)" }}>{co}</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--green)" }}>{score}%</div>
              </div>
            ))}
            <button onClick={() => navigate("/jobs")} style={{
              width: "100%", marginTop: "12px", padding: "8px",
              background: "var(--bg-el)", border: "1px solid var(--bd)",
              borderRadius: "var(--r2)", color: "var(--t2)", fontSize: "11px",
              fontWeight: "600", cursor: "pointer", transition: "var(--ease)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--bd-h)"; e.currentTarget.style.color = "var(--t1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)";   e.currentTarget.style.color = "var(--t2)"; }}
            >Browse all jobs <IcoArrow /></button>
          </div>

          {/* Quick links */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "var(--r4)", padding: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "10px" }}>
              Quick Links
            </div>
            {[
              { lbl: "Score My Resume", ico: <IcoCoach />,  go: "/resume-score" },
              { lbl: "Find More Jobs",  ico: <IcoSearch />, go: "/jobs"         },
              { lbl: "Manage Resumes",  ico: <IcoResume />, go: "/resumes"      },
            ].map(({ lbl, ico, go }) => (
              <button key={lbl} onClick={() => navigate(go)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "9px",
                padding: "9px 10px", marginBottom: "3px",
                background: "none", border: "1px solid transparent",
                borderRadius: "var(--r2)", color: "var(--t2)",
                fontSize: "12px", fontWeight: "500", cursor: "pointer", textAlign: "left", transition: "var(--ease)",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-el)"; e.currentTarget.style.borderColor = "var(--bd)"; e.currentTarget.style.color = "var(--t1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "var(--t2)"; }}
              >{ico} {lbl}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}