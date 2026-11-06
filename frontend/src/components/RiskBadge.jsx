const CONFIG = {
  low: { icon: "✓", label: "Low risk", className: "badge-low" },
  medium: { icon: "!", label: "Medium risk", className: "badge-medium" },
  high: { icon: "✕", label: "High risk", className: "badge-high" },
};

export default function RiskBadge({ level }) {
  const c = CONFIG[level] ?? CONFIG.low;
  return (
    <span className={`badge ${c.className}`}>
      <span aria-hidden="true">{c.icon}</span>
      {c.label}
    </span>
  );
}
