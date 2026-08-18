import type { ReactNode } from "react";

export default function MetricCard({ label, value, meta, icon, tone = "" }: {
  label: string; value: string; meta?: string; icon: ReactNode; tone?: string;
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {meta && <small>{meta}</small>}
      </div>
    </div>
  );
}