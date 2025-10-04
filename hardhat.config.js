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
      // Forking Celo Alfajores for local testing (optional)
      // forking: {
      //   url: process.env.CELO_ALFAJORES_RPC || "https://alfajores-forno.celo-testnet.org",
      // },
    },
    alfajores: {
      url: process.env.CELO_ALFAJORES_RPC || "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 44787,
      gas: "auto",
      gasPrice: "auto",
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
      alfajores: process.env.CELOSCAN_API_KEY || "",
      celo: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
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

