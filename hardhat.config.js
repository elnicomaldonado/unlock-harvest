require("@nomicfoundation/hardhat-toolbox")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv/config")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for deployment cost vs runtime cost balance
      },
      viaIR: true, // Required for complex string operations in FarmerReputationBadge
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      // Forking Celo Sepolia for local testing (optional)
      // forking: {
      //   url: process.env.CELO_SEPOLIA_RPC || "https://forno.celo.org/celo-sepolia",
      // },
    },
    "celo-sepolia": {
      url: process.env.CELO_SEPOLIA_RPC || "https://forno.celo-sepolia.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11142220,
      gas: "auto",
      gasPrice: 50000000000, // 50 gwei - increased for Celo Sepolia
    },
    celo: {
      url: process.env.CELO_MAINNET_RPC || "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
      gas: "auto",
      gasPrice: "auto",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "CELO",
    gasPriceApi: "https://api.celoscan.io/api?module=proxy&action=eth_gasPrice",
    showTimeSpent: true,
    showMethodSig: true,
    excludeContracts: ["test/"],
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    // Warn if contract exceeds 24kb (EIP-170 limit is 24.576kb)
    except: ["test/", "mock/"],
  },
  etherscan: {
    apiKey: {
      "celo-sepolia": "BLOCKSCOUT", // Blockscout doesn't require API key
      celo: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celo-sepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://celo-sepolia.blockscout.com/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000, // 40 seconds for blockchain operations
  },
}

