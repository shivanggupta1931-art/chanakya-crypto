import { useRef, useState } from "react";
import { FileDown, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { generateEvidenceReport } from "../../lib/report";
import WalletGraph from "../graph/WalletGraph";

export default function ReportStudio() {
  const caseData = api.getCase("CC-2026-0417")!;
  const [selected, setSelected] = useState(caseData.id);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const walletAddress =
  "0x00000000219ab540356cbb839cbe05303d7705fa";
  async function generate() {
    if (!reportRef.current) return;
    setGenerating(true);
    setDone(false);
    await new Promise(r => setTimeout(r, 700));
    await generateEvidenceReport(reportRef.current, caseData, api.getWallets());
    setGenerating(false);
    setDone(true);
  }

  return (
    <div className="page-pad">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVIDENCE WORKSPACE</span>
          <h1>Report Generation Studio</h1>
          <p>Build a print-ready investigation dossier in one click.</p>
        </div>
        <button className="primary-btn" onClick={generate} disabled={generating}>
          {generating ? <><Loader2 className="spin" size={17}/> Generating...</> : <><FileDown size={17}/> Generate PDF</>}
        </button>
      </div>

      <div className="report-layout">
        <section className="panel report-controls">
          <span className="eyebrow">01 · SELECT CASE</span>
          <h3>Investigation</h3>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            {api.getCases().map(c => <option value={c.id} key={c.id}>{c.id} — {c.title}</option>)}
          </select>

          <span className="eyebrow report-gap">02 · EVIDENCE INCLUDED</span>
          {["Transaction graph", "Linked wallet index", "Risk indicators", "Investigation metadata", "INR valuation"].map(x =>
            <label className="check-row" key={x}><input type="checkbox" defaultChecked /> <span>{x}</span><CheckCircle2 size={15}/></label>
          )}

          <div className="demo-note">
            <ShieldCheck size={18}/>
            <span>This MVP uses mock intelligence data. Replace the provider layer when connecting live sources.</span>
          </div>
        </section>

        <section className="panel report-preview" ref={reportRef}>
          <div className="report-paper">
            <div className="report-brand">CHANDIGARH POLICE <span>CYBER CRIME CELL</span></div>
            <h2>CRYPTO TRANSACTION<br/>EVIDENCE DOSSIER</h2>
            <div className="report-meta">
              <div><span>FIR NUMBER</span><b>{caseData.firNumber}</b></div>
              <div><span>CASE ID</span><b>{caseData.id}</b></div>
              <div><span>INVESTIGATOR</span><b>{caseData.investigator}</b></div>
              <div><span>EST. ILLICIT FUNDS</span><b>₹{caseData.estimatedIllicitFundsINR.toLocaleString("en-IN")}</b></div>
            </div>
           <div className="report-graph">
  <WalletGraph
    walletAddress={walletAddress}
    onWalletSelect={() => {}}
  />
</div>
            <div className="report-footer">DEMO EVIDENCE PREVIEW · Generated {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        </section>
      </div>

      {done && <div className="toast"><CheckCircle2 size={17}/> Evidence dossier generated successfully.</div>}
    </div>
  );
}