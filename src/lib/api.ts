import data from "../data/mockData.json";

export const api = {
  getCases: () => data.cases,
  getCase: (caseId: string) => data.cases.find((item) => item.id === caseId),
  getWallets: () => data.wallets,
  getWallet: (walletId: string) => data.wallets.find((item) => item.id === walletId),
  getTransactions: () => data.transactions,
  getAlerts: () => data.alerts
};

export type Wallet = (typeof data.wallets)[number];
export type Case = (typeof data.cases)[number];
export type Transaction = (typeof data.transactions)[number];