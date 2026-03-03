import { useState, useEffect, useRef } from "react";
import { getResumes, scoreResume, getCachedScore, resumeChat } from "../api/api";

const GRADE_COLORS = {
  "A+": "var(--green)", "A": "var(--green)", "A-": "var(--green)",
  "B+": "var(--blue)",  "B": "var(--blue)",  "B-": "var(--blue)",
  "C+": "var(--yellow)","C": "var(--yellow)","C-": "var(--yellow)",
  "D":  "var(--blue)","F": "var(--red)",
};

const TIER_CONFIG = {
  "Elite":           { color: "var(--green)",  bg: "var(--green-d)",  icon: "🏆" },
  "Strong":          { color: "var(--blue)",   bg: "var(--blue-d)",   icon: "💪" },
  "Competitive":     { color: "var(--yellow)", bg: "var(--yellow-d)", icon: "⚡" },
  "Developing":      { color: "var(--blue)", bg: "var(--blue-d)", icon: "📈" },
  "Needs Overhaul":  { color: "var(--red)",    bg: "var(--red-d)",    icon: "🔧" },
};

const STARTER_QUESTIONS = [
  "What's my biggest weakness on this resume?",
  "How do I rewrite my experience bullets to show more impact?",
  "Which companies am I currently competitive for?",
  "How can I improve my match score for FAANG companies?",
  "What certifications should I add?",
  "Is my skills section strong enough?",
];

const DIM_LABELS = {
  impact_and_quantification:    { label: "Impact & Quantification", icon: "📊" },
  technical_depth_and_relevance:{ label: "Technical Depth",         icon: "⚙️" },
  experience_quality:            { label: "Experience Quality",      icon: "💼" },
  formatting_and_readability:    { label: "Formatting",              icon: "📄" },
  education_and_credentials:     { label: "Education",               icon: "🎓" },
  projects_and_portfolio:        { label: "Projects",                icon: "🛠" },
  career_progression:            { label: "Career Progression",      icon: "📈" },
  ats_compatibility:             { label: "ATS Compatibility",        icon: "🤖" },
};

export default function ResumeScorePage() {
  const [resumes, setResumes]         = useState([]);
  const [selectedResume, setSelected] = useState(null);
  const [score, setScore]             = useState(null);
  const [scoring, setScoring]         = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("score"); // "score" | "chat"
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getResumes().then(d => {
      setResumes(d.resumes || []);
      if (d.resumes?.length > 0) {
        setSelected(d.resumes[0]);
        loadCachedScore(d.resumes[0].id);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadCachedScore = async (resumeId) => {
    try {
      const cached = await getCachedScore(resumeId);
      if (cached.cached && cached.success) setScore(cached);
    } catch {}
  };

  const handleScore = async () => {
    if (!selectedResume) return;
    setScoring(true); setScore(null);
    try {
      const result = await scoreResume(selectedResume.id);
      setScore(result);
      // Welcome message in chat
      setMessages([{
        role: "assistant",
        content: `Hi! I've analysed your resume **${selectedResume.filename}** and given it a score of **${result.total_score}/100 (${result.overall_grade})** — ${result.tier}.\n\n${result.executive_summary}\n\nAsk me anything about improving it!`,
      }]);
    } catch (e) {
      alert("Scoring failed: " + (e.response?.data?.detail || e.message));
    } finally { setScoring(false); }
  };

  const handleSend = async (msg = null) => {
    const message = msg || input.trim();
    if (!message || !selectedResume) return;
    setInput("");

    const userMsg = { role: "user", content: message };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatLoading(true);

    try {
      const { reply } = await resumeChat(
        selectedResume.id,
        message,
        messages.map(m => ({ role: m.role, content: m.content }))
      );
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error getting response. Try again." }]);
    } finally { setChatLoading(false); }
  };

  const handleSelectResume = (resume) => {
    setSelected(resume);
    setScore(null);
    setMessages([]);
    loadCachedScore(resume.id);
  };

  const gradientColor = score
    ? score.total_score >= 75 ? "var(--green)" : score.total_score >= 55 ? "var(--yellow)" : "var(--red)"
    : "var(--t3)";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "700", color: "var(--t1)", letterSpacing: "-0.5px" }}>
          Resume Score <span style={{ color: "var(--blue)" }}>& AI Coach</span>
        </h1>
        <p style={{ color: "var(--t3)", fontSize: "13px", marginTop: "6px" }}>
          Get your resume scored on 8 industry dimensions. Then chat with AI to improve it.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}>

        {/* ── LEFT: Resume selection ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>
            Select Resume
          </div>
          {resumes.length === 0 ? (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--bd)",
              borderRadius: "var(--r4)", padding: "20px", textAlign: "center",
              color: "var(--t3)", fontSize: "13px",
            }}>
              No resumes uploaded yet
            </div>
          ) : (
            resumes.map(r => (
              <div
                key={r.id}
                onClick={() => handleSelectResume(r)}
                style={{
                  background: selectedResume?.id === r.id ? "var(--blue-d)" : "var(--bg-card)",
                  border: `1px solid ${selectedResume?.id === r.id ? "var(--blue)" : "var(--bd)"}`,
                  borderRadius: "var(--r4)", padding: "14px 16px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📄 {r.filename}
                </div>
                {r.parsed_data?.name && (
                  <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>
                    {r.parsed_data.name}
                  </div>
                )}
                {r.score_data?.total_score && (
                  <div style={{
                    marginTop: "8px", display: "inline-flex",
                    background: "var(--bg-el)", border: "1px solid var(--bd)",
                    borderRadius: "20px", padding: "2px 8px",
                    fontSize: "11px", fontWeight: "600", color: "var(--blue)",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {r.score_data.total_score}/100
                  </div>
                )}
              </div>
            ))
          )}

          {/* Score button */}
          {selectedResume && (
            <button
              onClick={handleScore}
              disabled={scoring}
              style={{
                background: scoring ? "var(--bg-el)" : "var(--blue)",
                color: scoring ? "var(--t3)" : "#fff",
                border: "none", borderRadius: "var(--r3)",
                padding: "12px", fontSize: "14px", fontWeight: "700",
                cursor: scoring ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              {scoring ? "Analysing..." : score ? "Re-Score Resume" : "⚡ Score My Resume"}
            </button>
          )}

          {scoring && (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--bd)",
              borderRadius: "var(--r4)", padding: "14px",
              fontSize: "12px", color: "var(--t3)", textAlign: "center",
            }}>
              🧠 Analysing on 8 dimensions...<br />
              <span style={{ fontSize: "11px", marginTop: "4px", display: "block" }}>
                This takes ~10 seconds
              </span>
            </div>
          )}
        </div>

        {/* ── RIGHT: Score + Chat ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--bd)", marginBottom: "20px" }}>
            {[
              { key: "score", label: " Score Report" },
              { key: "chat",  label: " AI Coach Chat" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveSection(key)} style={{
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: `2px solid ${activeSection === key ? "var(--blue)" : "transparent"}`,
                color: activeSection === key ? "var(--blue)" : "var(--t3)",
                fontSize: "13px", fontWeight: activeSection === key ? "600" : "400",
                cursor: "pointer",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── SCORE REPORT ── */}
          {activeSection === "score" && (
            !score ? (
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--bd)",
                borderRadius: "var(--r5)", padding: "60px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                <p style={{ color: "var(--t2)", fontSize: "15px" }}>
                  {selectedResume ? "Click 'Score My Resume' to get your analysis" : "Select a resume to begin"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.3s ease" }}>
                {/* Hero score card */}
                <div style={{
                  background: "var(--bg-card)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r5)", padding: "28px",
                  display: "flex", gap: "28px", alignItems: "center",
                }}>
                  {/* Big score circle */}
                  <div style={{
                    width: "100px", height: "100px", minWidth: "100px",
                    borderRadius: "50%",
                    border: `4px solid ${gradientColor}`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 24px ${gradientColor}22`,
                    background: "var(--bg-el)",
                  }}>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: gradientColor, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                      {score.total_score}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--t3)" }}>/100</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{
                        fontSize: "24px", fontWeight: "800",
                        color: GRADE_COLORS[score.overall_grade] || "var(--t1)",
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {score.overall_grade}
                      </span>
                      {TIER_CONFIG[score.tier] && (
                        <span style={{
                          background: TIER_CONFIG[score.tier].bg,
                          color: TIER_CONFIG[score.tier].color,
                          border: `1px solid ${TIER_CONFIG[score.tier].color}`,
                          borderRadius: "20px", padding: "4px 12px",
                          fontSize: "12px", fontWeight: "700",
                        }}>
                          {TIER_CONFIG[score.tier].icon} {score.tier}
                        </span>
                      )}
                      <span style={{
                        background: score.interview_probability === "High" ? "var(--green-d)" : score.interview_probability === "Medium" ? "var(--yellow-d)" : "var(--red-d)",
                        color: score.interview_probability === "High" ? "var(--green)" : score.interview_probability === "Medium" ? "var(--yellow)" : "var(--red)",
                        border: "1px solid currentColor",
                        borderRadius: "20px", padding: "4px 12px",
                        fontSize: "11px", fontWeight: "600",
                      }}>
                        {score.interview_probability} interview probability
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.6" }}>
                      {score.executive_summary}
                    </p>
                  </div>
                </div>

                {/* Dimension scores */}
                <div style={{
                  background: "var(--bg-card)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r5)", padding: "24px",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--t1)", marginBottom: "18px" }}>
                    Score Breakdown
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {Object.entries(score.dimension_scores || {}).map(([key, dim]) => {
                      const meta = DIM_LABELS[key] || { label: key, icon: "•" };
                      const pct  = (dim.score / dim.max) * 100;
                      const barColor = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--blue)" : pct >= 40 ? "var(--yellow)" : "var(--red)";

                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                            <span style={{ fontSize: "12px", color: "var(--t2)", display: "flex", gap: "6px" }}>
                              <span>{meta.icon}</span> {meta.label}
                            </span>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", color: "var(--t3)" }}>{dim.grade}</span>
                              <span style={{
                                fontSize: "12px", fontWeight: "700", color: barColor,
                                fontFamily: "'DM Mono', monospace", minWidth: "50px", textAlign: "right",
                              }}>
                                {dim.score}/{dim.max}
                              </span>
                            </div>
                          </div>
                          <div style={{ background: "var(--bg-el)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", width: `${pct}%`,
                              background: barColor, borderRadius: "4px",
                              transition: "width 0.8s ease",
                            }} />
                          </div>
                          {dim.top_issue && (
                            <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "3px" }}>
                              ⚠ {dim.top_issue}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strengths + Fixes */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--bd)",
                    borderRadius: "var(--r5)", padding: "20px",
                  }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--green)", marginBottom: "12px" }}>
                      ✅ Top 3 Strengths
                    </h4>
                    {(score.top_3_strengths || []).map((s, i) => (
                      <div key={i} style={{
                        fontSize: "12px", color: "var(--t2)", marginBottom: "8px",
                        paddingLeft: "12px", borderLeft: "2px solid var(--green)",
                        lineHeight: "1.5",
                      }}>
                        {s}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--bd)",
                    borderRadius: "var(--r5)", padding: "20px",
                  }}>
                    <h4 style={{ fontSize: "13px", fontWeight: "700", color: "var(--red)", marginBottom: "12px" }}>
                      🔧 3 Critical Fixes
                    </h4>
                    {(score.top_3_critical_fixes || []).map((f, i) => (
                      <div key={i} style={{
                        fontSize: "12px", color: "var(--t2)", marginBottom: "8px",
                        paddingLeft: "12px", borderLeft: "2px solid var(--red)",
                        lineHeight: "1.5",
                      }}>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target companies */}
                {(score.target_companies?.length > 0 || score.reach_companies?.length > 0) && (
                  <div style={{
                    background: "var(--bg-card)", border: "1px solid var(--bd)",
                    borderRadius: "var(--r5)", padding: "20px",
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px",
                  }}>
                    <div>
                      <h4 style={{ fontSize: "12px", fontWeight: "700", color: "var(--blue)", marginBottom: "10px" }}>
                        🎯 You're Competitive For
                      </h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {(score.target_companies || []).map((c, i) => (
                          <span key={i} style={{
                            background: "var(--blue-d)", color: "var(--blue)",
                            border: "1px solid rgba(59,130,246,0.3)",
                            borderRadius: "20px", padding: "3px 10px", fontSize: "11px",
                          }}>{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: "12px", fontWeight: "700", color: "var(--purple)", marginBottom: "10px" }}>
                        🚀 Reach Companies
                      </h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {(score.reach_companies || []).map((c, i) => (
                          <span key={i} style={{
                            background: "var(--purple-dim)", color: "var(--purple)",
                            border: "1px solid rgba(139,92,246,0.3)",
                            borderRadius: "20px", padding: "3px 10px", fontSize: "11px",
                          }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA to chat */}
                <button onClick={() => setActiveSection("chat")} style={{
                  background: "var(--blue)", color: "#fff", border: "none",
                  borderRadius: "var(--r3)", padding: "14px",
                  fontSize: "14px", fontWeight: "700", cursor: "pointer",
                }}>
                  Chat with AI Coach to Improve Your Resume →
                </button>
              </div>
            )
          )}

          {/* ── CHAT SECTION ── */}
          {activeSection === "chat" && (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--bd)",
              borderRadius: "var(--r5)", overflow: "hidden",
              display: "flex", flexDirection: "column",
              height: "600px",
            }}>
              {/* Chat header */}
              <div style={{
                padding: "16px 20px", borderBottom: "1px solid var(--bd)",
                background: "var(--bg-el)",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--blue), var(--purple))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                }}>🧠</div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--t1)" }}>
                    Resume AI Coach
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--green)" }}>
                    {score ? `Analysed ${selectedResume?.filename}` : "Score your resume first for best results"}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>🧠</div>
                    <p style={{ color: "var(--t2)", fontSize: "13px", marginBottom: "20px" }}>
                      {score
                        ? "Your resume has been scored. Ask me anything about improving it!"
                        : "Ask me anything about your resume or careers in general. Score it first for personalised advice!"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                      {STARTER_QUESTIONS.map((q, i) => (
                        <button key={i} onClick={() => handleSend(q)} style={{
                          background: "var(--bg-el)", border: "1px solid var(--bd)",
                          borderRadius: "20px", padding: "7px 14px",
                          fontSize: "12px", color: "var(--t2)",
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.target.style.borderColor = "var(--blue)"; e.target.style.color = "var(--blue)"; }}
                          onMouseLeave={e => { e.target.style.borderColor = "var(--bd)"; e.target.style.color = "var(--t2)"; }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}>
                    {msg.role === "assistant" && (
                      <div style={{
                        width: "28px", height: "28px", minWidth: "28px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--blue), var(--purple))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", marginTop: "2px",
                      }}>🧠</div>
                    )}
                    <div style={{
                      maxWidth: "75%",
                      background: msg.role === "user" ? "var(--blue)" : "var(--bg-el)",
                      border: `1px solid ${msg.role === "user" ? "var(--blue)" : "var(--bd)"}`,
                      borderRadius: msg.role === "user"
                        ? "var(--r4) var(--r4) 4px var(--r4)"
                        : "var(--r4) var(--r4) var(--r4) 4px",
                      padding: "12px 16px",
                      fontSize: "13px",
                      color: msg.role === "user" ? "#fff" : "var(--t2)",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{
                      width: "28px", height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--blue), var(--purple))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px",
                    }}>🧠</div>
                    <div style={{
                      background: "var(--bg-el)", border: "1px solid var(--bd)",
                      borderRadius: "var(--r4)", padding: "12px 16px",
                      display: "flex", gap: "4px", alignItems: "center",
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: "var(--t3)",
                          animation: `pulse-glow 1s ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: "16px", borderTop: "1px solid var(--bd)",
                background: "var(--bg-el)",
                display: "flex", gap: "10px",
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask about your resume, skills, or career advice..."
                  disabled={chatLoading || !selectedResume}
                  style={{
                    flex: 1, background: "var(--bg-card)",
                    border: "1px solid var(--bd)", borderRadius: "var(--r3)",
                    padding: "10px 14px", fontSize: "13px",
                    color: "var(--t1)", outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--blue)"}
                  onBlur={e => e.target.style.borderColor = "var(--bd)"}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={chatLoading || !input.trim() || !selectedResume}
                  style={{
                    background: chatLoading || !input.trim() ? "var(--bg-card)" : "var(--blue)",
                    color: chatLoading || !input.trim() ? "var(--t3)" : "#fff",
                    border: "none", borderRadius: "var(--r3)",
                    padding: "10px 18px", fontSize: "13px", fontWeight: "600",
                    cursor: chatLoading || !input.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}