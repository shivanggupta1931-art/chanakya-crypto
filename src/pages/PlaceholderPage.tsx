import { useState } from "react";
import {
  Search,
  Activity,
  AlertTriangle,
  DatabaseZap,
  Loader2,
  FolderOpen,
  ArrowRight,
} from "lucide-react";

import WalletGraph from "../components/graph/WalletGraph";

type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string | null;
  category: string;
  blockNum: string;
  blockTimestamp: string | null;
};

type WalletResponse = {
  wallet: string;
  network: string;
  count: number;
  transactions: Transaction[];
};

function formatAddress(address: string) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

/*
 * Backend URL:
 * - Local development: http://localhost:5001
 * - Production: set VITE_API_BASE_URL to your deployed backend URL.
 *
 * Example:
 * VITE_API_BASE_URL=https://your-backend-domain.com
 */
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001"
).replace(/\/$/, "");

function formatValue(tx: Transaction) {
  if (tx.value === null || tx.value === undefined) {
    return "-";
  }

  return `${Number(tx.value).toFixed(4)} ${
    tx.asset || "ETH"
  }`;
}

export default function PlaceholderPage({
  title,
  walletAddress,
  onWalletAddressChange,
}: {
  title: string;
  walletAddress: string;
  onWalletAddressChange: (
    address: string
  ) => void;
}) {
  const isTracer =
    title.trim().toLowerCase() === "wallet tracer";



  const [analyzedAddress, setAnalyzedAddress] =
    useState("");

  const [transactions, setTransactions] = useState<
    Transaction[]
  >([]);

  const [transactionCount, setTransactionCount] =
    useState(0);

  const [network, setNetwork] = useState(
    "ethereum-mainnet"
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function analyzeWallet() {
    const address = walletAddress.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError(
        "Please enter a valid Ethereum wallet address."
      );
      setAnalyzedAddress("");
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wallet/${address}/transactions`
      );

      let data: WalletResponse | { error?: string };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Backend returned ${response.status} with an invalid response.`
        );
      }

      if (!response.ok) {
        const message =
          "error" in data && data.error
            ? data.error
            : `Backend returned ${response.status}`;

        throw new Error(message);
      }

      if (
        !("wallet" in data) ||
        !Array.isArray(data.transactions)
      ) {
        throw new Error(
          "Backend returned an unexpected wallet response."
        );
      }

      const walletData = data as WalletResponse;

      setAnalyzedAddress(walletData.wallet);
      setNetwork(walletData.network);
      setTransactionCount(walletData.count);
      setTransactions(walletData.transactions || []);

      setAnalyzedAddress(data.wallet);
      setNetwork(data.network);
      setTransactionCount(data.count);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(
        "Wallet analysis error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Unknown backend error.";

      setError(
        `Unable to fetch wallet data: ${message}`
      );

      setAnalyzedAddress("");
      setTransactions([]);
      setTransactionCount(0);
    } finally {
      setLoading(false);
    }
  }

  function handleWalletSelect(wallet: any) {
    if (!wallet) return;

    if (wallet.address) {
      onWalletAddressChange(wallet.address);
    }
  }

  if (isTracer) {
    return (
      <div className="page-pad">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              NETWORK ANALYSIS
            </span>

            <h1>Wallet Tracer</h1>

            <p>
              Trace and expand real Ethereum
              money-flow relationships.
            </p>
          </div>
        </div>

        <section
          className="panel"
          style={{ marginBottom: "18px" }}
        >
          <div className="panel-header">
            <div>
              <span className="eyebrow">
                REAL BLOCKCHAIN ANALYSIS
              </span>

              <h2>
                Analyze Ethereum Wallet
              </h2>
            </div>

            <DatabaseZap size={22} />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              className="search-input"
              style={{
                flex: 1,
                minWidth: "280px",
              }}
            >
              <Search size={17} />

              <input
                value={walletAddress}
                onChange={(e) => {
                  onWalletAddressChange(
                    e.target.value
                  );
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    analyzeWallet();
                  }
                }}
                placeholder="Enter Ethereum wallet address..."
              />
            </div>

            <button
              className="primary-btn"
              onClick={analyzeWallet}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="spin"
                  />

                  Analyzing...
                </>
              ) : (
                <>
                  <Activity size={16} />

                  Analyze Wallet
                </>
              )}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                background:
                  "rgba(239,68,68,0.08)",
                border:
                  "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                fontSize: "13px",
              }}
            >
              <AlertTriangle size={16} />

              {error}
            </div>
          )}

          {analyzedAddress &&
            !error && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "var(--muted)",
                  wordBreak: "break-all",
                }}
              >
                Analyzing:
                <br />

                <strong
                  style={{
                    color: "var(--text)",
                  }}
                >
                  {analyzedAddress}
                </strong>
              </div>
            )}
        </section>

        {analyzedAddress &&
          !loading &&
          !error && (
            <div
              className="metric-grid"
              style={{
                marginBottom: "18px",
              }}
            >
              <div className="panel">
                <span className="eyebrow">
                  NETWORK
                </span>

                <h2
                  style={{
                    marginTop: "8px",
                  }}
                >
                  Ethereum Mainnet
                </h2>

                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: "12px",
                  }}
                >
                  {network ||
                    "ethereum-mainnet"}
                </span>
              </div>

              <div className="panel">
                <span className="eyebrow">
                  TRANSACTIONS FOUND
                </span>

                <h2
                  style={{
                    marginTop: "8px",
                  }}
                >
                  {transactionCount}
                </h2>

                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: "12px",
                  }}
                >
                  Real blockchain transactions
                </span>
              </div>

              <div className="panel">
                <span className="eyebrow">
                  WALLET
                </span>

                <h2
                  style={{
                    marginTop: "8px",
                    fontSize: "16px",
                  }}
                >
                  {formatAddress(
                    analyzedAddress
                  )}
                </h2>

                <span
                  style={{
                    color: "#22c55e",
                    fontSize: "12px",
                  }}
                >
                  ● LIVE DATA
                </span>
              </div>
            </div>
          )}

        {analyzedAddress &&
          !loading &&
          !error && (
            <section
              className="panel"
              style={{
                marginBottom: "18px",
                height: "620px",
              }}
            >
              <div className="panel-header">
                <div>
                  <span className="eyebrow">
                    MONEY FLOW VISUALIZER
                  </span>

                  <h2>
                    Transaction Relationship Graph
                  </h2>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    color: "#22c55e",
                  }}
                >
                  ● LIVE BLOCKCHAIN DATA
                </span>
              </div>

              <div
                style={{
                  height:
                    "calc(100% - 65px)",
                  minHeight: "500px",
                }}
              >
                <WalletGraph
                  onWalletSelect={
                    handleWalletSelect
                  }
                  walletAddress={
                    analyzedAddress
                  }
                />
              </div>
            </section>
          )}

        {analyzedAddress &&
          !loading &&
          !error && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">
                    ON-CHAIN ACTIVITY
                  </span>

                  <h2>
                    Recent Transactions
                  </h2>
                </div>

                <span className="count-pill">
                  {transactions.length}
                </span>
              </div>

              {transactions.length === 0 ? (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  <FolderOpen size={32} />

                  <h3>
                    No transactions found
                  </h3>

                  <p>
                    No transactions were
                    returned for this wallet.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "1px",
                  }}
                >
                  {transactions
                    .slice(0, 25)
                    .map(
                      (
                        tx,
                        index
                      ) => (
                        <div
                          key={`${
                            tx.hash ||
                            "tx"
                          }-${index}`}
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "40px 1fr 1fr 140px 110px",
                            gap: "12px",
                            alignItems:
                              "center",
                            padding:
                              "14px 10px",
                            borderBottom:
                              "1px solid var(--border)",
                            fontSize:
                              "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius:
                                "50%",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                "rgba(59,130,246,0.12)",
                              color:
                                "#3b82f6",
                            }}
                          >
                            <ArrowRight
                              size={14}
                            />
                          </div>

                          <div>
                            <span className="eyebrow">
                              FROM
                            </span>

                            <div>
                              {formatAddress(
                                tx.from
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="eyebrow">
                              TO
                            </span>

                            <div>
                              {formatAddress(
                                tx.to
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="eyebrow">
                              VALUE
                            </span>

                            <div>
                              {formatValue(
                                tx
                              )}
                            </div>
                          </div>

                          <div>
                            {tx.hash ? (
                              <a
                                href={`https://etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color:
                                    "#3b82f6",
                                }}
                              >
                                View Tx
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </section>
          )}
      </div>
    );
  }

  return (
    <div className="page-pad">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            NETWORK ANALYSIS
          </span>

          <h1>{title}</h1>

          <p>
            Investigation workspace.
          </p>
        </div>
      </div>
    </div>
  );
}