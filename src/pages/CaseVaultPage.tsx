import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleDot,
  FileSearch,
  Filter,
  Search,
  ShieldAlert,
  WalletCards,
  X,
} from "lucide-react";

import "../styles/caseVault.css";
import { api } from "../lib/api";

function formatAddress(address: string) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityClass(priority: string) {
  return priority.toLowerCase();
}

export default function CaseVaultPage({
  onWalletAddressChange,
  setPage,
}: {
  onWalletAddressChange: (address: string) => void;
  setPage: (page: string) => void;
}) {
  const cases = api.getCases();
  const wallets = api.getWallets();
  const transactions = api.getTransactions();
  const alerts = api.getAlerts();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(cases[0]?.id || "");

  const filteredCases = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cases.filter((item) => {
      const matchesQuery = !normalized ||
        [item.id, item.firNumber, item.title, item.investigator, item.status, item.priority]
          .join(" ").toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  const selectedCase = cases.find((item) => item.id === selectedId) || filteredCases[0] || cases[0];
  const selectedWallet = selectedCase ? wallets.find((wallet) => wallet.id === selectedCase.primaryWallet) : undefined;

  const relatedWalletIds = useMemo(() => {
    if (!selectedCase) return new Set<string>();
    const related = new Set<string>([selectedCase.primaryWallet]);
    let frontier = new Set<string>([selectedCase.primaryWallet]);
    for (let hop = 0; hop < 2; hop += 1) {
      const next = new Set<string>();
      transactions.forEach((tx) => {
        if (frontier.has(tx.from)) next.add(tx.to);
        if (frontier.has(tx.to)) next.add(tx.from);
      });
      next.forEach((id) => related.add(id));
      frontier = next;
    }
    return related;
  }, [selectedCase, transactions]);

  const caseTransactions = useMemo(() => {
    if (!selectedCase) return [];
    return transactions
      .filter((tx) => relatedWalletIds.has(tx.from) || relatedWalletIds.has(tx.to))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedCase, relatedWalletIds, transactions]);

  const caseAlerts = useMemo(() => {
    if (!selectedCase) return [];
    return alerts
      .filter((alert) => relatedWalletIds.has(alert.wallet))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedCase, relatedWalletIds, alerts]);

  const riskSignals = useMemo(() => {
    if (!selectedCase) return 0;
    const flaggedWallets = Array.from(relatedWalletIds).filter((id) => {
      const wallet = wallets.find((item) => item.id === id);
      return wallet && wallet.riskScore >= 70;
    });
    return flaggedWallets.length + caseAlerts.length;
  }, [selectedCase, relatedWalletIds, wallets, caseAlerts]);

  const investigatorActivity = useMemo(() => {
    const items = [
      ...caseAlerts.map((alert) => ({ id: `alert-${alert.id}`, title: alert.title, detail: alert.wallet, timestamp: alert.timestamp, icon: ShieldAlert })),
      ...caseTransactions.map((tx) => ({ id: `tx-${tx.id}`, title: `${tx.amount} ${tx.asset} transfer observed`, detail: `${tx.from} → ${tx.to}`, timestamp: tx.timestamp, icon: ArrowRight })),
    ];
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
  }, [caseAlerts, caseTransactions]);

  function openWallet() {
    if (!selectedWallet) return;
    onWalletAddressChange(selectedWallet.address);
    setPage("Wallet Tracer");
  }

  return (
    <div className="page-pad">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NETWORK ANALYSIS</span>
          <h1>Case / FIR Vault</h1>
          <p>Investigation workspace for active cyber-crime cases.</p>
        </div>
        <div className="heading-actions"><div className="vault-status"><CircleDot size={13} />{cases.length} CASES LOADED</div></div>
      </div>

      <section className="vault-search panel">
        <div className="vault-search-copy">
          <span className="eyebrow">CASE DISCOVERY</span>
          <h2>Find an investigation</h2>
          <p>Search by case ID, FIR, investigator, title or priority.</p>
        </div>
        <div className="vault-search-controls">
          <div className="search-input vault-search-input">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search case, FIR, investigator..." />
            {query && <button className="icon-clear" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
          </div>
          <div className="filter-tabs">
            {[["ALL", "All"], ["ACTIVE", "Active"], ["REVIEW", "Review"]].map(([value, label]) => (
              <button key={value} className={statusFilter === value ? "selected" : ""} onClick={() => setStatusFilter(value)}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="vault-layout">
        <section className="panel case-list-panel">
          <div className="panel-header">
            <div><span className="eyebrow">INVESTIGATION REGISTER</span><h2>Cases & FIRs</h2></div>
            <span className="count-pill">{filteredCases.length}</span>
          </div>
          {filteredCases.length === 0 ? (
            <div className="vault-empty"><FileSearch size={30} /><strong>No investigations found</strong><span>Try a different search or status filter.</span></div>
          ) : (
            <div className="case-list">
              {filteredCases.map((item) => {
                const primary = wallets.find((wallet) => wallet.id === item.primaryWallet);
                const alertCount = alerts.filter((alert) => alert.wallet === item.primaryWallet).length;
                return (
                  <button key={item.id} className={`case-row ${selectedCase?.id === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
                    <div className="case-row-icon"><BriefcaseBusiness size={17} /></div>
                    <div className="case-row-main">
                      <div className="case-row-topline"><span>{item.id}</span><span className={`priority-badge ${priorityClass(item.priority)}`}>{item.priority}</span></div>
                      <strong>{item.title}</strong>
                      <small>{item.firNumber} · {item.investigator}</small>
                      <div className="case-row-meta"><span>{item.status}</span><span>•</span><span>{primary?.label || item.primaryWallet}</span><span>•</span><span>{alertCount} alerts</span></div>
                    </div>
                    <ChevronRight size={17} className="case-chevron" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedCase ? (
          <section className="vault-detail">
            <div className="panel case-hero-panel">
              <div className="case-hero-top">
                <div><span className="eyebrow">ACTIVE INVESTIGATION</span><h2>{selectedCase.title}</h2><p>{selectedCase.id} · {selectedCase.firNumber}</p></div>
                <div className={`priority-badge large ${priorityClass(selectedCase.priority)}`}><AlertTriangle size={13} />{selectedCase.priority}</div>
              </div>
              <div className="case-hero-meta">
                <span><CalendarDays size={14} />Opened {formatDate(selectedCase.createdAt)}</span>
                <span><BriefcaseBusiness size={14} />Investigator {selectedCase.investigator}</span>
                <span><CircleDot size={14} />{selectedCase.status}</span>
              </div>
            </div>

            <div className="case-metrics">
              <div className="panel vault-metric"><span className="eyebrow">LINKED WALLETS</span><strong>{relatedWalletIds.size}</strong><small>Within two transaction hops</small></div>
              <div className="panel vault-metric"><span className="eyebrow">TRANSFERS</span><strong>{caseTransactions.length}</strong><small>Recorded investigation activity</small></div>
              <div className="panel vault-metric"><span className="eyebrow">ALERTS</span><strong>{caseAlerts.length}</strong><small>Signals tied to this network</small></div>
              <div className="panel vault-metric danger-metric"><span className="eyebrow">RISK SIGNALS</span><strong>{riskSignals}</strong><small>Flagged wallets + alerts</small></div>
            </div>

            <div className="vault-detail-grid">
              <section className="panel case-info-panel">
                <div className="panel-header"><div><span className="eyebrow">CASE RECORD</span><h2>Investigation details</h2></div><Filter size={17} /></div>
                <div className="detail-grid">
                  <div><span>CASE ID</span><strong>{selectedCase.id}</strong></div>
                  <div><span>FIR NUMBER</span><strong>{selectedCase.firNumber}</strong></div>
                  <div><span>INVESTIGATOR</span><strong>{selectedCase.investigator}</strong></div>
                  <div><span>STATUS</span><strong>{selectedCase.status}</strong></div>
                  <div><span>PRIORITY</span><strong>{selectedCase.priority}</strong></div>
                  <div><span>EST. ILLICIT FUNDS</span><strong>₹{selectedCase.estimatedIllicitFundsINR.toLocaleString("en-IN")}</strong></div>
                </div>
                {selectedWallet && (
                  <div className="primary-wallet-card">
                    <div className="wallet-card-icon"><WalletCards size={17} /></div>
                    <div><span className="eyebrow">PRIMARY WALLET</span><strong>{selectedWallet.label}</strong><small>{formatAddress(selectedWallet.address)}</small></div>
                    <button className="secondary-btn" onClick={openWallet}>Open Tracer<ArrowRight size={14} /></button>
                  </div>
                )}
              </section>

              <section className="panel activity-panel">
                <div className="panel-header"><div><span className="eyebrow">CASE TIMELINE</span><h2>Recent activity</h2></div></div>
                <div className="activity-list">
                  {investigatorActivity.length === 0 ? <div className="vault-empty compact"><span>No activity recorded for this case.</span></div> : investigatorActivity.map((item) => {
                    const Icon = item.icon;
                    return <div className="activity-item" key={item.id}><div className="activity-icon"><Icon size={14} /></div><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{formatDateTime(item.timestamp)}</time></div>;
                  })}
                </div>
              </section>
            </div>
          </section>
        ) : (
          <section className="panel vault-no-selection"><BriefcaseBusiness size={34} /><h2>Select an investigation</h2><p>Choose a case from the investigation register to inspect its FIR and network activity.</p></section>
        )}
      </div>
    </div>
  );
}
