export default function StatCard({ label, value, color = "#2563eb" }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "24px",
      minWidth: "140px",
      flex: 1,
    }}>
      <div style={{
        fontSize: "32px",
        fontWeight: "700",
        color,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: "13px",
        color: "#64748b",
        marginTop: "4px",
        fontWeight: "500",
      }}>
        {label}
      </div>
    </div>
  );
}