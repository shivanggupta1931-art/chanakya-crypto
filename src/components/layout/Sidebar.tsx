import {
  LayoutDashboard, Network, FolderKanban, Radar, FileText,
  Sun, Moon, Zap, LogOut, ShieldCheck
} from "lucide-react";

type Theme = "light" | "dark" | "amoled";
type Props = { theme: Theme; setTheme: (theme: Theme) => void; page: string; setPage: (page: string) => void };

const items = [
  ["Dashboard", LayoutDashboard, "Overview"],
  ["Wallet Tracer", Network, "7"],
  ["Case / FIR Vault", FolderKanban, "12"],
  ["Scam & Mixer Intel", Radar, "31"],
  ["Report Studio", FileText, ""]
] as const;

export default function Sidebar({ theme, setTheme, page, setPage }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><ShieldCheck size={25} /></div>
        <div>
          <div className="brand-title">CHANAKYA</div>
          <div className="brand-sub">CRYPTO INTEL</div>
        </div>
      </div>

      <div className="system-status"><span>●</span> SYSTEM OPERATIONAL</div>

      <div className="nav-section-title">COMMAND CENTER</div>
      <nav className="nav-list">
        {items.map(([label, Icon, badge]) => (
          <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => setPage(label)}>
            <Icon size={18} />
            <span>{label}</span>
            {badge && <b className={label === "Dashboard" ? "nav-badge muted-badge" : "nav-badge"}>{badge}</b>}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="nav-section-title">INTERFACE</div>
        <div className="theme-switch">
          <button className={theme === "light" ? "selected" : ""} onClick={() => setTheme("light")}><Sun size={15}/> Light</button>
          <button className={theme === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}><Moon size={15}/> Dark</button>
          <button className={theme === "amoled" ? "selected" : ""} onClick={() => setTheme("amoled")}><Zap size={15}/> AMOLED</button>
        </div>

        <div className="officer-card">
          <div className="avatar">42</div>
          <div>
            <strong>INV-CHD-042</strong>
            <span>Cyber Crime Cell</span>
          </div>
        </div>

        <button className="logout"><LogOut size={16}/> Emergency Logout</button>
      </div>
    </aside>
  );
}