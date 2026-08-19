import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import WalletNode from "./WalletNode";
import { api } from "../../lib/api";

const nodeTypes = {
  wallet: WalletNode,
};

type RealTransaction = {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  blockNum: string;
  blockTimestamp: string | null;
};

type Props = {
  onWalletSelect: (wallet: any) => void;
  walletAddress?: string;
};

function shortAddress(address: string) {
  if (!address) return "Unknown";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRiskType(tx: RealTransaction) {
  const category = (tx.category || "").toLowerCase();

  if (
    category.includes("token") ||
    category.includes("mixer")
  ) {
    return "MIXER";
  }

  if (
    category.includes("internal") ||
    category.includes("receive")
  ) {
    return "MULE";
  }

  return "WALLET";
}

function formatAmount(tx: RealTransaction) {
  if (tx.value === null || tx.value === undefined) {
    return "";
  }

  const value = Number(tx.value);

  if (!Number.isFinite(value)) {
    return "";
  }

  return `${value.toFixed(4)} ${tx.asset || "ETH"}`;
}

function formatTime(timestamp: string | null) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WalletGraph({
  onWalletSelect,
  walletAddress,
}: Props) {
  const [transactions, setTransactions] = useState<
    RealTransaction[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /*
   * Fetch REAL transactions whenever the searched wallet changes.
   */
  useEffect(() => {
    if (!walletAddress) {
      setTransactions([]);
      return;
    }

    let cancelled = false;

    async function loadGraph() {
      try {
        setLoading(true);
        setError("");

        const result =
          await api.getRealWalletGraph(walletAddress!);

        if (cancelled) return;

        setTransactions(
          Array.isArray(result?.transactions)
            ? result.transactions
            : []
        );
      } catch (err) {
        console.error(
          "Real wallet graph error:",
          err
        );

        if (!cancelled) {
          setTransactions([]);
          setError(
            "Unable to load wallet graph."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  /*
   * Build the investigation-style graph.
   *
   * IMPORTANT:
   * The backend currently gives us transactions
   * belonging to the searched wallet. Therefore we
   * only create relationships that are actually
   * present in the returned blockchain data.
   *
   * The layout is intentionally arranged as:
   *
   *       4 columns
   *       4 columns
   *       4 columns
   *       4 columns
   *       ...
   *
   * instead of putting everything in one horizontal line.
   */
  const { graphNodes, graphEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!walletAddress) {
      return {
        graphNodes: nodes,
        graphEdges: edges,
      };
    }

    const rootAddress = walletAddress.toLowerCase();

    /*
     * Root / investigated wallet.
     */
    nodes.push({
      id: "root-wallet",
      type: "wallet",
      position: {
        x: 520,
        y: 40,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        label: "Investigated Wallet",
        type: "SUSPECT",
        riskScore: 94,
      },
    });

    /*
     * Keep one representative transaction per
     * counterparty so the graph remains readable.
     */
    const counterparties = new Map<
      string,
      RealTransaction
    >();

    for (const tx of transactions) {
      const from = tx.from?.toLowerCase();
      const to = tx.to?.toLowerCase();

      if (!from || !to) continue;

      let counterparty = "";

      if (from === rootAddress) {
        counterparty = to;
      } else if (to === rootAddress) {
        counterparty = from;
      } else {
        continue;
      }

      if (counterparty === rootAddress) continue;

      /*
       * Keep the first transaction for each counterparty.
       */
      if (!counterparties.has(counterparty)) {
        counterparties.set(counterparty, tx);
      }
    }

    const uniqueCounterparties = Array.from(
      counterparties.entries()
    );

    /*
     * Four-column layout.
     *
     * This is the important part that recreates
     * the structure from your screenshot.
     */
    const columns = 4;

    const columnX = [
      70,
      370,
      670,
      970,
    ];

    const rowHeight = 150;

    uniqueCounterparties.forEach(
      ([address, tx], index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;

        const nodeId = `wallet-${address}`;

        const riskType = getRiskType(tx);

        nodes.push({
          id: nodeId,
          type: "wallet",
          position: {
            x: columnX[column],
            y: 190 + row * rowHeight,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          data: {
            label: shortAddress(address),
            type: riskType,
            riskScore:
              riskType === "MIXER"
                ? 99
                : riskType === "MULE"
                ? 78
                : 45,
          },
        });

        /*
         * Determine actual direction.
         */
        const from =
          tx.from?.toLowerCase();

        const isOutgoing =
          from === rootAddress;

        const edgeId = isOutgoing
          ? `root-${address}`
          : `${address}-root`;

        edges.push({
          id: edgeId,
          source: isOutgoing
            ? "root-wallet"
            : nodeId,
          target: isOutgoing
            ? nodeId
            : "root-wallet",

          type: "smoothstep",

          animated: true,

          label: [
            formatAmount(tx),
            formatTime(tx.blockTimestamp),
          ]
            .filter(Boolean)
            .join(" • "),

          labelStyle: {
            fill: "var(--text)",
            fontWeight: 700,
            fontSize: 10,
          },

          labelBgStyle: {
            fill: "var(--surface)",
            fillOpacity: 0.95,
          },

          style: {
            stroke:
              riskType === "MIXER"
                ? "#ef4444"
                : riskType === "MULE"
                ? "#f59e0b"
                : "#64748b",

            strokeWidth:
              riskType === "MIXER"
                ? 3
                : 2,
          },

          markerEnd: {
            type: MarkerType.ArrowClosed,

            color:
              riskType === "MIXER"
                ? "#ef4444"
                : riskType === "MULE"
                ? "#f59e0b"
                : "#64748b",
          },
        });
      }
    );

    return {
      graphNodes: nodes,
      graphEdges: edges,
    };
  }, [walletAddress, transactions]);

  const [nodes, setNodes, onNodesChange] =
    useNodesState(graphNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(graphEdges);

  /*
   * Update React Flow whenever real blockchain
   * data changes.
   */
  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [
    graphNodes,
    graphEdges,
    setNodes,
    setEdges,
  ]);

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div
        style={{
          height: "100%",
          minHeight: "580px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: "14px",
        }}
      >
        Loading real blockchain relationships...
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div
        style={{
          height: "100%",
          minHeight: "580px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          fontSize: "14px",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "580px",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          if (
            node.id === "root-wallet"
          ) {
            onWalletSelect({
              address: walletAddress,
              label: "Investigated Wallet",
              type: "SUSPECT",
            });

            return;
          }

          const address =
            node.id.replace(
              "wallet-",
              ""
            );

          onWalletSelect({
            address,
            label: shortAddress(address),
            type:
              (node.data as any)?.type ||
              "WALLET",
          });
        }}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.45,
          maxZoom: 1,
        }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{
          hideAttribution: false,
        }}
      >
        <Background
          gap={22}
          size={1}
        />

        <Controls />

        <MiniMap
          nodeColor={(node) => {
            const type =
              (node.data as any)?.type;

            if (type === "SUSPECT") {
              return "#3b82f6";
            }

            if (type === "MULE") {
              return "#f59e0b";
            }

            if (type === "MIXER") {
              return "#ef4444";
            }

            if (type === "EXCHANGE") {
              return "#22c55e";
            }

            return "#64748b";
          }}
        />
      </ReactFlow>
    </div>
  );
}