import { useState, useEffect } from "react";
import { analyzeJobSkills } from "../api/api";

const CRIT = {
  CRITICAL:  { color: "var(--red)",    dim: "var(--red-d)",    bd: "rgba(239,68,68,.2)",  lbl: "CRITICAL"  },
  IMPORTANT: { color: "var(--yellow)", dim: "var(--yellow-d)", bd: "rgba(245,158,11,.2)", lbl: "IMPORTANT" },
  MINOR:     { color: "var(--green)",  dim: "var(--green-d)",  bd: "rgba(16,185,129,.2)", lbl: "MINOR GAP" },
};

const sc = s =>
  s >= 80 ? "var(--green)"  : s >= 60 ? "var(--blue)"   :
  s >= 40 ? "var(--yellow)" : "var(--red)";

export default function JobDetailModal({ job, onClose, onQueue, onApply, resumeId }) {
  const [tab, setTab]       = useState("skillgap");
  const [gap, setGap]       = useState(job.skill_gap || null);
  const [loading, setL]     = useState(false);
  const [marked, setMarked] = useState(false);
  const score = job.match_score ?? 0;

  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (!gap && resumeId && job.title) {
      setL(true);
      analyzeJobSkills(resumeId, job.title, job.description || "", score)
        .then(r => setGap(r)).catch(() => {}).finally(() => setL(false));
    }
  }, []);

  const handleMarkApplied = () => {
    setMarked(true);
    onApply?.(job);
    setTimeout(() => onClose(), 600);
  };

  const missing   = gap?.missing_skills || [];
  const critical  = missing.filter(s => s.criticality === "CRITICAL").length;
  const important = missing.filter(s => s.criticality === "IMPORTANT").length;
  const minor     = missing.filter(s => s.criticality === "MINOR").length;
  const TABS = [
    { k: "overview",  lbl: "Overview"   },
    { k: "skillgap",  lbl: "Skill Gap"  },
    { k: "jobinfo",   lbl: "Job Info"   },
  ];

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
        zIndex: 1000, display: "flex", alignItems: "flex-start",
        justifyContent: "center", padding: "20px 16px", overflowY: "auto",
      }}
    >
      <div className="scale-in" style={{
        background: "var(--bg-card)",
        borderRadius: "var(--r4)",
        width: "100%", maxWidth: "780px",
        border: "1px solid var(--bd)",
        boxShadow: "var(--sh-lg)",
        overflow: "hidden",
        marginTop: "8px", marginBottom: "20px",
      }}>
        {/* ── TOP BAR ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "13px 20px", borderBottom: "1px solid var(--bd)",
          background: "var(--bg-el)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "var(--r1)",
              background: "var(--blue-d)", border: "1px solid var(--blue-b)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
            }}>💼</div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>{job.title}</div>
              <div style={{ fontSize: "11px", color: "var(--t3)" }}>{job.company}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "var(--green-d)", border: "1px solid rgba(16,185,129,.25)",
              borderRadius: "20px", padding: "3px 10px",
            }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)" }} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--green)", fontFamily: "'JetBrains Mono',monospace" }}>
                {score}% Match
              </span>
            </div>
            <button onClick={onClose} style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--bg-hov)", border: "1px solid var(--bd)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", color: "var(--t2)", transition: "var(--ease)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--red-d)"; e.currentTarget.style.color = "var(--red)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-hov)"; e.currentTarget.style.color = "var(--t2)"; }}
            >×</button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: "24px" }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--t1)", letterSpacing: "-0.4px" }}>{job.title}</h2>
              <div style={{ display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap", fontSize: "13px", color: "var(--t2)" }}>
                {job.company  && <span>🏢 {job.company}</span>}
                {job.location && <span>📍 {job.location}</span>}
                {job.salary && job.salary !== "Not listed" && (
                  <span style={{ color: "var(--blue)", fontWeight: "600" }}>💰 {job.salary}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0, minWidth: "200px" }}>
              {/* Row 1: Save + Apply link */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { onQueue(job); onClose(); }} style={{
                  padding: "9px 14px", borderRadius: "var(--r2)",
                  background: "var(--bg-el)", border: "1px solid var(--bd)",
                  color: "var(--t2)", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  transition: "var(--ease)", display: "flex", alignItems: "center", gap: "5px",
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--bd-h)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--bd)"}
                >🔖 Save</button>
                <a href={job.apply_link} target="_blank" rel="noreferrer"
                  style={{
                    flex: 1, padding: "9px 14px", borderRadius: "var(--r2)",
                    background: "var(--blue)", color: "#fff",
                    fontSize: "13px", fontWeight: "600",
                    textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    transition: "var(--ease)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.12)"}
                  onMouseLeave={e => e.currentTarget.style.filter = "none"}
                >Apply Now →</a>
              </div>

              {/* Row 2: Mark as Applied */}
              <button
                onClick={handleMarkApplied}
                disabled={marked}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "var(--r2)",
                  background: marked ? "var(--green-d)" : "rgba(16,185,129,0.08)",
                  border: `1px solid ${marked ? "rgba(16,185,129,.5)" : "rgba(16,185,129,.3)"}`,
                  color: "var(--green)",
                  fontSize: "13px", fontWeight: "600",
                  cursor: marked ? "default" : "pointer",
                  transition: "var(--ease)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
                onMouseEnter={e => { if (!marked) e.currentTarget.style.background = "var(--green-d)"; }}
                onMouseLeave={e => { if (!marked) e.currentTarget.style.background = "rgba(16,185,129,0.08)"; }}
              >
                {marked ? "✅ Marked as Applied!" : "✓ Mark as Applied"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", marginBottom: "22px" }}>
            {TABS.map(({ k, lbl }) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "9px 16px", background: "none", border: "none",
                borderBottom: `2px solid ${tab === k ? "var(--blue)" : "transparent"}`,
                color: tab === k ? "var(--blue)" : "var(--t2)",
                fontSize: "13px", fontWeight: tab === k ? "600" : "400",
                cursor: "pointer", marginBottom: "-1px", transition: "var(--ease)",
              }}>{lbl}</button>
            ))}
          </div>

          {/* ── SKILL GAP ── */}
          {tab === "skillgap" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 210px", gap: "22px", alignItems: "start" }}>
              <div>
                {missing.length > 0 && (
                  <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {critical  > 0 && <Chip color="var(--red)"    dim="var(--red-d)"    bd="rgba(239,68,68,.25)"  lbl={`🔴 ${critical} Critical`} />}
                    {important > 0 && <Chip color="var(--yellow)" dim="var(--yellow-d)" bd="rgba(245,158,11,.25)" lbl={`🟡 ${important} Important`} />}
                    {minor     > 0 && <Chip color="var(--green)"  dim="var(--green-d)"  bd="rgba(16,185,129,.25)" lbl={`🟢 ${minor} Minor`} />}
                  </div>
                )}

                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)", marginBottom: "14px" }}>
                  📊 Skill Gap Analysis
                </h3>

                {loading && (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--t3)" }}>
                    <div style={{ width: "22px", height: "22px", border: "2px solid var(--bd)", borderTopColor: "var(--blue)", borderRadius: "50%", margin: "0 auto 12px", animation: "spin .8s linear infinite" }} />
                    Analysing skill gaps…
                  </div>
                )}

                {!loading && missing.length === 0 && (
                  <div style={{
                    padding: "24px", textAlign: "center",
                    background: "var(--green-d)", border: "1px solid rgba(16,185,129,.25)",
                    borderRadius: "var(--r3)", color: "var(--green)", fontSize: "13px", fontWeight: "500",
                  }}>
                    ✅ Strong match — no critical skill gaps identified
                  </div>
                )}

                {!loading && missing.map((s, i) => (
                  <GapCard key={i} skill={s} cfg={CRIT[s.criticality] || CRIT.MINOR} />
                ))}
              </div>

              {/* Right panel */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{
                  background: "var(--bg-el)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r3)", padding: "18px", textAlign: "center",
                }}>
                  <div style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    border: `4px solid ${sc(score)}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 10px",
                  }}>
                    <span style={{ fontSize: "20px", fontWeight: "800", color: sc(score), fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{score}</span>
                    <span style={{ fontSize: "10px", color: "var(--t3)" }}>/ 100</span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--t2)" }}>Match Score</div>
                  {gap?.estimated_score_after_upskilling > score + 5 && (
                    <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", fontWeight: "600" }}>
                      ↑{gap.estimated_score_after_upskilling}% after upskilling
                    </div>
                  )}
                </div>

                <div style={{
                  background: "var(--bg-el)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r3)", padding: "14px",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--t1)", marginBottom: "10px" }}>Job Details</div>
                  {[
                    { icon: "📍", val: job.location || "Not specified" },
                    { icon: "💼", val: job.job_type || "Not specified" },
                    { icon: "🖥",  val: job.work_mode || "Not specified" },
                    { icon: "💰", val: job.salary   || "Not listed"    },
                    { icon: "📅", val: job.posted   || "Recent"        },
                  ].map(({ icon, val }, i) => (
                    <div key={i} style={{ display: "flex", gap: "7px", fontSize: "12px", color: "var(--t2)", marginBottom: "6px" }}>
                      <span style={{ flexShrink: 0 }}>{icon}</span><span>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)", marginBottom: "12px" }}>About the Role</h3>
              {job.description ? (
                <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.75", whiteSpace: "pre-wrap" }}>{job.description}</p>
              ) : (
                <p style={{ color: "var(--t3)", fontSize: "13px" }}>
                  No description available.{" "}
                  <a href={job.apply_link} target="_blank" rel="noreferrer">View on company site →</a>
                </p>
              )}
            </div>
          )}

          {/* ── JOB INFO ── */}
          {tab === "jobinfo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { lbl: "Company",   val: job.company   },
                { lbl: "Location",  val: job.location  },
                { lbl: "Type",      val: job.job_type  },
                { lbl: "Work Mode", val: job.work_mode },
                { lbl: "Category",  val: job.job_category },
                { lbl: "Salary",    val: job.salary    },
                { lbl: "Posted",    val: job.posted    },
                { lbl: "Link",      val: job.apply_link, link: true },
              ].filter(r => r.val).map(({ lbl, val, link }) => (
                <div key={lbl} style={{
                  display: "flex", gap: "12px",
                  padding: "10px 14px", background: "var(--bg-el)",
                  borderRadius: "var(--r2)", border: "1px solid var(--bd)",
                }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--t3)", minWidth: "80px", paddingTop: "1px" }}>{lbl}</span>
                  {link
                    ? <a href={val} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--blue)", wordBreak: "break-all" }}>{val}</a>
                    : <span style={{ fontSize: "13px", color: "var(--t1)" }}>{val}</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "11px 24px", borderTop: "1px solid var(--bd)",
          background: "var(--bg-el)", display: "flex", justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", letterSpacing: "0.5px" }}>JOB ID</div>
            <div style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "'JetBrains Mono',monospace" }}>
              {(job.apply_link || "").slice(-18) || "—"}
            </div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--t3)" }}>{job.posted || "Posted recently"}</span>
        </div>
      </div>
    </div>
  );
}

function Chip({ color, dim, bd, lbl }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: "700", color, background: dim, border: `1px solid ${bd}`, padding: "3px 10px", borderRadius: "20px" }}>
      {lbl}
    </span>
  );
}

function GapCard({ skill, cfg }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: `1px solid ${cfg.bd}`, borderRadius: "var(--r3)", marginBottom: "10px", overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 14px", background: cfg.dim, cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "10px", fontWeight: "800", letterSpacing: "0.5px",
            color: cfg.color, background: `${cfg.color}22`,
            border: `1px solid ${cfg.color}44`,
            padding: "2px 7px", borderRadius: "var(--r1)", textTransform: "uppercase",
          }}>{cfg.lbl}</span>
          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)" }}>{skill.skill}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {skill.score_boost && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", letterSpacing: "0.4px" }}>IMPACT</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--green)" }}>+{skill.score_boost}% Match</div>
            </div>
          )}
          <span style={{ color: "var(--t3)", fontSize: "12px" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: "14px", background: "var(--bg-card)", animation: "slideDown .15s ease" }}>
          {skill.reason && (
            <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.65", marginBottom: "10px" }}>
              <strong style={{ color: "var(--t1)" }}>Why it matters:</strong> {skill.reason}
            </p>
          )}
          <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
            {skill.learning_time && (
              <div>
                <div style={{ fontSize: "10px", color: "var(--t3)", letterSpacing: "0.4px", marginBottom: "2px" }}>LEARNING TIME</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: cfg.color }}>{skill.learning_time}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}