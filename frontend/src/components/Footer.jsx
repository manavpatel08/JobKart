import { useNavigate } from "react-router-dom";

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{
      width: "22px", height: "22px", borderRadius: "6px",
      background: "linear-gradient(135deg,var(--blue),var(--purple))",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
    <span style={{ fontWeight: "800", fontSize: "13px", color: "var(--t1)", letterSpacing: "-0.3px" }}>
      JobKart<span style={{ color: "var(--blue)" }}>.ai</span>
    </span>
  </div>
);

const SvgX = () => (
  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SvgGithub = () => (
  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function Footer() {
  const year = new Date().getFullYear();
  const linkSx = {
    display: "block", fontSize: "12px", color: "var(--t3)",
    textDecoration: "none", marginBottom: "8px", transition: "var(--ease)",
  };

  return (
    <footer style={{
      background: "var(--bg-card)", borderTop: "1px solid var(--bd)",
      padding: "48px 48px 28px",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "40px", marginBottom: "40px",
        }}>
          {/* Brand */}
          <div>
            <div style={{ marginBottom: "14px" }}><Logo /></div>
            <p style={{ fontSize: "12px", color: "var(--t3)", lineHeight: "1.75", maxWidth: "240px" }}>
              AI-powered job matching that actually understands your resume.
              Built for Indian job seekers targeting top companies.
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              {[
                { href: "",      ico: <SvgX /> },
                { href: "", ico: <SvgGithub /> },
              ].map(({ href, ico }) => (
                <a key={href} href={href} target="_blank" rel="noreferrer" style={{
                  width: "30px", height: "30px",
                  background: "var(--bg-el)", border: "1px solid var(--bd)",
                  borderRadius: "var(--r2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--t3)", textDecoration: "none", transition: "var(--ease)",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--bd-h)"; e.currentTarget.style.color = "var(--t1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)";   e.currentTarget.style.color = "var(--t3)"; }}
                >{ico}</a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
              Product
            </h4>
            {["Features", "How it works", "Roadmap", "Changelog"].map(l => (
              <a key={l} href="#" style={linkSx}
                onMouseEnter={e => e.target.style.color = "var(--t2)"}
                onMouseLeave={e => e.target.style.color = "var(--t3)"}
              >{l}</a>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
              Company
            </h4>
            {[["About", "#about"], ["Contact", "#contact"], ["Privacy Policy", "#"], ["Terms of Use", "#"]].map(([l, h]) => (
              <a key={l} href={h} style={linkSx}
                onMouseEnter={e => e.target.style.color = "var(--t2)"}
                onMouseLeave={e => e.target.style.color = "var(--t3)"}
              >{l}</a>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: "10px", fontWeight: "700", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
              Contact
            </h4>
            
            <div style={{ fontSize: "12px", color: "var(--t3)", lineHeight: "1.7", marginBottom: "14px" }}>
              Ahmedabad, Gujarat<br />India
            </div>
            {[
              { name: "Manav Patel", li: "https://linkedin.com/in/manavpatel", gh: "https://github.com/manavpatel" },
              { name: "Aditya Thakkar",  li: "https://linkedin.com/in/arjunshah",  gh: "https://github.com/arjunshah"  },
            ].map(p => (
              <div key={p.name} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--t3)", marginBottom: "3px" }}>{p.name}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <a href={p.li} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--blue)", textDecoration: "none" }}>LinkedIn</a>
                  <span style={{ color: "var(--t3)", fontSize: "11px" }}>·</span>
                  <a href={p.gh} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--t2)", textDecoration: "none" }}>GitHub</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid var(--bd)", paddingTop: "18px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "10px",
        }}>
          <p style={{ fontSize: "11px", color: "var(--t3)" }}>
            © {year} JobKart.ai · Built in India
          </p>
          <p style={{ fontSize: "11px", color: "var(--t3)" }}>
          </p>
        </div>
      </div>
    </footer>
  );
}