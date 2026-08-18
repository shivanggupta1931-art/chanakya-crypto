# CHANAKYA-CRYPTO

Frontend-first MVP for a Chandigarh Police Cyber Crime Cell cryptocurrency investigation workstation.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
```

## What is included

- Dashboard with investigation metrics
- Animated multi-hop React Flow transaction graph
- Clickable wallet intelligence drawer
- Risk score and intelligence tags
- Case / FIR vault
- Scam & mixer intelligence
- Light / Dark / AMOLED themes
- Plain-English "Explain this flow" demo
- Evidence dossier preview
- One-click PDF generation using jsPDF + html2canvas
- Central mock-data provider designed for later API replacement

## Data boundary

All information is mock/demo data. Wallet labels and relationships are synthetic and must not be presented as real investigative intelligence.

## Future API swap

Replace the methods in `src/lib/api.ts` with REST/Bitquery/Etherscan/database calls while keeping UI components unchanged.