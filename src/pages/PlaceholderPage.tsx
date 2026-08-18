import { Search, ArrowRight, DatabaseZap, FileSearch, FolderOpen } from "lucide-react";
import { api } from "../lib/api";

export default function PlaceholderPage({ title }: { title: string }) {
  const isCases = title === "Case / FIR Vault";
  const isIntel = title === "Scam & Mixer Intel";
  const isTracer = title === "Wallet Tracer";

  return (
    <div className="page-pad">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{isCases ? "INVESTIGATION RECORDS" : isIntel ? "THREAT INTELLIGENCE" : "NETWORK ANALYSIS"}</span>
          <h1>{title}</h1>
          <p>{isCases ? "Organized active files, suspects and linked accounts." : isIntel ? "Flagged entities and suspicious services from the intelligence feed." : "Trace and expand suspicious money-flow relationships."}</p>
        </div>
      </div>

      {isTracer && <div className="trace-banner"><DatabaseZap size={22}/><div><strong>Trace workspace ready</strong><span>Select a case or wallet from the Dashboard to begin a multi-hop investigation.</span></div><ArrowRight size={18}/></div>}

      <div className="vault-grid">
        {isCases ? api.getCases().map(c => (
          <div className="case-card panel" key={c.id}><div className="case-top"><span className={`priority ${c.priority.toLowerCase()}`}>{c.priority}</span><span>{c.status}</span></div><span className="eyebrow">{c.id}</span><h2>{c.title}</h2><div className="case-stats"><span>FIR <b>{c.firNumber}</b></span><span>FUNDS <b>₹{c.estimatedIllicitFundsINR.toLocaleString("en-IN")}</b></span></div><button className="ghost-btn full">Open Investigation <ArrowRight size={15}/></button></div>
        )) : isIntel ? api.getWallets().filter(w => w.type === "MIXER" || w.status === "FLAGGED").map(w => (
          <div className="intel-card panel" key={w.id}><div className="intel-icon"><FileSearch size={20}/></div><span className="eyebrow">{w.type}</span><h2>{w.label}</h2><p>{w.address}</p><div className="risk-line"><span>Risk score</span><b>{w.riskScore}/100</b></div><div className="tag-wrap">{w.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div></div>
        )) : <div className="empty-trace panel"><FolderOpen size={34}/><h2>Wallet tracing workspace</h2><p>Use the Dashboard graph to inspect accounts, transfers and suspicious paths. The same graph component can later consume live API data.</p></div>}
      </div>
    </div>
  );
}