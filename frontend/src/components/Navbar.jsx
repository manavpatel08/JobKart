import { NavLink, useNavigate } from "react-router-dom";
import { clearSession } from "../utils/session";

export default function Navbar({ cartCount = 0 }) {
  const navigate   = useNavigate();
  const userEmail  = sessionStorage.getItem("user_email");

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const links = [
    { to: "/resumes",   label: "Resumes"   },
    { to: "/jobs",      label: "Jobs"       },
    { to: "/dashboard", label: "Dashboard"  },
  ];

  return (
    <nav style={{
      background: "rgba(10,15,26,0.96)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 32px",
      height: "58px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "28px", height: "28px",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px",
        }}>⚡</div>
        <span style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
          AutoApply <span style={{ color: "var(--blue)" }}>AI</span>
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            padding: "6px 14px", borderRadius: "var(--radius-sm)",
            fontSize: "13px", fontWeight: isActive ? "600" : "400",
            color: isActive ? "var(--blue)" : "var(--text-secondary)",
            background: isActive ? "var(--blue-glow)" : "none",
            border: isActive ? "1px solid var(--blue-dim)" : "1px solid transparent",
            textDecoration: "none", transition: "var(--transition)",
          })}>
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {cartCount > 0 && (
          <div
            onClick={() => navigate("/dashboard")}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "var(--orange-dim)", border: "1px solid var(--orange)",
              borderRadius: "20px", padding: "4px 12px",
              cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "var(--orange)",
            }}
          >
            🛒 {cartCount} in cart
          </div>
        )}

        {userEmail && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
            {userEmail}
          </span>
        )}

        <button onClick={handleLogout} style={{
          padding: "5px 14px", borderRadius: "var(--radius-sm)",
          fontSize: "12px", fontWeight: "500",
          color: "var(--red)", background: "none",
          border: "1px solid var(--red-dim)", cursor: "pointer",
        }}
          onMouseEnter={e => e.target.style.background = "var(--red-dim)"}
          onMouseLeave={e => e.target.style.background = "none"}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}