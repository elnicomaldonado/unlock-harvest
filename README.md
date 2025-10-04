# 🌱 Unlock Harvest - RealFi Cacao Financing Platform

**Blockchain-based milestone financing for smallholder cacao farmers with on-chain reputation and environmental sustainability tracking.**

[![Tests](https://img.shields.io/badge/tests-140%20passing-brightgreen)](./test)
[![Network](https://img.shields.io/badge/network-Celo-yellow)](https://celo.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)

## 🚀 Live Deployment (Celo Sepolia Testnet)

**⚠️ Migration to Celo Sepolia Complete**

| Contract | Address | Explorer |
|----------|---------|----------|
| **CacaoHarvestNFT** | _Deploy to get address_ | [Blockscout](https://celo-sepolia.blockscout.com) |
| **FarmerReputationBadge** | _Deploy to get address_ | [Blockscout](https://celo-sepolia.blockscout.com) |
| **CacaoEscrow** | _Deploy to get address_ | [Blockscout](https://celo-sepolia.blockscout.com) |

**Network Details:**
- Chain ID: `11142220`
- RPC: `https://forno.celo.org/celo-sepolia`
- Faucet: https://faucet.celo.org
- Minimum Escrow: `0.01 cUSD` (reduced for testing)

## 🎯 Problem

Smallholder cacao farmers face critical barriers:
- No access to traditional credit without collateral
- Receive only 6% of final chocolate product value
- 5-6 month liquidity gaps between planting and harvest
- Environmental pressure forcing deforestation

## 💡 Solution

A complete RealFi platform on Celo blockchain providing:

### Milestone-Based Smart Escrows
- Investor funds locked in secure contracts
- Automatic 25% releases at each verified milestone
- Gas-optimized (~$0.01 per cycle)

### Dynamic NFT Harvest Tracking
Each harvest receives a unique NFT evolving through stages:
- 🌍 Land Verified → 🌱 Planted → 🌿 Mid-Growth → 🍫 Harvested

### Soulbound Reputation System
Non-transferable on-chain credit scores:
- +25 points per milestone completion
- +50 points for zero-deforestation
- +30 points for premium quality
- -100 points for violations
- 4 tiers: 🥉 Bronze → 🥈 Silver → 🥇 Gold → 💎 Platinum

### Oracle Verification Network
Milestones verified by agricultural experts and university labs combining:
- 🛰️ Satellite monitoring for deforestation detection
- 👨‍🌾 Field inspections by certified agronomists
- 📊 Data validation through university research labs
- ⛓️ On-chain attestations via oracle signatures

## 🛠️ Tech Stack

- Blockchain: Celo (carbon-negative)
- Smart Contracts: Solidity 0.8.20 + OpenZeppelin v5
- Testing: Hardhat + Chai (140 tests, 100% coverage)
- Token: cUSD stablecoin

## 📦 Installation

git clone https://github.com/elnicomaldonado/unlock-harvest.git
cd unlock-harvest
npm install
npm test

text

## 📊 Key Metrics

- Tests: 140 passing (100%)
- Gas Cost: ~$0.01 per harvest cycle
- Contract Size: 26.6 KiB optimized
- Loan Range: $100 - $100,000 cUSD

## 🌍 Impact

Environmental: Satellite-verified deforestation tracking
Social: Financial inclusion for unbanked farmers
Economic: Direct farmer-investor connections

## 📄 License

Copyright (c) 2025 Nico Maldonado. All Rights Reserved.

Built with ❤️ for smallholder farmers worldwide.

**⭐ Star this repo to support farmers through blockchain!**
