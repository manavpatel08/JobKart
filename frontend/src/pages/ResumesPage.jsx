import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume, getResumes, deleteResume, searchJobs } from "../api/api";

/* ── SVG Icons ───────────────────────────────────────────────── */
const IconFile = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} fill="none" stroke={color} strokeWidth="1.6" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconUpload = ({ size = 18 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconSearch = ({ size = 13 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
  </svg>
);
const IconTrash = ({ size = 13 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconUser = ({ size = 12 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconX = ({ size = 14 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconSpin = () => (
  <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,.25)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.65s linear infinite" }} />
);

/* ── Searching animation overlay ─────────────────────────────── */
const MSGS = [
  "Parsing your resume with AI",
  "Detecting skills and experience",
  "Querying Google Jobs — 50+ searches",
  "Scanning FAANG and MNC career pages",
  "Checking ISRO, DRDO, BARC portals",
  "Looking at quant firms — Optiver, DE Shaw",
  "Searching IIT, IISc research internships",
  "Exploring McKinsey, BCG, Bain roles",
  "Scanning unicorn startups",
  "Querying LinkedIn and Glassdoor",
  "Running semantic matching on all results",
  "Ranking by your personal match score",
  "Preparing your personalised job board",
];

function SearchOverlay({ filename }) {
  const [idx, setIdx]       = useState(0);
  const [progress, setP]    = useState(0);
  const [visible, setV]     = useState(false);

  useEffect(() => {
    setV(true);
    const m = setInterval(() => setIdx(i => (i + 1) % MSGS.length), 2600);
    const p = setInterval(() => setP(v => Math.min(v + 0.35, 92)), 110);
    return () => { clearInterval(m); clearInterval(p); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(8,12,20,0.97)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: visible ? 1 : 0, transition: "opacity 0.4s ease",
    }}>
      <div style={{ textAlign: "center", maxWidth: "520px", padding: "40px 24px" }}>

        {/* Radar rings */}
        <div style={{ position: "relative", width: "110px", height: "110px", margin: "0 auto 36px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "1px solid rgba(59,130,246,0.3)",
              animation: `radarPulse 2.2s ease-out ${i * 0.73}s infinite`,
            }} />
          ))}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "52px", height: "52px", borderRadius: "50%",
            background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconSearch size={20} />
          </div>
        </div>

        {/* Message */}
        <div key={idx} style={{
          fontSize: "18px", fontWeight: "700", color: "var(--t1)",
          marginBottom: "8px", letterSpacing: "-0.3px",
          animation: "fadeUp 0.3s ease both",
        }}>
          {MSGS[idx]}
        </div>
        <div style={{ fontSize: "12px", color: "var(--t3)", marginBottom: "32px" }}>
          Searching across 50+ targeted queries — this takes 30–60 seconds
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: "2px", background: "var(--bd)", borderRadius: "1px", overflow: "hidden", marginBottom: "28px" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg,var(--blue),var(--purple))",
            borderRadius: "1px", transition: "width 0.11s linear",
            boxShadow: "0 0 10px rgba(59,130,246,0.5)",
          }} />
        </div>

        {/* Terminal stream */}
        <div style={{
          background: "var(--bg-el)", border: "1px solid var(--bd)",
          borderRadius: "var(--r3)", padding: "14px 18px",
          fontFamily: "'JetBrains Mono',monospace", fontSize: "11px",
          color: "var(--t3)", textAlign: "left", lineHeight: "1.9",
        }}>
          <span style={{ color: "var(--blue)" }}>$</span> scan --resume "{filename?.replace(".pdf", "")}"{"\n"}
          {["Google Jobs API", "LinkedIn India", "Glassdoor", "IIT portals"].slice(0, Math.floor(progress / 24) + 1).map((s, i) => (
            <div key={i}><span style={{ color: "var(--green)" }}>✓</span> {s}</div>
          ))}
          <div>
            <span style={{ color: "var(--blue)", animation: "pulse 1s infinite" }}>›</span>{" "}
            {MSGS[idx]}
            <span style={{ animation: "pulse 0.8s infinite" }}>_</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Upload zone ─────────────────────────────────────────────── */
function UploadZone({ onUpload }) {
  const [file, setFile]     = useState(null);
  const [drag, setDrag]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");
  const inputRef = useRef();

  const pick = f => {
    if (!f) return;
    if (!f.name.endsWith(".pdf")) { setError("Only PDF files are supported."); return; }
    setError(""); setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true); setError("");
    try { await onUpload(file); setFile(null); }
    catch (e) { setError(e.response?.data?.detail || "Upload failed. Try again."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--bd)", borderRadius: "var(--r4)", padding: "24px", marginBottom: "28px" }}>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <IconUpload size={16} /> Upload Resume
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${drag ? "var(--blue)" : file ? "var(--green)" : "var(--bd-h)"}`,
          borderRadius: "var(--r3)", padding: "28px",
          textAlign: "center", cursor: "pointer", marginBottom: "14px",
          background: drag ? "var(--blue-d)" : file ? "var(--green-d)" : "var(--bg-el)",
          transition: "all .2s ease",
          boxShadow: drag ? "0 0 0 3px rgba(59,130,246,.1)" : "none",
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
          onChange={e => pick(e.target.files[0])} />
        {file ? (
          <>
            <div style={{ color: "var(--green)", marginBottom: "8px" }}><IconFile size={28} color="var(--green)" /></div>
            <div style={{ fontWeight: "700", color: "var(--green)", fontSize: "13px" }}>{file.name}</div>
            <div style={{ color: "var(--t3)", fontSize: "11px", marginTop: "4px" }}>{(file.size / 1024).toFixed(0)} KB · click to change</div>
          </>
        ) : (
          <>
            <div style={{ color: "var(--t3)", marginBottom: "10px" }}><IconUpload size={28} /></div>
            <div style={{ fontSize: "13px", color: "var(--t2)", fontWeight: "500" }}>
              Drop your PDF here or <span style={{ color: "var(--blue)", fontWeight: "600" }}>browse</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "5px" }}>PDF only · max 10 MB</div>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={upload} disabled={!file || busy} style={{
          flex: 1, padding: "11px",
          background: !file || busy ? "var(--bg-el)" : "var(--blue)",
          color: !file || busy ? "var(--t3)" : "#fff",
          border: "none", borderRadius: "var(--r2)",
          fontSize: "13px", fontWeight: "600",
          cursor: !file || busy ? "not-allowed" : "pointer",
          transition: "var(--ease)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}>
          {busy ? <><IconSpin /> Parsing…</> : "Upload & Parse Resume"}
        </button>
        {file && (
          <button onClick={() => setFile(null)} style={{
            background: "var(--bg-el)", border: "1px solid var(--bd)",
            color: "var(--t3)", borderRadius: "var(--r2)",
            padding: "11px 14px", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}>
            <IconX size={14} />
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginTop: "10px", padding: "10px 14px", background: "var(--red-d)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "var(--r2)", fontSize: "12px", color: "var(--red)" }}>
          {error}
        </div>
      )}
    </div>
  );
}

/* ── Resume card ─────────────────────────────────────────────── */
function ResumeCard({ resume, idx, searchingId, onSearch, onDelete }) {
  const busy   = searchingId === resume.id;
  const skills = resume.parsed_data?.skills || [];
  const name   = resume.parsed_data?.name || "";
  const title  = resume.parsed_data?.current_title || "";

  return (
    <div className="fade-up" style={{
      animationDelay: `${idx * 0.06}s`,
      background: "var(--bg-card)", border: "1px solid var(--bd)",
      borderRadius: "var(--r4)", padding: "20px",
      display: "flex", flexDirection: "column", gap: "14px",
      position: "relative", overflow: "hidden",
      transition: "all .18s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--bd-h)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--sh-lg)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,var(--blue),var(--purple))", opacity: 0.45 }} />

      {/* Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{
          width: "40px", height: "40px", minWidth: "40px",
          background: "var(--blue-d)", border: "1px solid var(--blue-b)",
          borderRadius: "var(--r2)", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--blue)",
        }}>
          <IconFile size={18} color="var(--blue)" />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontWeight: "700", fontSize: "12px", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {resume.filename}
          </div>
          <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "3px" }}>
            {resume.created_at
              ? new Date(resume.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "Uploaded recently"}
          </div>
        </div>
        <button onClick={() => onDelete(resume.id)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--t3)", padding: "4px", borderRadius: "var(--r1)",
          display: "flex", alignItems: "center", transition: "var(--ease)", flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-d)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--t3)"; e.currentTarget.style.background = "none"; }}
        >
          <IconTrash size={13} />
        </button>
      </div>

      {/* Identity */}
      {(name || title) && (
        <div style={{ fontSize: "11px", color: "var(--t2)", display: "flex", alignItems: "center", gap: "6px" }}>
          <IconUser size={11} />
          <span style={{ fontWeight: "600" }}>{name}</span>
          {title && <span style={{ color: "var(--t3)" }}>· {title}</span>}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {skills.slice(0, 6).map((s, i) => (
            <span key={i} style={{
              background: "var(--bg-el)", border: "1px solid var(--bd)",
              color: "var(--t2)", padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "500",
            }}>{s}</span>
          ))}
          {skills.length > 6 && (
            <span style={{ fontSize: "10px", color: "var(--t3)", padding: "2px 4px" }}>+{skills.length - 6}</span>
          )}
        </div>
      )}

      {/* CTA */}
      <button onClick={() => onSearch(resume)} disabled={busy} style={{
        width: "100%", padding: "10px",
        background: busy ? "var(--bg-el)" : "var(--blue)",
        color: busy ? "var(--t3)" : "#fff",
        border: "none", borderRadius: "var(--r2)",
        fontSize: "12px", fontWeight: "700",
        cursor: busy ? "not-allowed" : "pointer",
        transition: "var(--ease)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
      }}
        onMouseEnter={e => !busy && (e.currentTarget.style.filter = "brightness(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.filter = "none")}
      >
        {busy ? <><IconSpin /> Searching…</> : <><IconSearch size={12} /> Find Jobs</>}
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function ResumesPage() {
  const [resumes, setResumes]           = useState([]);
  const [searchingId, setSearchingId]   = useState(null);
  const [searchingFile, setSearchingFile] = useState("");
  const [error, setError]               = useState("");
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await getResumes(); setResumes(d.resumes || []); }
    catch { setError("Failed to load resumes."); }
  };

  const handleUpload = async (file) => {
    await uploadResume(file);
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume?")) return;
    try { await deleteResume(id); setResumes(p => p.filter(r => r.id !== id)); }
    catch { setError("Failed to delete."); }
  };

  const handleSearch = async (resume) => {
    setSearchingId(resume.id);
    setSearchingFile(resume.filename);
    setError("");
    try {
      const data = await searchJobs(resume.id);
      localStorage.setItem("resume_id",   resume.id);
      localStorage.setItem("resume_name", resume.filename);
      if (data.total_found) localStorage.setItem("total_found", data.total_found);
      navigate("/jobs");
    } catch (e) {
      setError(e.response?.data?.detail || "Search failed. Please try again.");
      setSearchingId(null);
      setSearchingFile("");
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 24px" }}>
      {searchingId && <SearchOverlay filename={searchingFile} />}

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--t1)", letterSpacing: "-0.5px", marginBottom: "6px" }}>
          My Resumes
        </h1>
        <p style={{ color: "var(--t3)", fontSize: "12px" }}>
          Upload your resume — we'll search 50+ sources and rank results by match score.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: "18px", padding: "11px 16px", background: "var(--red-d)", border: "1px solid rgba(239,68,68,.25)", borderRadius: "var(--r2)", fontSize: "12px", color: "var(--red)", display: "flex", justifyContent: "space-between" }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>
            <IconX size={14} />
          </button>
        </div>
      )}

      <UploadZone onUpload={handleUpload} />

      {resumes.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "56px 24px",
          background: "var(--bg-card)", border: "1px solid var(--bd)",
          borderRadius: "var(--r4)", color: "var(--t3)",
        }}>
          <div style={{ color: "var(--t3)", marginBottom: "14px" }}><IconFile size={40} /></div>
          <div style={{ fontSize: "15px", color: "var(--t2)", fontWeight: "600", marginBottom: "6px" }}>No resumes yet</div>
          <div style={{ fontSize: "12px" }}>Upload your first resume above to start finding jobs</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: "10px", color: "var(--t3)", marginBottom: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
            {resumes.length} Resume{resumes.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "14px" }}>
            {resumes.map((r, i) => (
              <ResumeCard key={r.id} resume={r} idx={i} searchingId={searchingId} onSearch={handleSearch} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}