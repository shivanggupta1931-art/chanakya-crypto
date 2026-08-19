require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Alchemy, Network } = require("alchemy-sdk");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ======================================
// ENVIRONMENT
// ======================================

if (!process.env.ALCHEMY_API_KEY) {
  console.error("❌ ALCHEMY_API_KEY is missing from .env");
  process.exit(1);
}

if (!process.env.SCORECHAIN_API_KEY) {
  console.error("❌ SCORECHAIN_API_KEY is missing from .env");
  process.exit(1);
}

// ======================================
// ALCHEMY
// ======================================

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
});

// ======================================
// HELPERS
// ======================================

function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function normalizeAddress(address) {
  return address?.toLowerCase();
}

// ======================================
// FETCH WALLET TRANSFERS
// ======================================

async function getWalletTransfers(address) {
  const categories = [
    "external",
    "internal",
    "erc20",
    "erc721",
    "erc1155",
  ];

  async function fetchDirection(direction) {
    const results = [];
    let pageKey;

    for (let page = 0; page < 5; page++) {
      const params = {
        fromBlock: "0x0",
        toBlock: "latest",
        category: categories,
        withMetadata: true,
        maxCount: "0x3e8",
        order: "desc",
      };

      if (direction === "outgoing") {
        params.fromAddress = address;
      } else {
        params.toAddress = address;
      }

      if (pageKey) {
        params.pageKey = pageKey;
      }

      const response =
        await alchemy.core.getAssetTransfers(params);

      results.push(...response.transfers);

      if (!response.pageKey) {
        break;
      }

      pageKey = response.pageKey;
    }

    return results;
  }

  const [outgoing, incoming] = await Promise.all([
    fetchDirection("outgoing"),
    fetchDirection("incoming"),
  ]);

  // Remove duplicates
  const map = new Map();

  [...outgoing, ...incoming].forEach((tx) => {
    const key =
      tx.uniqueId ||
      `${tx.hash}:${tx.from}:${tx.to}:${tx.category}`;

    map.set(key, tx);
  });

  return Array.from(map.values());
}

function mapTransaction(tx) {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    asset: tx.asset,
    category: tx.category,
    blockNum: tx.blockNum,
    blockTimestamp:
      tx.metadata?.blockTimestamp || null,
  };
}

// ======================================
// SCORECHAIN
// ======================================

async function checkScorechain(address) {
  const response = await fetch(
    `https://sanctions.api.scorechain.com/v1/addresses/${address}`,
    {
      method: "GET",
      headers: {
        "x-api-key": process.env.SCORECHAIN_API_KEY,
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Scorechain returned ${response.status}: ${JSON.stringify(
        data
      )}`
    );
  }

  return {
    sanctioned:
      data?.isSanctioned === true ||
      data?.[0]?.isSanctioned === true,

    details:
      data?.details ||
      data?.[0]?.details ||
      null,

    raw: data,
  };
}

// ======================================
// CHANAKYA RISK ENGINE
// ======================================

function calculateRisk(
  transactions,
  address,
  sanctioned
) {
  const wallet = normalizeAddress(address);

  const counterparties = new Set();

  let incomingCount = 0;
  let outgoingCount = 0;

  let incomingEth = 0;
  let outgoingEth = 0;

  let highValueTransfers = 0;
  let contractInteractions = 0;

  const timestamps = [];

  const outgoingCounterpartyCounts = new Map();

  transactions.forEach((tx) => {
    const from = normalizeAddress(tx.from);
    const to = normalizeAddress(tx.to);

    const value =
      typeof tx.value === "number"
        ? tx.value
        : 0;

    // -------------------------------
    // OUTGOING
    // -------------------------------

    if (from === wallet) {
      outgoingCount++;

      if (to && to !== wallet) {
        counterparties.add(to);

        outgoingCounterpartyCounts.set(
          to,
          (outgoingCounterpartyCounts.get(to) || 0) + 1
        );
      }

      if (tx.asset === "ETH") {
        outgoingEth += value;
      }
    }

    // -------------------------------
    // INCOMING
    // -------------------------------

    if (to === wallet) {
      incomingCount++;

      if (from && from !== wallet) {
        counterparties.add(from);
      }

      if (tx.asset === "ETH") {
        incomingEth += value;
      }
    }

    // -------------------------------
    // CONTRACT INTERACTIONS
    // -------------------------------

    if (
      tx.category === "erc20" ||
      tx.category === "erc721" ||
      tx.category === "erc1155" ||
      tx.category === "internal"
    ) {
      contractInteractions++;
    }

    // -------------------------------
    // HIGH VALUE TRANSFERS
    // -------------------------------

    if (
      tx.asset === "ETH" &&
      value >= 10
    ) {
      highValueTransfers++;
    }

    // -------------------------------
    // TIMESTAMPS
    // -------------------------------

    if (tx.blockTimestamp) {
      const time = new Date(
        tx.blockTimestamp
      ).getTime();

      if (!Number.isNaN(time)) {
        timestamps.push(time);
      }
    }
  });

  // ======================================
  // RAPID ACTIVITY
  // ======================================

  timestamps.sort((a, b) => a - b);

  let rapidActivity = false;

  for (
    let i = 0;
    i < timestamps.length;
    i++
  ) {
    let j = i + 1;

    while (
      j < timestamps.length &&
      timestamps[j] - timestamps[i] <=
        10 * 60 * 1000
    ) {
      j++;
    }

    if (j - i >= 5) {
      rapidActivity = true;
      break;
    }
  }

  // ======================================
  // REPEATED COUNTERPARTY
  // ======================================

  let repeatedCounterparty = false;

  for (
    const count of
    outgoingCounterpartyCounts.values()
  ) {
    if (count >= 5) {
      repeatedCounterparty = true;
      break;
    }
  }

  // ======================================
  // RISK SCORE
  // ======================================

  let score = 0;

  const riskFactors = [];

  function addRiskFactor(
    name,
    points,
    description
  ) {
    score += points;

    riskFactors.push({
      factor: name,
      points,
      description,
    });
  }

  // Transaction activity

  if (transactions.length >= 1000) {
    addRiskFactor(
      "Very high transaction activity",
      20,
      `${transactions.length}+ transfers were observed.`
    );
  } else if (transactions.length >= 250) {
    addRiskFactor(
      "High transaction activity",
      15,
      `${transactions.length} transfers were observed.`
    );
  } else if (transactions.length >= 100) {
    addRiskFactor(
      "Elevated transaction activity",
      10,
      `${transactions.length} transfers were observed.`
    );
  } else if (transactions.length >= 25) {
    addRiskFactor(
      "Moderate transaction activity",
      5,
      `${transactions.length} transfers were observed.`
    );
  }

  // Counterparty network

  if (counterparties.size >= 50) {
    addRiskFactor(
      "Large counterparty network",
      20,
      `${counterparties.size} unique counterparties were identified.`
    );
  } else if (counterparties.size >= 25) {
    addRiskFactor(
      "Expanded counterparty network",
      15,
      `${counterparties.size} unique counterparties were identified.`
    );
  } else if (counterparties.size >= 10) {
    addRiskFactor(
      "Multiple counterparties",
      8,
      `${counterparties.size} unique counterparties were identified.`
    );
  }

  // High-value ETH movements

  if (highValueTransfers >= 10) {
    addRiskFactor(
      "Frequent high-value transfers",
      20,
      `${highValueTransfers} ETH transfers of at least 10 ETH were observed.`
    );
  } else if (highValueTransfers >= 5) {
    addRiskFactor(
      "Multiple high-value transfers",
      15,
      `${highValueTransfers} ETH transfers of at least 10 ETH were observed.`
    );
  } else if (highValueTransfers >= 2) {
    addRiskFactor(
      "High-value transfer activity",
      8,
      `${highValueTransfers} ETH transfers of at least 10 ETH were observed.`
    );
  }

  // Contract interaction

  if (contractInteractions >= 100) {
    addRiskFactor(
      "Heavy contract interaction",
      10,
      `${contractInteractions} contract/internal interactions were observed.`
    );
  } else if (contractInteractions >= 25) {
    addRiskFactor(
      "Significant contract interaction",
      6,
      `${contractInteractions} contract/internal interactions were observed.`
    );
  }

  // Rapid movement

  if (rapidActivity) {
    addRiskFactor(
      "Rapid transaction activity",
      12,
      "At least 5 transfers occurred within a 10-minute window."
    );
  }

  // Repeated counterparty

  if (repeatedCounterparty) {
    addRiskFactor(
      "Repeated counterparty interaction",
      8,
      "Multiple transfers were repeatedly sent to the same counterparty."
    );
  }

  // Incoming/outgoing imbalance

  if (
    incomingCount >= 5 &&
    outgoingCount >= 5
  ) {
    const ratio =
      Math.min(
        incomingCount,
        outgoingCount
      ) /
      Math.max(
        incomingCount,
        outgoingCount
      );

    if (ratio < 0.25) {
      addRiskFactor(
        "Strong flow imbalance",
        6,
        "Incoming/outgoing activity is highly imbalanced."
      );
    }
  }

  // ======================================
  // SCORECHAIN SIGNAL
  // ======================================

  if (sanctioned) {
    addRiskFactor(
      "Scorechain sanctions match",
      50,
      "Scorechain reported the wallet as sanctioned."
    );
  }

  score = Math.min(
    Math.round(score),
    100
  );

  let riskLevel = "LOW";

  if (score >= 75) {
    riskLevel = "CRITICAL";
  } else if (score >= 50) {
    riskLevel = "HIGH";
  } else if (score >= 25) {
    riskLevel = "MEDIUM";
  }

  return {
    score,
    level: riskLevel,

    metrics: {
      transactions: transactions.length,
      linkedAccounts: counterparties.size,
      incomingTransactions: incomingCount,
      outgoingTransactions: outgoingCount,

      incomingEth: Number(
        incomingEth.toFixed(6)
      ),

      outgoingEth: Number(
        outgoingEth.toFixed(6)
      ),

      totalEth: Number(
        (
          incomingEth +
          outgoingEth
        ).toFixed(6)
      ),

      highValueTransfers,
      contractInteractions,
      rapidActivity,
      repeatedCounterparty,
    },

    sanctions: {
      matched: sanctioned,
    },

    riskFactors:
      riskFactors.sort(
        (a, b) => b.points - a.points
      ),
  };
}

// ======================================
// HEALTH CHECK
// ======================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Chanakya Crypto API",
    network: "Ethereum Mainnet",
    alchemy: "ready",
    scorechain: "ready",
    riskEngine: "ready",
  });
});

// ======================================
// REAL WALLET TRANSACTIONS
// ======================================

app.get(
  "/api/wallet/:address/transactions",
  async (req, res) => {
    try {
      const { address } = req.params;

      if (!isValidEthereumAddress(address)) {
        return res.status(400).json({
          error:
            "Invalid Ethereum wallet address",
        });
      }

      const transfers =
        await getWalletTransfers(address);

      res.json({
        wallet: address,
        network: "ethereum-mainnet",
        count: transfers.length,
        transactions:
          transfers.map(mapTransaction),
      });

    } catch (error) {
      console.error(
        "Alchemy error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch blockchain data",
        details: error.message,
      });
    }
  }
);

// ======================================
// SCORECHAIN SANCTIONS
// ======================================

app.get(
  "/api/wallet/:address/sanctions",
  async (req, res) => {
    try {
      const { address } = req.params;

      if (!isValidEthereumAddress(address)) {
        return res.status(400).json({
          error:
            "Invalid Ethereum wallet address",
        });
      }

      const result =
        await checkScorechain(address);

      res.json({
        wallet: address,
        provider: "Scorechain",
        sanctioned: result.sanctioned,
        details: result.details,
        raw: result.raw,
      });

    } catch (error) {
      console.error(
        "Scorechain error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to check sanctions",
        details: error.message,
      });
    }
  }
);

// ======================================
// CHANAKYA RISK ANALYSIS
// ======================================

app.get(
  "/api/wallet/:address/risk",
  async (req, res) => {
    try {
      const { address } = req.params;

      if (!isValidEthereumAddress(address)) {
        return res.status(400).json({
          error:
            "Invalid Ethereum wallet address",
        });
      }

      // Fetch real blockchain data
      const transactions =
        await getWalletTransfers(address);

      // Fetch real Scorechain sanctions data
      const scorechain =
        await checkScorechain(address);

      // Calculate Chanakya risk
      const risk =
        calculateRisk(
          transactions,
          address,
          scorechain.sanctioned
        );

      res.json({
        wallet: address,

        provider:
          "Chanakya Risk Engine",

        score: risk.score,

        level: risk.level,

        metrics: risk.metrics,

        sanctions: risk.sanctions,

        riskFactors:
          risk.riskFactors,

        scorechain: {
          sanctioned:
            scorechain.sanctioned,

          details:
            scorechain.details,
        },
      });

    } catch (error) {
      console.error(
        "Risk engine error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to calculate wallet risk",

        details:
          error.message,
      });
    }
  }
);

// ======================================
// START SERVER
// ======================================

app.listen(PORT,"0.0.0.0", () => {
  console.log(
    "======================================"
  );

  console.log(
    "       CHANAKYA CRYPTO API"
  );

  console.log(
    "======================================"
  );

  console.log(
    "Network: Ethereum Mainnet"
  );

  console.log(
    `Port: ${PORT}`
  );

  console.log(
    "Alchemy: READY"
  );

  console.log(
    "Scorechain: READY"
  );

  console.log(
    "Risk Engine: READY"
  );

  console.log(
    "======================================"
  );
});