require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Alchemy, Network } = require("alchemy-sdk");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

if (!process.env.ALCHEMY_API_KEY) {
  console.error("❌ ALCHEMY_API_KEY is missing from .env");
  process.exit(1);
}

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Chanakya Crypto API",
    network: "Ethereum Mainnet",
  });
});

// Get real wallet transactions
app.get("/api/wallet/:address/transactions", async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: "Invalid Ethereum wallet address",
      });
    }

    const transfers = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: address,
      category: [
        "external",
        "erc20",
        "erc721",
        "erc1155",
      ],
      withMetadata: true,
      maxCount: "0x64",
      order: "desc",
    });

    res.json({
      wallet: address,
      network: "ethereum-mainnet",
      count: transfers.transfers.length,
      transactions: transfers.transfers.map((tx) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        asset: tx.asset,
        category: tx.category,
        blockNum: tx.blockNum,
        blockTimestamp: tx.metadata?.blockTimestamp || null,
      })),
    });
  } catch (error) {
    console.error("Alchemy error:", error);

    res.status(500).json({
      error: "Failed to fetch blockchain data",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("======================================");
  console.log("       CHANAKYA CRYPTO API");
  console.log("======================================");
  console.log(`Network: Ethereum Mainnet`);
  console.log(`Port: ${PORT}`);
  console.log("Alchemy: READY");
  console.log("======================================");
});