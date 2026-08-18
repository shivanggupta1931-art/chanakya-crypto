import { X, Copy, ExternalLink, ShieldAlert, Activity, Fingerprint } from "lucide-react";
import type { Wallet } from "../../lib/api";

export default function WalletDrawer({ wallet, onClose }: { wallet: Wallet | null; onClose: () => void }) {
  if (!wallet) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="wallet-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span className="eyebrow">WALLET INTELLIGENCE</span>
            <h2>{wallet.label}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={19}/></button>
        </div>

        <div className="address-box">
          <span>{wallet.address}</span>
          <Copy size={15}/>
        </div>

        <div className="risk-panel">
          <div>
            <span className="eyebrow">PRELIMINARY RISK</span>
            <strong>{wallet.riskScore}<small>/100</small></strong>
          </div>
          <div className={`risk-ring risk-${wallet.riskScore >= 90 ? "critical" : wallet.riskScore >= 70 ? "high" : "low"}`}>
            {wallet.riskScore}
          </div>
        </div>

        <div className="detail-grid">
          <div><span>ACCOUNT TYPE</span><b>{wallet.type}</b></div>
          <div><span>KYC STATUS</span><b>{wallet.kycStatus}</b></div>
          <div><span>BALANCE</span><b>{wallet.balance}</b></div>
          <div><span>INR ESTIMATE</span><b>₹{wallet.balanceINR.toLocaleString("en-IN")}</b></div>
        </div>

        <div className="drawer-section">
          <div className="section-heading"><ShieldAlert size={16}/> INTELLIGENCE FLAGS</div>
          <div className="tag-wrap">{wallet.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
        </div>

        <div className="drawer-section">
          <div className="section-heading"><Activity size={16}/> INVESTIGATION ACTIONS</div>
          <button className="drawer-action"><Fingerprint size={16}/> Trace deeper</button>
          <button className="drawer-action"><ExternalLink size={16}/> Add to current case</button>
        </div>
      </aside>
    </div>
  );
}