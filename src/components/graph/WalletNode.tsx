import { Handle, Position } from "@xyflow/react";

const colors: Record<string, string> = {
  SUSPECT: "#3b82f6",
  MULE: "#f59e0b",
  MIXER: "#ef4444",
  EXCHANGE: "#22c55e"
};

export default function WalletNode({ data }: { data: { label: string; type: string; riskScore: number; selected?: boolean } }) {
  const color = colors[data.type] ?? "#64748b";
  return (
    <div className="wallet-node" style={{ borderColor: color, boxShadow: `0 0 26px ${color}22` }}>
      <Handle type="target" position={Position.Left} />
      <div className="node-top">
        <span className="node-dot" style={{ background: color }}/>
        <strong>{data.label}</strong>
      </div>
      <span className="node-type">{data.type}</span>
      <div className="node-risk">
        <span>Risk</span>
        <b style={{ color }}>{data.riskScore}/100</b>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}