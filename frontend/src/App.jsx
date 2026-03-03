import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import LandingPage     from "./pages/LandingPage";
import LoginPage       from "./pages/LoginPage";
import ResumesPage     from "./pages/ResumesPage";
import JobResultsPage  from "./pages/JobResultsPage";
import DashboardPage   from "./pages/DashboardPage";
import ResumeScorePage from "./pages/ResumeScorePage";
import Footer          from "./components/Footer";
import { isLoggedIn, clearSession } from "./utils/session";

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

/* ── Account dropdown ─────────────────────────────────────── */
function AccountMenu({ email, theme, onToggleTheme, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const initial = email ? email[0].toUpperCase() : "?";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: "linear-gradient(135deg,var(--blue),var(--purple))",
          border: open ? "2px solid var(--blue-b)" : "2px solid transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: "700", color: "#fff",
          transition: "var(--ease)",
        }}
      >
        {initial}
      </button>

      {open && (
        <div className="acct-menu">
          {/* Identity */}
          <div style={{ padding: "10px 12px 8px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--t1)", marginBottom: "2px" }}>
              {email?.split("@")[0]}
            </div>
            <div style={{ fontSize: "11px", color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </div>
          </div>
          <div className="acct-sep" />

          {/* Theme toggle */}
          <button className="acct-item" onClick={() => { onToggleTheme(); setOpen(false); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              {theme === "dark"
                ? <circle cx="12" cy="12" r="5"><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></circle>
                : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
            </svg>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="acct-sep" />

          {/* Sign out */}
          <button className="acct-item red" onClick={() => { setOpen(false); onLogout(); }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Icon components (SVG only, no emoji) ─────────────────── */
const IconResume = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconJobs = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconDashboard = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconCoach = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Navbar ─────────────────────────────────────────────────── */
function Navbar({ cartCount, theme, onToggleTheme }) {
  const navigate  = useNavigate();
  const userEmail = sessionStorage.getItem("user_email") || "";

  const handleLogout = () => { clearSession(); navigate("/login"); };

  const links = [
    { to: "/resumes",      label: "Resumes",   Icon: IconResume    },
    { to: "/jobs",         label: "Jobs",       Icon: IconJobs      },
    { to: "/dashboard",    label: "Dashboard",  Icon: IconDashboard },
    { to: "/resume-score", label: "AI Coach",   Icon: IconCoach     },
  ];

  return (
    <nav style={{
      background: "var(--bg-card)", borderBottom: "1px solid var(--bd)",
      padding: "0 28px", height: "52px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 300, transition: "background .2s",
    }}>
      {/* Logo */}
      <div onClick={() => navigate("/resumes")} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0 }}>
        <div style={{
          width: "26px", height: "26px", borderRadius: "7px",
          background: "linear-gradient(135deg,var(--blue),var(--purple))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(59,130,246,0.35)",
        }}>
          <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <span style={{ fontWeight: "800", fontSize: "14px", color: "var(--t1)", letterSpacing: "-0.3px" }}>
          JobKart<span style={{ color: "var(--blue)" }}>.ai</span>
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: "flex", gap: "2px" }}>
        {links.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            padding: "5px 11px", borderRadius: "var(--r2)", fontSize: "12px",
            fontWeight: isActive ? "600" : "400",
            color: isActive ? "var(--t1)" : "var(--t2)",
            background: isActive ? "var(--bg-el)" : "none",
            border: isActive ? "1px solid var(--bd)" : "1px solid transparent",
            textDecoration: "none", transition: "var(--ease)",
            display: "flex", alignItems: "center", gap: "5px",
          })}>
            <Icon />{label}
          </NavLink>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {cartCount > 0 && (
          <button onClick={() => navigate("/dashboard")} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--blue-d)", border: "1px solid var(--blue-b)",
            borderRadius: "var(--r2)", padding: "4px 10px",
            cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "var(--blue)",
            transition: "var(--ease)",
          }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        )}

        {userEmail && (
          <AccountMenu
            email={userEmail}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={handleLogout}
          />
        )}
      </div>
    </nav>
  );
}

function AppLayout({ children, cartCount, theme, onToggleTheme }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar cartCount={cartCount} theme={theme} onToggleTheme={onToggleTheme} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export default function App() {
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const s = localStorage.getItem("cart");
    if (s) setCartCount(Object.keys(JSON.parse(s)).length);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<><LandingPage /><Footer /></>} />
        <Route path="/login" element={isLoggedIn() ? <Navigate to="/resumes" /> : <><LoginPage /><Footer /></>} />
        {[
          { path: "/resumes",      El: ResumesPage,     extra: {} },
          { path: "/jobs",         El: JobResultsPage,  extra: { onCartChange: setCartCount } },
          { path: "/dashboard",    El: DashboardPage,   extra: {} },
          { path: "/resume-score", El: ResumeScorePage, extra: {} },
        ].map(({ path, El, extra }) => (
          <Route key={path} path={path} element={
            <PrivateRoute>
              <AppLayout cartCount={cartCount} theme={theme} onToggleTheme={toggle}>
                <El {...extra} />
              </AppLayout>
            </PrivateRoute>
          } />
        ))}
        <Route path="*" element={<Navigate to={isLoggedIn() ? "/resumes" : "/"} />} />
      </Routes>
    </BrowserRouter>
  );
}