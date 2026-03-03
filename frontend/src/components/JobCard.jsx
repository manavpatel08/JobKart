import { useState } from "react";

const sc  = s => s >= 80 ? "var(--green)" : s >= 65 ? "var(--blue)" : s >= 45 ? "var(--yellow)" : "var(--red)";
const scd = s => s >= 80 ? "var(--green-d)" : s >= 65 ? "var(--blue-d)" : s >= 45 ? "var(--yellow-d)" : "var(--red-d)";
const cc  = c => c === "CRITICAL" ? "var(--red)" : c === "IMPORTANT" ? "var(--yellow)" : "var(--green)";
const ccb = c => c === "CRITICAL" ? "var(--red-d)" : c === "IMPORTANT" ? "var(--yellow-d)" : "var(--green-d)";

/* Small SVG icons — no emoji */
const IconBriefcase = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconGovt = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <line x1="3" y1="22" x2="21" y2="22"/>
    <line x1="6" y1="18" x2="6" y2="11"/>
    <line x1="10" y1="18" x2="10" y2="11"/>
    <line x1="14" y1="18" x2="14" y2="11"/>
    <line x1="18" y1="18" x2="18" y2="11"/>
    <polygon points="12 2 20 7 4 7"/>
  </svg>
);
const IconStar = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconChart = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const IconAlert = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconBook = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
    style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconPlus = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconArrow = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* Chip */
function Chip({ icon, label, color = "var(--t2)", bg = "var(--bg-el)", border = "var(--bd)" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "10px", fontWeight: "600",
      color, background: bg,
      border: `1px solid ${border}`,
      padding: "2px 8px", borderRadius: "20px",
    }}>
      {icon}{label}
    </span>
  );
}

export default function JobCard({ job, onQueue, onApply, onDetails }) {
  const [expanded, setExpanded] = useState(false);

  const score       = job.match_score ?? 0;
  const isAspire    = job.is_aspirational || !!job.opportunity_tag;
  const salary      = job.salary && job.salary !== "Not listed" ? job.salary : null;
  const isIntern    = (job.job_category || "").toLowerCase().includes("intern");
  const missing     = (job.missing_skills || []).slice(0, 4);
  const matched     = (job.matched_skills  || []).slice(0, 4);
  const roadmaps    = (job.learning_recommendations || job.roadmaps || []).slice(0, 2);
  const critCount   = job.critical_count || 0;
  const hasMissing  = missing.length > 0;
  const hasRoadmaps = roadmaps.length > 0;

  const bdColor = isAspire ? "rgba(59,130,246,.2)" : "var(--bd)";
  const bdHover = isAspire ? "rgba(59,130,246,.45)" : "var(--bd-h)";

  return (
    <div
      onClick={() => onDetails?.(job)}
      style={{
        background: "var(--bg-card)", border: `1px solid ${bdColor}`,
        borderRadius: "var(--r4)", display: "flex", flexDirection: "column",
        overflow: "hidden", cursor: "pointer",
        transition: "all 0.18s ease", userSelect: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = bdHover; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--sh-lg)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = bdColor; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Score accent bar */}
      <div style={{ height: "2px", background: `linear-gradient(90deg,${sc(score)},${sc(score)}22)`, width: `${score}%`, transition: "width .6s ease" }} />

      <div style={{ padding: "16px 16px 14px", flex: 1 }}>
        {/* Row 1: avatar + score */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "var(--r2)",
            background: "var(--bg-el)", border: "1px solid var(--bd)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "700", color: "var(--t2)", flexShrink: 0,
          }}>
            {job.company?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            {isAspire && (
              <Chip
                icon={<IconStar />}
                label={job.opportunity_tag?.replace(/^[^\s]+\s/, "") || "Aspirational"}
                color="var(--blue)" bg="var(--blue-d)" border="var(--blue-b)"
              />
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: scd(score), border: `1px solid ${sc(score)}44`,
              borderRadius: "20px", padding: "2px 9px",
            }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc(score) }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: sc(score), fontFamily: "'JetBrains Mono',monospace" }}>
                {score}%
              </span>
            </div>
          </div>
        </div>

        {/* Title / company */}
        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)", lineHeight: "1.3", marginBottom: "3px", letterSpacing: "-0.2px" }}>
          {job.title}
        </div>
        <div style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "11px" }}>
          {job.company}
          {job.location && <span style={{ color: "var(--t3)" }}> · {job.location.split(",")[0]}</span>}
        </div>

        {/* Salary */}
        {salary ? (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.7px", color: "var(--t3)", textTransform: "uppercase", marginBottom: "2px" }}>
              {isIntern ? "Stipend" : "Salary"}
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--t1)" }}>{salary}</div>
          </div>
        ) : (
          <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "12px" }}>Compensation not listed</div>
        )}

        {/* Type chips */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "13px" }}>
          {job.job_type && <Chip label={job.job_type} />}
          {job.work_mode && <Chip icon={<IconGlobe />} label={job.work_mode} />}
          {job.is_govt     && <Chip icon={<IconGovt />}  label="Govt"       color="var(--blue)"   bg="var(--blue-d)"   border="var(--blue-b)"   />}
          {job.is_research && <Chip icon={<IconBook />}  label="Research"   color="var(--purple)" bg="var(--purple-d)" border="rgba(139,92,246,.3)" />}
          {job.is_quant    && <Chip icon={<IconChart />} label="Quant"      color="var(--green)"  bg="var(--green-d)"  border="rgba(16,185,129,.3)" />}
          {job.is_consulting && <Chip icon={<IconBriefcase />} label="Consulting" color="var(--yellow)" bg="var(--yellow-d)" border="rgba(245,158,11,.3)" />}
        </div>

        {/* Missing skills */}
        {hasMissing && (
          <div style={{ marginBottom: "11px" }}>
            <div style={{
              fontSize: "9px", fontWeight: "700", color: critCount > 0 ? "var(--red)" : "var(--yellow)",
              letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "6px",
              display: "flex", alignItems: "center", gap: "5px",
            }}>
              <IconAlert />
              Missing Skills
              {critCount > 0 && (
                <span style={{ background: "var(--red-d)", color: "var(--red)", border: "1px solid rgba(239,68,68,.28)", borderRadius: "20px", padding: "0 6px", fontSize: "9px", fontWeight: "700" }}>
                  {critCount} critical
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {missing.map((m, i) => {
                const skill = typeof m === "string" ? m : m.skill;
                const crit  = typeof m === "object" ? m.criticality : "MINOR";
                return (
                  <span key={i} style={{
                    fontSize: "10px", fontWeight: "600", color: cc(crit), background: ccb(crit),
                    padding: "2px 7px", borderRadius: "20px", border: `1px solid ${cc(crit)}33`,
                  }}>{skill}</span>
                );
              })}
            </div>
          </div>
        )}

        {/* Matched skills (when no gaps) */}
        {matched.length > 0 && !hasMissing && (
          <div style={{ marginBottom: "11px" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--green)", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "5px", display: "flex", alignItems: "center", gap: "5px" }}>
              <IconCheck /> Matched
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {matched.map((s, i) => (
                <span key={i} style={{ fontSize: "10px", fontWeight: "600", color: "var(--green)", background: "var(--green-d)", padding: "2px 7px", borderRadius: "20px", border: "1px solid rgba(16,185,129,.25)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning path toggle */}
        {hasRoadmaps && (
          <div style={{ marginBottom: "8px" }}>
            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                fontSize: "10px", fontWeight: "600", color: "var(--blue)",
                textTransform: "uppercase", letterSpacing: "0.5px",
                display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              <IconChevron open={expanded} />
              Learning Path ({roadmaps.length})
            </button>
            {expanded && (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {roadmaps.map((r, i) => {
                  const skill = typeof r === "string" ? r : r.skill;
                  const time  = typeof r === "object" ? r.total_time : null;
                  return (
                    <div key={i} style={{ background: "var(--bg-el)", borderRadius: "var(--r2)", padding: "8px 10px", fontSize: "11px", border: "1px solid var(--bd)" }}>
                      <div style={{ fontWeight: "600", color: "var(--t1)", marginBottom: "2px" }}>
                        {skill}{time && <span style={{ color: "var(--t3)", fontWeight: "400" }}> · {time}</span>}
                      </div>
                      {typeof r === "object" && r.steps?.[0] && (
                        <div style={{ color: "var(--t3)" }}>{r.steps[0]}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action strip */}
      <div style={{ display: "flex", borderTop: "1px solid var(--bd)" }} onClick={e => e.stopPropagation()}>
        {[
          { label: "Queue", icon: <IconPlus />, color: "var(--blue)", onClick: () => onQueue?.(job) },
          { label: "Details", icon: null, color: "var(--t2)", onClick: () => onDetails?.(job) },
        ].map(({ label, icon, color, onClick }, i) => (
          <button key={label} onClick={onClick} style={{
            flex: 1, padding: "10px 0",
            background: "none", border: i < 1 ? "none" : "none",
            borderRight: "1px solid var(--bd)",
            color, fontSize: "11px", fontWeight: "600",
            cursor: "pointer", transition: "var(--ease)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            ...(i === 0 ? { borderBottomLeftRadius: "var(--r4)" } : {}),
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-el)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            {icon}{label}
          </button>
        ))}
        <a
          href={job.apply_link} target="_blank" rel="noreferrer"
          onClick={e => { e.stopPropagation(); onApply?.(job); }}
          style={{
            flex: 1, padding: "10px 0",
            background: "none", color: "var(--green)",
            fontSize: "11px", fontWeight: "700",
            textDecoration: "none", textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            transition: "var(--ease)", borderBottomRightRadius: "var(--r4)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--green-d)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          Apply <IconArrow />
        </a>
      </div>
    </div>
  );
}