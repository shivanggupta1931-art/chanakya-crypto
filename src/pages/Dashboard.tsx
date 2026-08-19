import { useMemo, useState } from "react";
import {
  IndianRupee,
  WalletCards,
  TriangleAlert,
  Activity,
  Download,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import WalletGraph from "../components/graph/WalletGraph";
import WalletDrawer from "../components/wallet/WalletDrawer";
import { api, type Wallet } from "../lib/api";

function formatAddress(address: string) {
  if (!address) return "";

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Dashboard({
  setPage,
  walletAddress,
}: {
  setPage: (p: string) => void;
  walletAddress: string;
}) {
  const caseData = api.getCase("CC-2026-0417")!;

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [explain, setExplain] = useState(false);

  const alerts = api.getAlerts();

  const summary = useMemo(
    () =>
      `Funds originating from the primary suspect account were transferred to Mule Account 01 within 17 minutes. The funds subsequently interacted with a flagged obfuscation service before reaching additional accounts and an identified exchange. Total traced: ₹48.2 lakh. High-risk accounts: 4.`,
    []
  );

  return (
    <div className="page-pad">

      {/* LIVE FEED */}
      <div className="live-ticker">
        <span className="live-dot" />
        LIVE INTELLIGENCE FEED
        <b>•</b>
        High-value transfer detected
        <span>₹11.8L</span>
        <b>•</b>
        Obfuscation interaction detected
        <span>10:48</span>
        <b>•</b>
        Exchange off-ramp identified
      </div>

      {/* PAGE HEADER */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            ACTIVE INVESTIGATION · {caseData.id}
          </span>

          <h1>{caseData.title}</h1>

          <p>
            {caseData.firNumber} · Investigator{" "}
            {caseData.investigator}
          </p>

          {/* CURRENTLY TRACED WALLET */}
          {walletAddress && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              CURRENT WALLET ·{" "}
              <strong style={{ color: "var(--text)" }}>
                {formatAddress(walletAddress)}
              </strong>
            </div>
          )}
        </div>

        <div className="heading-actions">
          <button className="ghost-btn">
            <Filter size={16} />
            Filters
          </button>

          <button
            className="primary-btn"
            onClick={() => setPage("Report Studio")}
          >
            <Download size={16} />
            Evidence Dossier
          </button>
        </div>
      </div>

      {/* METRICS */}
      <div className="metric-grid">
        <MetricCard
          label="Funds Traced"
          value="₹48.2L"
          meta="+18.4% since first trace"
          icon={<IndianRupee size={19} />}
          tone="blue"
        />

        <MetricCard
          label="Linked Accounts"
          value="17"
          meta="4 high-risk accounts"
          icon={<WalletCards size={19} />}
          tone="amber"
        />

        <MetricCard
          label="Risk Score"
          value="91/100"
          meta="Critical investigation"
          icon={<TriangleAlert size={19} />}
          tone="red"
        />

        <MetricCard
          label="Transactions"
          value="42"
          meta="7 require review"
          icon={<Activity size={19} />}
          tone="green"
        />
      </div>

      {/* MAIN WORKSPACE */}
      <div className="workspace-grid">

        {/* WALLET GRAPH */}
        <section className="panel graph-panel">

          <div className="panel-header">
            <div>
              <span className="eyebrow">
                MONEY FLOW VISUALIZER
              </span>

              <h2>
                Transaction Relationship Graph
              </h2>

              {walletAddress && (
                <span
                  style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "11px",
                    color: "var(--muted)",
                  }}
                >
                  Tracing {formatAddress(walletAddress)}
                </span>
              )}
            </div>

            <div className="graph-controls">
              <button>1 Hop</button>
              <button className="selected">
                3 Hops
              </button>
              <button>5 Hops</button>
            </div>
          </div>

          <div className="legend">
            <span>
              <i className="blue-dot" />
              Starting suspect
            </span>

            <span>
              <i className="amber-dot" />
              Suspicious hop
            </span>

            <span>
              <i className="red-dot" />
              Flagged / illicit
            </span>

            <span>
              <i className="green-dot" />
              Exchange / off-ramp
            </span>
          </div>

          <div className="graph-wrap">

            {walletAddress ? (
              <WalletGraph
                walletAddress={walletAddress}
                onWalletSelect={setWallet}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  minHeight: "580px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "8px",
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                <WalletCards size={32} />

                <h3
                  style={{
                    margin: 0,
                    color: "var(--text)",
                  }}
                >
                  No wallet selected
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                  }}
                >
                  Analyze a wallet in Wallet Tracer
                  to display its money-flow graph here.
                </p>

                <button
                  className="primary-btn"
                  style={{ marginTop: "8px" }}
                  onClick={() => setPage("Wallet Tracer")}
                >
                  Open Wallet Tracer
                </button>
              </div>
            )}

          </div>
        </section>

        {/* RIGHT INTELLIGENCE COLUMN */}
        <aside className="intel-column">

          {/* ALERTS */}
          <section className="panel alert-panel">

            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  PRIORITY SIGNALS
                </span>

                <h2>
                  Investigation Alerts
                </h2>
              </div>

              <span className="count-pill">
                {alerts.length}
              </span>
            </div>

            {alerts.map((alert) => (
              <div
                className="alert-row"
                key={alert.id}
              >
                <div
                  className={`severity ${alert.severity.toLowerCase()}`}
                >
                  {alert.severity}
                </div>

                <div className="alert-copy">
                  <strong>{alert.title}</strong>

                  <span>
                    {new Date(
                      alert.timestamp
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}

          </section>

          {/* EXPLAIN FLOW */}
          <section className="panel explain-panel">

            <div className="ai-icon">
              <Sparkles size={18} />
            </div>

            <div>
              <span className="eyebrow">
                INVESTIGATION ASSIST
              </span>

              <h3>
                Explain this flow
              </h3>
            </div>

            <p>
              {explain
                ? summary
                : "Convert the visible transaction path into a plain-English investigation summary for rapid review."}
            </p>

            <button
              className="primary-btn full"
              onClick={() =>
                setExplain((v) => !v)
              }
            >
              {explain
                ? "Hide Summary"
                : "Explain Transaction Path"}
            </button>

          </section>

          {/* QUICK LOOKUP */}
          <section className="panel search-panel">

            <div className="panel-header">
              <div>
                <span className="eyebrow">
                  QUICK LOOKUP
                </span>

                <h2>
                  Wallet Search
                </h2>
              </div>
            </div>

            <div className="search-input">
              <Search size={16} />

              <input
                placeholder="0x... / label / entity"
              />
            </div>

            <div className="mini-results">
              {api
                .getWallets()
                .slice(0, 4)
                .map((w) => (
                  <button
                    key={w.id}
                    onClick={() =>
                      setWallet(w)
                    }
                  >
                    <span
                      className="node-dot"
                      style={{
                        background:
                          w.type === "MIXER"
                            ? "#ef4444"
                            : w.type === "MULE"
                            ? "#f59e0b"
                            : w.type === "EXCHANGE"
                            ? "#22c55e"
                            : "#3b82f6",
                      }}
                    />

                    <span>
                      {w.label}
                    </span>

                    <b>
                      {w.riskScore}
                    </b>
                  </button>
                ))}
            </div>

          </section>

        </aside>
      </div>

      {/* WALLET DETAILS DRAWER */}
      <WalletDrawer
        wallet={wallet}
        onClose={() => setWallet(null)}
      />

    </div>
  );
}