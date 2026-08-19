import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Search, ShieldAlert, WalletCards } from "lucide-react";
import data from "../data/mockData.json";
import "../styles/scamMixer.css";

type Wallet = (typeof data.wallets)[number];
type Transaction = (typeof data.transactions)[number];
type AlertItem = (typeof data.alerts)[number];

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function riskClass(score: number) {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  return "medium";
}

export default function ScamMixerIntelPage({
  setPage,
  onWalletAddressChange,
}: {
  setPage: (page: string) => void;
  onWalletAddressChange: (address: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("W003");

  const suspiciousWallets = useMemo(
    () =>
      data.wallets.filter((wallet) =>
        ["MIXER", "MULE", "SUSPECT"].includes(wallet.type)
      ),
    []
  );

  const filteredWallets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suspiciousWallets;
    return suspiciousWallets.filter((wallet) =>
      [wallet.label, wallet.type, wallet.status, wallet.entity, ...wallet.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, suspiciousWallets]);

  const selectedWallet =
    data.wallets.find((wallet) => wallet.id === selectedId) || suspiciousWallets[0];

  const relatedTransactions = data.transactions.filter(
    (tx) => tx.from === selectedWallet.id || tx.to === selectedWallet.id
  );

  const relatedAlerts = data.alerts.filter(
    (alert) => alert.wallet === selectedWallet.id
  );

  const incoming = relatedTransactions.filter((tx) => tx.to === selectedWallet.id);
  const outgoing = relatedTransactions.filter((tx) => tx.from === selectedWallet.id);

  function openTracer() {
    onWalletAddressChange(selectedWallet.address);
    setPage("Wallet Tracer");
  }

  return (
    <div className="page-pad scam-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CRYPTO FLOW & FRAUD ANALYTICS</span>
          <h1>Scam & Mixer Intel</h1>
          <p>Identify obfuscation, mule movement and high-risk crypto flows.</p>
        </div>
        <div className="intel-live"><span /> INTELLIGENCE ACTIVE</div>
      </div>

      <div className="intel-summary">
        <div className="panel intel-stat">
          <span className="eyebrow">SUSPICIOUS WALLETS</span>
          <strong>{suspiciousWallets.length}</strong>
          <small>Mixer, mule and suspect accounts</small>
        </div>
        <div className="panel intel-stat">
          <span className="eyebrow">MIXER SIGNALS</span>
          <strong>{data.wallets.filter((w) => w.type === "MIXER").length}</strong>
          <small>Obfuscation-linked wallets</small>
        </div>
        <div className="panel intel-stat danger">
          <span className="eyebrow">HIGH-RISK ALERTS</span>
          <strong>{data.alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").length}</strong>
          <small>Priority signals in current dataset</small>
        </div>
      </div>

      <div className="intel-layout">
        <section className="panel intel-list">
          <div className="panel-header">
            <div>
              <span className="eyebrow">SUSPICIOUS ENTITIES</span>
              <h2>Risk watchlist</h2>
            </div>
          </div>

          <div className="search-input intel-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search wallet, type or tag..."
            />
          </div>

          <div className="intel-wallet-list">
            {filteredWallets.map((wallet) => (
              <button
                key={wallet.id}
                className={`intel-wallet-row ${selectedWallet.id === wallet.id ? "selected" : ""}`}
                onClick={() => setSelectedId(wallet.id)}
              >
                <div className="intel-wallet-icon"><WalletCards size={16} /></div>
                <div>
                  <strong>{wallet.label}</strong>
                  <small>{wallet.type} · {shortAddress(wallet.address)}</small>
                </div>
                <span className={`risk-pill ${riskClass(wallet.riskScore)}`}>{wallet.riskScore}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel intel-detail">
          <div className="intel-detail-head">
            <div>
              <span className="eyebrow">SELECTED ENTITY</span>
              <h2>{selectedWallet.label}</h2>
              <p>{selectedWallet.type} · {shortAddress(selectedWallet.address)}</p>
            </div>
            <div className={`risk-score ${riskClass(selectedWallet.riskScore)}`}>
              <span>RISK</span>
              <strong>{selectedWallet.riskScore}</strong>
              <small>/100</small>
            </div>
          </div>

          <div className="intel-tags">
            {selectedWallet.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>

          <div className="flow-strip">
            <div><span>INCOMING</span><strong>{incoming.length}</strong></div>
            <ArrowRight size={18} />
            <div><span>SELECTED</span><strong>{selectedWallet.type}</strong></div>
            <ArrowRight size={18} />
            <div><span>OUTGOING</span><strong>{outgoing.length}</strong></div>
          </div>

          <div className="intel-columns">
            <div>
              <div className="section-label">RISK SIGNALS</div>
              {relatedAlerts.length ? relatedAlerts.map((alert: AlertItem) => (
                <div className="signal-row" key={alert.id}>
                  <ShieldAlert size={15} />
                  <div><strong>{alert.title}</strong><small>{alert.severity} · {new Date(alert.timestamp).toLocaleString("en-IN")}</small></div>
                </div>
              )) : <div className="muted-note">No direct alerts in current dataset.</div>}
            </div>

            <div>
              <div className="section-label">RECENT FLOW</div>
              {relatedTransactions.map((tx: Transaction) => (
                <div className="flow-row" key={tx.id}>
                  <span>{tx.from === selectedWallet.id ? "OUT" : "IN"}</span>
                  <div><strong>{tx.amount}</strong><small>{tx.from === selectedWallet.id ? `to ${tx.to}` : `from ${tx.from}`}</small></div>
                  <em>{tx.risk}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="intel-action">
            <div><AlertTriangle size={16} /><span>Use the live Wallet Tracer for full on-chain expansion.</span></div>
            <button className="primary-btn" onClick={openTracer}>Open Wallet Tracer <ArrowRight size={15} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}
