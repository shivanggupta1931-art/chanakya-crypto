import { useEffect, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import ReportStudio from "./components/reports/ReportStudio";

type Theme = "light" | "dark" | "amoled";

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("chanakya-theme") as Theme) || "dark");
  const [page, setPage] = useState("Dashboard");

  useEffect(() => {
    localStorage.setItem("chanakya-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className={`app theme-${theme}`}>
      <Sidebar theme={theme} setTheme={setTheme} page={page} setPage={setPage}/>
      <main className="main-stage">
        <TopBar/>
        {page === "Dashboard" ? <Dashboard setPage={setPage}/> :
         page === "Report Studio" ? <ReportStudio/> :
         <PlaceholderPage title={page}/>}
      </main>
    </div>
  );
}