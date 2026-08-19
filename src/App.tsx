import { useEffect, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import ReportStudio from "./components/reports/ReportStudio";

type Theme = "light" | "dark" | "amoled";

// Default wallet used when the app starts.
// The user can replace this from Wallet Tracer.
const DEFAULT_WALLET =
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export default function App() {
  const [theme, setTheme] =
    useState<Theme>(
      () =>
        (localStorage.getItem(
          "chanakya-theme"
        ) as Theme) || "dark"
    );

  /*
   * Current wallet being investigated.
   */
  const [currentWalletAddress, setCurrentWalletAddress] =
    useState(DEFAULT_WALLET);

  const [page, setPage] =
    useState("Dashboard");

  useEffect(() => {
    localStorage.setItem(
      "chanakya-theme",
      theme
    );

    document.documentElement.dataset.theme =
      theme;
  }, [theme]);

  return (
    <div className={`app theme-${theme}`}>

      <Sidebar
        theme={theme}
        setTheme={setTheme}
        page={page}
        setPage={setPage}
      />

      <main className="main-stage">

        <TopBar />

        {page === "Dashboard" ? (
          <Dashboard
            setPage={setPage}
            walletAddress={currentWalletAddress}
          />
        ) : page === "Report Studio" ? (
          <ReportStudio
            walletAddress={currentWalletAddress}
          />
        ) : (
          <PlaceholderPage
            title={page}
            walletAddress={currentWalletAddress}
            onWalletAddressChange={
              setCurrentWalletAddress
            }
          />
        )}

      </main>
    </div>
  );
}