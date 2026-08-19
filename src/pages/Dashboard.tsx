import { useEffect, useMemo, useState } from "react";
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

  const [wallet, setWallet] =
    useState<Wallet | null>(null);

  const [explain, setExplain] =
    useState(false);

  const [transactionData, setTransactionData] =
    useState<any>(null);

  const [sanctionsData, setSanctionsData] =
    useState<any>(null);

  const [riskData, setRiskData] =
    useState<any>(null);

  const [loadingIntel, setLoadingIntel] =
    useState(false);

  const [intelError, setIntelError] =
    useState("");

  const alerts = api.getAlerts();

  // ==========================================
  // LOAD REAL WALLET INTELLIGENCE
  // ==========================================

useEffect(() => {
  const address = walletAddress?.trim();

  // No valid wallet selected
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    setTransactionData(null);
    setSanctionsData(null);
    setRiskData(null);
    setIntelError("");
    setLoadingIntel(false);
    return;
  }

  let cancelled = false;

  async function loadWalletIntelligence() {
    try {
      setLoadingIntel(true);
      setIntelError("");

      const [
        transactions,
        sanctions,
        risk,
      ] = await Promise.all([
        api.getRealWalletGraph(address),
        api.getWalletSanctions(address),
        api.getWalletRisk(address),
      ]);

      if (cancelled) return;

      setTransactionData(transactions);
      setSanctionsData(sanctions);
      setRiskData(risk);

    } catch (error) {
      console.error(
        "Wallet intelligence error:",
        error
      );

      if (!cancelled) {
        setIntelError(
          "Unable to load live wallet intelligence."
        );

        setTransactionData(null);
        setSanctionsData(null);
        setRiskData(null);
      }

    } finally {
      if (!cancelled) {
        setLoadingIntel(false);
      }
    }
  }

  loadWalletIntelligence();

  return () => {
    cancelled = true;
  };
}, [walletAddress]);
  // ==========================================
  // REAL TRANSACTION DATA
  // ==========================================

  const transactions =
    transactionData?.transactions || [];

  const transactionCount =
    transactionData?.count ??
    transactions.length ??
    0;

  // ==========================================
  // UNIQUE COUNTERPARTIES
  // ==========================================

  const linkedAccounts = useMemo(() => {
    const addresses = new Set<string>();

    transactions.forEach((tx: any) => {
      if (
        tx.from &&
        tx.from.toLowerCase() !==
          walletAddress.toLowerCase()
      ) {
        addresses.add(
          tx.from.toLowerCase()
        );
      }

      if (
        tx.to &&
        tx.to.toLowerCase() !==
          walletAddress.toLowerCase()
      ) {
        addresses.add(
          tx.to.toLowerCase()
        );
      }
    });

    return addresses.size;
  }, [
    transactions,
    walletAddress,
  ]);

  // ==========================================
  // ETH TRANSFER TOTAL
  // ==========================================

  const totalEth = useMemo(() => {
    return transactions.reduce(
      (total: number, tx: any) => {
        if (
          tx.asset === "ETH" &&
          typeof tx.value === "number"
        ) {
          return total + tx.value;
        }

        return total;
      },
      0
    );
  }, [transactions]);

  // ==========================================
  // SCORECHAIN SANCTIONS
  // ==========================================

  const sanctioned =
    sanctionsData?.sanctioned === true;

  // ==========================================
  // REAL CHANAKYA RISK ENGINE RESULT
  // ==========================================

  const riskScore =
    riskData?.score ?? 0;

  const riskLevel =
    riskData?.level ??
    "UNKNOWN";

  const riskFactors =
    riskData?.riskFactors || [];

  // ==========================================
  // INVESTIGATION SUMMARY
  // ==========================================

  const summary = useMemo(() => {
    if (!walletAddress) {
      return "Analyze a wallet to generate a live investigation summary.";
    }

    if (loadingIntel) {
      return "Loading live blockchain, sanctions and risk intelligence...";
    }

    return `Wallet ${formatAddress(
      walletAddress
    )} has ${transactionCount} recorded transfers and ${linkedAccounts} unique counterparties. Approximately ${totalEth.toFixed(
      4
    )} ETH of native Ethereum transfers were identified in the returned dataset. Scorechain sanctions screening returned ${
      sanctioned
        ? "a sanctions match"
        : "no sanctions match"
    }. Chanakya's risk engine classified this wallet as ${riskLevel.toLowerCase()} risk with a score of ${riskScore}/100.`;
  }, [
    walletAddress,
    loadingIntel,
    transactionCount,
    linkedAccounts,
    totalEth,
    sanctioned,
    riskLevel,
    riskScore,
  ]);

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="page-pad">

      {/* ======================================
          LIVE INTELLIGENCE FEED
      ====================================== */}

      <div className="live-ticker">
        <span className="live-dot" />

        LIVE INTELLIGENCE FEED

        <b>•</b>

        Blockchain data

        <span>
          {loadingIntel
            ? "ANALYZING"
            : "CONNECTED"}
        </span>

        <b>•</b>

        Scorechain sanctions screening

        <span>
          {loadingIntel
            ? "..."
            : sanctioned
            ? "MATCH"
            : "CLEAR"}
        </span>
      </div>

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            ACTIVE INVESTIGATION ·{" "}
            {caseData.id}
          </span>

          <h1>{caseData.title}</h1>

          <p>
            {caseData.firNumber} · Investigator{" "}
            {caseData.investigator}
          </p>

          {walletAddress && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "var(--muted)",
              }}
            >
              CURRENT WALLET ·{" "}
              <strong
                style={{
                  color: "var(--text)",
                }}
              >
                {formatAddress(
                  walletAddress
                )}
              </strong>
            </div>
          )}

          {intelError && (
            <div
              style={{
                marginTop: "8px",
                color: "#ef4444",
                fontSize: "12px",
              }}
            >
              {intelError}
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
            onClick={() =>
              setPage("Report Studio")
            }
          >
            <Download size={16} />
            Evidence Dossier
          </button>
        </div>
      </div>

      {/* ======================================
          REAL METRICS
      ====================================== */}

      <div className="metric-grid">

        <MetricCard
          label="ETH Traced"
          value={
            loadingIntel
              ? "..."
              : `${totalEth.toFixed(4)} ETH`
          }
          meta="Native ETH transfers"
          icon={
            <IndianRupee size={19} />
          }
          tone="blue"
        />

        <MetricCard
          label="Linked Accounts"
          value={
            loadingIntel
              ? "..."
              : String(linkedAccounts)
          }
          meta="Unique counterparties"
          icon={
            <WalletCards size={19} />
          }
          tone="amber"
        />

        <MetricCard
          label="Risk Score"
          value={
            loadingIntel
              ? "..."
              : `${riskScore}/100`
          }
          meta={
            loadingIntel
              ? "Analyzing..."
              : `${riskLevel} · Chanakya Risk Engine`
          }
          icon={
            <TriangleAlert size={19} />
          }
          tone="red"
        />

        <MetricCard
          label="Transactions"
          value={
            loadingIntel
              ? "..."
              : String(transactionCount)
          }
          meta={
            sanctioned
              ? "Scorechain sanctions match"
              : "Scorechain: no sanctions match"
          }
          icon={
            <Activity size={19} />
          }
          tone="green"
        />

      </div>

      {/* ======================================
          MAIN WORKSPACE
      ====================================== */}

      <div className="workspace-grid">

        {/* ====================================
            GRAPH
        ==================================== */}

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
                  Tracing{" "}
                  {formatAddress(
                    walletAddress
                  )}
                </span>
              )}
            </div>

            <div className="graph-controls">
              <button>
                1 Hop
              </button>

              <button className="selected">
                3 Hops
              </button>

              <button>
                5 Hops
              </button>
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
                walletAddress={
                  walletAddress
                }
                onWalletSelect={
                  setWallet
                }
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
                  Analyze a wallet in
                  Wallet Tracer to
                  display its money-flow
                  graph here.
                </p>

                <button
                  className="primary-btn"
                  style={{
                    marginTop: "8px",
                  }}
                  onClick={() =>
                    setPage(
                      "Wallet Tracer"
                    )
                  }
                >
                  Open Wallet Tracer
                </button>
              </div>
            )}

          </div>

        </section>

        {/* ====================================
            RIGHT INTELLIGENCE COLUMN
        ==================================== */}

        <aside className="intel-column">

          {/* ==================================
              ALERTS
          ================================== */}

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

                  <strong>
                    {alert.title}
                  </strong>

                  <span>
                    {new Date(
                      alert.timestamp
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>
              </div>
            ))}

          </section>

          {/* ==================================
              EXPLAIN FLOW
          ================================== */}

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
                : "Convert the live transaction path, sanctions result and risk factors into a plain-English investigation summary."}
            </p>

            <button
              className="primary-btn full"
              onClick={() =>
                setExplain(
                  (value) => !value
                )
              }
            >
              {explain
                ? "Hide Summary"
                : "Explain Transaction Path"}
            </button>

          </section>

          {/* ==================================
              CHANAKYA RISK FACTORS
          ================================== */}

          <section className="panel">

            <div className="panel-header">

              <div>
                <span className="eyebrow">
                  CHANAKYA ANALYSIS
                </span>

                <h2>
                  Risk Factors
                </h2>
              </div>

              <span className="count-pill">
                {riskFactors.length}
              </span>

            </div>

            {loadingIntel ? (
              <div
                style={{
                  padding: "14px",
                  color: "var(--muted)",
                  fontSize: "12px",
                }}
              >
                Analyzing wallet...
              </div>
            ) : riskFactors.length === 0 ? (
              <div
                style={{
                  padding: "14px",
                  color: "var(--muted)",
                  fontSize: "12px",
                }}
              >
                No significant risk
                factors detected.
              </div>
            ) : (
              riskFactors
                .slice(0, 4)
                .map(
                  (
                    factor: any,
                    index: number
                  ) => (
                    <div
                      key={`${factor.factor}-${index}`}
                      style={{
                        padding:
                          "10px 0",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              "12px",
                          }}
                        >
                          {factor.factor}
                        </strong>

                        <b
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#ef4444",
                          }}
                        >
                          +{factor.points}
                        </b>
                      </div>

                      {factor.description && (
                        <span
                          style={{
                            display:
                              "block",
                            marginTop:
                              "4px",
                            fontSize:
                              "10px",
                            color:
                              "var(--muted)",
                          }}
                        >
                          {
                            factor.description
                          }
                        </span>
                      )}
                    </div>
                  )
                )
            )}

          </section>

          {/* ==================================
              SCORECHAIN
          ================================== */}

          <section className="panel">

            <div className="panel-header">

              <div>
                <span className="eyebrow">
                  SCORECHAIN
                </span>

                <h2>
                  Sanctions Screening
                </h2>
              </div>

            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                background:
                  sanctioned
                    ? "rgba(239,68,68,.10)"
                    : "rgba(34,197,94,.10)",
                border:
                  `1px solid ${
                    sanctioned
                      ? "rgba(239,68,68,.25)"
                      : "rgba(34,197,94,.25)"
                  }`,
              }}
            >

              <strong>

                {loadingIntel
                  ? "SCREENING..."
                  : sanctioned
                  ? "⚠ SANCTIONS MATCH"
                  : "✓ NO SANCTIONS MATCH"}

              </strong>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                Real Scorechain
                sanctions screening
              </div>

            </div>

          </section>

          {/* ==================================
              QUICK WALLET LOOKUP
          ================================== */}

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
                          w.type ===
                          "MIXER"
                            ? "#ef4444"
                            : w.type ===
                              "MULE"
                            ? "#f59e0b"
                            : w.type ===
                              "EXCHANGE"
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

      <WalletDrawer
        wallet={wallet}
        onClose={() =>
          setWallet(null)
        }
      />

    </div>
  );
}