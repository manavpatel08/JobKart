import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn } from "../utils/session";

/* ── Animated counter ───────────────────────────────────────── */
function Counter({ target, suffix = "", duration = 1200 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const isFloat = String(target).includes(".");
        const num = parseFloat(target);
        const step = num / (duration / 16);
        let cur = 0;
        const t = setInterval(() => {
          cur = Math.min(cur + step, num);
          setCount(isFloat ? cur.toFixed(1) : Math.floor(cur));
          if (cur >= num) clearInterval(t);
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Twinkling dot ──────────────────────────────────────────── */
function Dot({ top, left, delay, size = 2 }) {
  return (
    <div style={{
      position: "absolute", top, left,
      width: size, height: size,
      borderRadius: "50%",
      background: "rgba(59,130,246,0.5)",
      animation: `pulse ${2 + delay}s ${delay}s ease-in-out infinite`,
      pointerEvents: "none",
    }} />
  );
}

export default function LandingPage() {
  const navigate   = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = () => navigate(isLoggedIn() ? "/resumes" : "/login");

  const features = [
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "AI Resume Parsing",
      desc: "Upload your PDF and our AI extracts skills, experience, and education with surgical precision using Groq's LLaMA model.",
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
        </svg>
      ),
      title: "Semantic Job Matching",
      desc: "Sentence Transformers map your resume against live job listings, giving you a real match score — not keyword spam.",
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Skill Gap Analysis",
      desc: "Know exactly what's missing and why. Critical vs important vs minor — with a step-by-step roadmap to close each gap.",
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Application Tracker",
      desc: "Interested, Shortlisted, Applied, Rejected — manage every application in one place. Your job hunt, organised.",
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      title: "Aspirational Opportunities",
      desc: "FAANG, ISRO, IIT research, McKinsey — we surface high-impact roles even if you're not there yet. Aim higher.",
    },
    {
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Learning Roadmaps",
      desc: "For every skill gap, get a prioritised roadmap with realistic timelines, resources, and projected score improvements.",
    },
  ];

  const stats = [
    { value: 50, suffix: "+", label: "Searches per scan" },
    { value: 95, suffix: "%", label: "Parse accuracy" },
    { value: 0, suffix: "₹", label: "Cost forever", prefix: true },
    { value: 30, suffix: "s", label: "To match jobs", prefix: "<" },
  ];

  const steps = [
    {
      n: "01",
      title: "Upload Resume",
      desc: "Drop your PDF — AI parses name, skills, experience, education in seconds.",
      accent: "#3b82f6",
    },
    {
      n: "02",
      title: "Get Matched",
      desc: "We fire 50+ targeted searches and rank every result by semantic match score.",
      accent: "#6366f1",
    },
    {
      n: "03",
      title: "Apply Smart",
      desc: "See skill gaps, follow roadmaps, queue jobs, and apply with total confidence.",
      accent: "#8b5cf6",
    },
  ];

  const navLinks = ["Features", "How it works", "About"];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: scrolled ? "rgba(8,12,20,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--bd)" : "1px solid transparent",
        padding: "0 48px", height: "62px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "linear-gradient(135deg,var(--blue),#ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(249,115,22,0.4)",
          }}>
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: "700", fontSize: "15px", color: "var(--t1)", letterSpacing: "-0.3px" }}>
            JobKart<span style={{ color: "var(--blue)" }}>.ai</span>
          </span>
        </div>

        {/* Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {navLinks.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} style={{
              padding: "5px 13px", borderRadius: "var(--r2)",
              fontSize: "13px", fontWeight: "500",
              color: "var(--t2)", textDecoration: "none",
              transition: "var(--ease)",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--t1)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--t2)"}
            >{l}</a>
          ))}
          <button onClick={go} style={{
            marginLeft: "8px",
            background: "var(--blue)", color: "#fff",
            border: "none", borderRadius: "var(--r2)",
            padding: "7px 18px", fontSize: "13px", fontWeight: "600",
            cursor: "pointer", transition: "var(--ease)",
          }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.12)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
          >
            {isLoggedIn() ? "Dashboard" : "Sign in"}
          </button>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="home" style={{
        minHeight: "80vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "60px 24px 40px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle background glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", width: "600px", height: "600px",
            background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          }} />
        </div>

        {/* Headline — compact, refined */}
        <h1 className="fade-up" style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          fontWeight: "700",
          color: "var(--t1)",
          lineHeight: "1.18",
          letterSpacing: "-1.2px",
          maxWidth: "640px",
          marginBottom: "18px",
        }}>
          Find jobs that actually{" "}
          <span style={{
            background: "linear-gradient(135deg,var(--blue),var(--purple))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>match your resume</span>
        </h1>

        {/* Sub — single line, light */}
        <p className="fade-up" style={{
          animationDelay: "0.1s",
          fontSize: "15px", color: "var(--t3)",
          maxWidth: "400px", lineHeight: "1.65",
          marginBottom: "36px", fontWeight: "400",
        }}>
          Upload your resume. Get matched to 50+ live jobs in under a minute.
          See skill gaps and a roadmap to close them.
        </p>

        {/* CTAs — smaller, cleaner */}
        <div className="fade-up" style={{
          animationDelay: "0.18s",
          display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center",
        }}>
          <button onClick={go} style={{
            background: "var(--blue)", color: "#fff",
            border: "none", borderRadius: "var(--r2)",
            padding: "10px 24px", fontSize: "13px", fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 20px rgba(59,130,246,0.22)",
            transition: "var(--ease)",
            letterSpacing: "0.1px",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(59,130,246,0.38)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 20px rgba(59,130,246,0.22)"; }}
          >
            {isLoggedIn() ? "Go to Dashboard" : "Get started free"}
          </button>
          <a href="#features" style={{
            background: "transparent", color: "var(--t2)",
            border: "1px solid var(--bd)",
            borderRadius: "var(--r2)",
            padding: "10px 20px", fontSize: "13px", fontWeight: "500",
            cursor: "pointer", textDecoration: "none",
            transition: "var(--ease)",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--t1)"; e.currentTarget.style.borderColor = "var(--bd-h)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--t2)"; e.currentTarget.style.borderColor = "var(--bd)"; }}
          >
            See how it works
          </a>
        </div>

        {/* Stats — compact inline pill */}
        <div className="fade-up" style={{
          animationDelay: "0.26s",
          display: "flex", marginTop: "48px",
          background: "var(--bg-card)", border: "1px solid var(--bd)",
          borderRadius: "var(--r3)", overflow: "hidden",
        }}>
          {stats.map(({ value, suffix, label, prefix }, i) => (
            <div key={label} style={{
              padding: "12px 24px", textAlign: "center",
              borderRight: i < stats.length - 1 ? "1px solid var(--bd)" : "none",
            }}>
              <div style={{ fontSize: "17px", fontWeight: "700", color: "var(--t1)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-0.5px" }}>
                {prefix && <span style={{ fontSize: "12px", color: "var(--t3)" }}>{prefix}</span>}
                <Counter target={value} suffix={suffix} />
              </div>
              <div style={{ fontSize: "10px", color: "var(--t3)", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" style={{ padding: "72px 48px", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <h2 style={{
            fontSize: "clamp(20px,2.8vw,30px)", fontWeight: "700",
            color: "var(--t1)", letterSpacing: "-0.6px", lineHeight: "1.2",
            marginBottom: "8px",
          }}>
            Everything you need to land your next role
          </h2>
          <p style={{ fontSize: "13px", color: "var(--t3)" }}>
            Built specifically for Indian job seekers targeting top companies.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
          gap: "18px",
        }}>
          {features.map((f, i) => (
            <div key={i} className="card-hover" style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bd)",
              borderRadius: "var(--r4)",
              padding: "30px",
              animation: `fadeUp 0.4s ${i * 0.06}s ease both`,
              position: "relative", overflow: "hidden",
            }}>
              {/* Top accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                background: `linear-gradient(90deg, var(--blue), transparent)`,
                opacity: 0.4,
              }} />

              <div style={{
                width: "40px", height: "40px", borderRadius: "var(--r3)",
                background: "var(--blue-d)", border: "1px solid var(--blue-b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--blue)", marginBottom: "18px",
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--t1)", marginBottom: "10px", letterSpacing: "-0.2px" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.75" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how-it-works" style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--bd)", borderBottom: "1px solid var(--bd)",
        padding: "90px 48px",
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "2.5px", color: "var(--blue)", textTransform: "uppercase", marginBottom: "14px" }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: "800", color: "var(--t1)", letterSpacing: "-1.5px" }}>
              From resume to shortlist in 3 steps
            </h2>
          </div>

          <div style={{ display: "flex", gap: "0", position: "relative" }}>
            {/* connector line */}
            <div style={{
              position: "absolute", top: "28px", left: "calc(16.5% + 16px)", right: "calc(16.5% + 16px)",
              height: "1px",
              background: "linear-gradient(90deg, var(--blue), var(--purple))",
              opacity: 0.3,
            }} />

            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 24px" }}>
                <div style={{
                  width: "56px", height: "56px",
                  background: `${s.accent}18`,
                  border: `1px solid ${s.accent}44`,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 22px",
                  fontSize: "15px", fontWeight: "700", color: s.accent,
                  fontFamily: "'JetBrains Mono',monospace",
                  position: "relative", zIndex: 1,
                  animation: `floatY ${3.5 + i * 0.7}s ${i * 0.5}s ease-in-out infinite`,
                }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", marginBottom: "10px", letterSpacing: "-0.3px" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.75", maxWidth: "220px", margin: "0 auto" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      <section id="about" style={{ padding: "100px 48px", maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "2.5px", color: "var(--blue)", textTransform: "uppercase", marginBottom: "14px" }}>
            ABOUT
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: "800", color: "var(--t1)", letterSpacing: "-1.5px", lineHeight: "1.15", marginBottom: "18px" }}>
            Built by engineers,<br />for job seekers
          </h2>
          <p style={{ fontSize: "14px", color: "var(--t2)", maxWidth: "500px", margin: "0 auto", lineHeight: "1.85" }}>
            JobKart.ai was built out of frustration with the job search process.
            We wanted a tool that truly understands resumes — not just keyword-matches.
            So we built one. With real AI. For free.
          </p>
        </div>

        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            {
              name: "Manav Patel",
              role: "Co-Founder · Backend Engineer",
              bio: "Full-stack developer obsessed with AI and developer tools. Building JobKart.ai to solve the job hunt problem he faced firsthand.",
              initials: "MP",
              color: "#3b82f6",
              linkedin: "https://linkedin.com/in/manavpatel",
              github: "https://github.com/manavpatel",
            },
            {
              name: "Aditya Thakkar",
              role: "Co-Founder · ML Engineer",
              bio: "Machine learning engineer with a focus on NLP and semantic search. Architected the matching engine and skill gap analysis system.",
              initials: "AT",
              color: "#6366f1",
              linkedin: "https://linkedin.com/in/arjunshah",
              github: "https://github.com/arjunshah",
            },
          ].map((p, i) => (
            <div key={i} className="card-hover" style={{
              background: "var(--bg-card)", border: "1px solid var(--bd)",
              borderRadius: "var(--r5)", padding: "36px 30px",
              flex: "1", minWidth: "280px", maxWidth: "380px", textAlign: "center",
            }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: `${p.color}18`, border: `2px solid ${p.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
                fontSize: "18px", fontWeight: "800", color: p.color,
                fontFamily: "'JetBrains Mono',monospace",
              }}>
                {p.initials}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--t1)", letterSpacing: "-0.3px" }}>
                {p.name}
              </h3>
              <p style={{ fontSize: "11px", color: p.color, fontWeight: "600", marginTop: "4px", marginBottom: "14px", letterSpacing: "0.2px" }}>
                {p.role}
              </p>
              <p style={{ fontSize: "13px", color: "var(--t2)", lineHeight: "1.8", marginBottom: "22px" }}>
                {p.bio}
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <a href={p.linkedin} target="_blank" rel="noreferrer" style={{
                  padding: "7px 16px", borderRadius: "var(--r2)",
                  background: "var(--blue-d)", border: "1px solid var(--blue-b)",
                  color: "var(--blue)", fontSize: "12px", fontWeight: "600",
                  textDecoration: "none", transition: "var(--ease)",
                }}
                  onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.2)"}
                  onMouseLeave={e => e.currentTarget.style.filter = "none"}
                >LinkedIn</a>
                <a href={p.github} target="_blank" rel="noreferrer" style={{
                  padding: "7px 16px", borderRadius: "var(--r2)",
                  background: "var(--bg-el)", border: "1px solid var(--bd)",
                  color: "var(--t2)", fontSize: "12px", fontWeight: "600",
                  textDecoration: "none", transition: "var(--ease)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--t1)"; e.currentTarget.style.borderColor = "var(--bd-h)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--t2)"; e.currentTarget.style.borderColor = "var(--bd)"; }}
                >GitHub</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section style={{
        padding: "80px 48px",
        background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.06))",
        borderTop: "1px solid var(--bd)",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: "800", color: "var(--t1)", letterSpacing: "-1px", marginBottom: "16px" }}>
            Ready to find your next role?
          </h2>
          <p style={{ fontSize: "14px", color: "var(--t2)", lineHeight: "1.8", marginBottom: "36px" }}>
            Upload your resume and get personalised job matches in under a minute. No account setup headaches.
          </p>
          <button onClick={go} style={{
            background: "var(--blue)", color: "#fff",
            border: "none", borderRadius: "var(--r3)",
            padding: "15px 44px", fontSize: "16px", fontWeight: "700",
            cursor: "pointer", transition: "var(--ease)",
            boxShadow: "0 0 40px rgba(59,130,246,0.25)",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(59,130,246,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 40px rgba(59,130,246,0.25)"; }}
          >
            {isLoggedIn() ? "Go to Dashboard" : "Start for Free"}
          </button>
        </div>
      </section>
    </div>
  );
}