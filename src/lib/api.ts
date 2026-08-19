import data from "../data/mockData.json";

const BACKEND_URL = "http://localhost:5001";

const cleanAddress = (walletAddress: string) => {
  return walletAddress?.trim();
};

export const api = {
  getCases: () => data.cases,

  getCase: (caseId: string) =>
    data.cases.find((item) => item.id === caseId),

  getWallets: () => data.wallets,

  getWallet: (walletId: string) =>
    data.wallets.find((item) => item.id === walletId),

  getTransactions: () => data.transactions,

  getAlerts: () => data.alerts,

  // ==========================================
  // REAL ALCHEMY WALLET TRANSACTIONS
  // ==========================================

  getRealWalletGraph: async (walletAddress: string) => {
    const address = cleanAddress(walletAddress);

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("Invalid or missing wallet address");
    }

    const response = await fetch(
      `${BACKEND_URL}/api/wallet/${address}/transactions`
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    return response.json();
  },

  // ==========================================
  // REAL SCORECHAIN SANCTIONS SCREENING
  // ==========================================

  getWalletSanctions: async (walletAddress: string) => {
    const address = cleanAddress(walletAddress);

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("Invalid or missing wallet address");
    }

    const response = await fetch(
      `${BACKEND_URL}/api/wallet/${address}/sanctions`
    );

    if (!response.ok) {
      throw new Error(
        `Scorechain returned ${response.status}`
      );
    }

    return response.json();
  },

  // ==========================================
  // CHANAKYA RISK ENGINE
  // ==========================================

getWalletRisk: async (walletAddress: string) => {
  const address = walletAddress?.trim();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid or missing wallet address");
  }

  const response = await fetch(
    `${BACKEND_URL}/api/wallet/${address}/risk`
  );

  if (!response.ok) {
    throw new Error(`Risk API returned ${response.status}`);
  }

  return response.json();
},
};

export type Wallet = (typeof data.wallets)[number];

export type Case = (typeof data.cases)[number];

export type Transaction =
  (typeof data.transactions)[number];