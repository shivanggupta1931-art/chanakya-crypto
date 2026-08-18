import { useMemo } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, MarkerType,
  useNodesState, useEdgesState, type Node, type Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import WalletNode from "./WalletNode";
import { api, type Wallet } from "../../lib/api";

const nodeTypes = { wallet: WalletNode };

export default function WalletGraph({ onWalletSelect }: { onWalletSelect: (wallet: Wallet) => void }) {
  const wallets = api.getWallets();
  const transactions = api.getTransactions();

  const initialNodes = useMemo<Node[]>(() => {
    const positions: Record<string, {x:number;y:number}> = {
      W001:{x:40,y:220}, W007:{x:40,y:470}, W008:{x:40,y:720},
      W002:{x:300,y:220}, W003:{x:570,y:220}, W004:{x:830,y:220},
      W006:{x:1080,y:220}, W005:{x:1340,y:220}
    };
    return wallets.map(wallet => ({
      id: wallet.id,
      type: "wallet",
      position: positions[wallet.id] ?? {x:100,y:100},
      data: { label: wallet.label, type: wallet.type, riskScore: wallet.riskScore }
    }));
  }, [wallets]);

  const initialEdges = useMemo<Edge[]>(() => transactions.map(tx => ({
    id: tx.id,
    source: tx.from,
    target: tx.to,
    animated: true,
    label: `${tx.amount}  •  ${new Date(tx.timestamp).toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"})}`,
    style: {
      stroke: tx.risk === "CRITICAL" ? "#ef4444" : tx.risk === "HIGH" ? "#f59e0b" : "#64748b",
      strokeWidth: tx.risk === "CRITICAL" ? 3 : 2
    },
    labelStyle: { fill: "var(--text)", fontWeight: 700, fontSize: 10 },
    labelBgStyle: { fill: "var(--surface)", fillOpacity: 0.9 },
    markerEnd: { type: MarkerType.ArrowClosed, color: tx.risk === "CRITICAL" ? "#ef4444" : tx.risk === "HIGH" ? "#f59e0b" : "#64748b" }
  })), [transactions]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => {
        const wallet = wallets.find(w => w.id === node.id);
        if (wallet) onWalletSelect(wallet);
      }}
      fitView
      minZoom={0.35}
      maxZoom={1.5}
    >
      <Background gap={22} size={1} />
      <Controls />
      <MiniMap nodeColor={(node) => {
        const type = (node.data as any)?.type;
        return type === "SUSPECT" ? "#3b82f6" : type === "MULE" ? "#f59e0b" : type === "MIXER" ? "#ef4444" : "#22c55e";
      }} />
    </ReactFlow>
  );
}