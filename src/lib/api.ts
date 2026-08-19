import data from "../data/mockData.json";

const BACKEND_URL = "http://localhost:5001";

export const api = {
  getCases: () => data.cases,

  getCase: (caseId: string) =>
    data.cases.find((item) => item.id === caseId),

  getWallets: () => data.wallets,

  getWallet: (walletId: string) =>
    data.wallets.find((item) => item.id === walletId),

  getTransactions: () => data.transactions,

  getAlerts: () => data.alerts,

  getRealWalletGraph: async (walletAddress: string) => {
    const response = await fetch(
      `${BACKEND_URL}/api/wallet/${walletAddress}/transactions`
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    return response.json();
  },
};

export type Wallet = (typeof data.wallets)[number];

export type Case = (typeof data.cases)[number];

export type Transaction =
  (typeof data.transactions)[number];
