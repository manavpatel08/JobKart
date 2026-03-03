import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP } from "../api/api";
import { saveSession, clearJobData } from "../utils/session";

export default function LoginPage() {
  const [email, setEmail]   = useState("");
  const [otp, setOtp]       = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [step, setStep]     = useState("email");   // "email" | "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      const res = await sendOTP(email);
      if (res?.dev_otp) { setOtp(res.dev_otp); setDevOtp(res.dev_otp); }
      setStep("otp");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to send code. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true); setError("");
    try {
      const { user_id, email: userEmail } = await verifyOTP(email, otp);
      saveSession(user_id, userEmail);
      clearJobData();
      navigate("/resumes");
    } catch (e) {
      setError(e.response?.data?.detail || "Invalid code. Please try again.");
    } finally { setLoading(false); }
  };

  /* ── Spinner ─────────────────────────── */
  const Spinner = () => (
    <span style={{
      width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff", borderRadius: "50%",
      display: "inline-block",
      animation: "spin 0.65s linear infinite",
    }} />
  );

  /* ── Shared input style ───────────────── */
  const inputSx = {
    width: "100%", padding: "11px 14px",
    background: "var(--bg-el)",
    border: "1px solid var(--bd)",
    borderRadius: "var(--r3)",
    fontSize: "14px", color: "var(--t1)",
    outline: "none", transition: "var(--ease)",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", position: "relative", overflow: "hidden",
    }}>
      {/* Background gradient blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        }} />
        <div style={{
          position: "absolute", width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)",
          top: "10%", right: "10%",
        }} />
      </div>

      <div className="scale-in" style={{ width: "100%", maxWidth: "400px", position: "relative" }}>

        {/* Logo block */}
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg,var(--blue),#ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 0 32px rgba(249,115,22,0.35)",
            animation: "floatY 4s ease-in-out infinite",
          }}>
            <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.4" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--t1)", letterSpacing: "-0.6px" }}>
            JobKart<span style={{ color: "var(--blue)" }}>.ai</span>
          </h1>
          <p style={{ color: "var(--t3)", fontSize: "13px", marginTop: "6px" }}>
            Smart job matching · Zero effort
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--bd)",
          borderRadius: "var(--r5)",
          padding: "36px",
          boxShadow: "0 0 60px rgba(59,130,246,0.05), 0 4px 24px rgba(0,0,0,0.2)",
          animation: "borderGlow 4s ease infinite",
        }}>

          {step === "email" ? (
            <>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", marginBottom: "6px", letterSpacing: "-0.3px" }}>
                Sign in
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "28px", lineHeight: "1.6" }}>
                Enter your email — we'll send a one-time code. No password needed.
              </p>

              <label style={{ fontSize: "11px", color: "var(--t2)", fontWeight: "600", display: "block", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                style={inputSx}
                onFocus={e => e.target.style.borderColor = "var(--blue)"}
                onBlur={e  => e.target.style.borderColor = "var(--bd)"}
              />

              {error && <ErrorMsg msg={error} />}

              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  width: "100%", marginTop: "14px",
                  background: loading ? "var(--bg-el)" : "var(--blue)",
                  color: loading ? "var(--t3)" : "#fff",
                  border: "none", borderRadius: "var(--r3)",
                  padding: "13px", fontSize: "14px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "var(--ease)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "none")}
              >
                {loading ? <><Spinner /> Sending code…</> : "Send Login Code"}
              </button>

              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "var(--t3)" }}>
                Session expires when you close the browser
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "18px", fontWeight: "700", color: "var(--t1)", marginBottom: "6px", letterSpacing: "-0.3px" }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "24px", lineHeight: "1.6" }}>
                Code sent to <span style={{ color: "var(--blue)", fontWeight: "600" }}>{email}</span>.{" "}
                <span onClick={() => { setStep("email"); setError(""); }}
                  style={{ color: "var(--t2)", cursor: "pointer", textDecoration: "underline" }}>
                  Change
                </span>
              </p>

              {/* Dev mode banner */}
              {devOtp && (
                <div style={{
                  padding: "12px 16px", marginBottom: "18px",
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "var(--r3)",
                }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--yellow)", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    DEV MODE — EMAIL NOT CONFIGURED
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "8px", color: "var(--yellow)", fontFamily: "'JetBrains Mono',monospace" }}>
                    {devOtp}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "6px" }}>
                    Set GMAIL_USER + GMAIL_APP_PASSWORD in .env for real emails
                  </div>
                </div>
              )}

              {/* OTP input */}
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                style={{
                  ...inputSx,
                  fontSize: "36px", fontWeight: "700",
                  letterSpacing: "16px", textAlign: "center",
                  fontFamily: "'JetBrains Mono',monospace",
                  padding: "18px 14px",
                }}
                onFocus={e => e.target.style.borderColor = "var(--blue)"}
                onBlur={e  => e.target.style.borderColor = "var(--bd)"}
                autoFocus
              />

              {error && <ErrorMsg msg={error} />}

              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  width: "100%", marginTop: "14px",
                  background: loading ? "var(--bg-el)" : "var(--blue)",
                  color: loading ? "var(--t3)" : "#fff",
                  border: "none", borderRadius: "var(--r3)",
                  padding: "13px", fontSize: "14px", fontWeight: "700",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "var(--ease)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
                }}
                onMouseEnter={e => !loading && (e.currentTarget.style.filter = "brightness(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.filter = "none")}
              >
                {loading ? <><Spinner /> Verifying…</> : "Verify & Sign In"}
              </button>

              <p style={{ textAlign: "center", marginTop: "18px", fontSize: "12px", color: "var(--t3)" }}>
                Didn't receive it?{" "}
                <span onClick={handleSend} style={{ color: "var(--blue)", cursor: "pointer", fontWeight: "600" }}>
                  Resend code
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{
      marginTop: "12px", padding: "10px 14px",
      background: "var(--red-d)", border: "1px solid rgba(239,68,68,.28)",
      borderRadius: "var(--r2)", fontSize: "13px", color: "var(--red)",
      display: "flex", alignItems: "center", gap: "7px",
    }}>
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      {msg}
    </div>
  );
}