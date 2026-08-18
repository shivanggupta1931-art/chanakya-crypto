import { Bell, Search, ShieldCheck } from "lucide-react";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={17}/>
        <input placeholder="Search case, FIR, wallet or entity..." />
        <kbd>⌘ K</kbd>
      </div>
      <div className="topbar-right">
        <span className="demo-pill">DEMO / MOCK DATA</span>
        <button className="icon-btn"><Bell size={18}/><i>4</i></button>
        <div className="secure-status"><ShieldCheck size={16}/> SECURE SESSION</div>
      </div>
    </header>
  );
}