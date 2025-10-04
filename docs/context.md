# PROJECT CONTEXT: RealFi Cacao Financing Platform

## Problem Statement (Jobs-to-be-Done Framework)

FOR: Smallholder cacao farmers producing high-quality export-grade cacao

WHO: Are trapped in 5-6 month harvest cycles with zero income between harvests, cannot access traditional banking credit due to lack of collateral and formal financial history, and are selling through multi-layered intermediary chains that capture 94% of the final product value (farmers receive only 6% of what a chocolate bar sells for in international markets)

THE PROBLEM IS: Financial exclusion combined with exploitative value chains creates chronic liquidity crises that force economically rational but environmentally devastating decisions—farmers are actively considering abandoning sustainable cacao cultivation or clearing additional forest land to increase production volume as their only pathways to economic survival

WHICH IMPACTS:
- Economic: Perpetual poverty despite producing premium export goods; inability to invest in farm improvements during multi-month income gaps
- Social: Active crop abandonment and rural migration as farming becomes economically unviable
- Environmental: Direct deforestation risk as farmers clear land to compensate for low per-unit returns

A SUCCESSFUL SOLUTION WOULD: Eliminate the trust barrier through milestone-based smart contract escrows that hold funds securely and release them automatically as farmers hit verified production stages, enable direct pre-purchase agreements where premium buyers guarantee fair prices upfront, and give end consumers cryptographic proof of origin and environmental impact

## Technical Architecture

### Core System (Already Built):
- Milestone-based escrow smart contracts on Celo blockchain
- University oracle (Nest Lab) for verification
- Satellite monitoring integration
- Frontend dashboard for farmers and investors

### NEW FEATURES TO IMPLEMENT:
1. **Dynamic NFTs**: NFTs that update their metadata as crop progresses through milestones
2. **Reputation Score**: On-chain credit scoring system for farmers

## Technology Stack:
- Blockchain: Celo (EVM-compatible)
- Smart Contracts: Solidity
- Framework: Thirdweb SDK
- Frontend: React/Next.js
- Development: Cursor AI Agent Mode

## Key Requirements:
- Must work with existing escrow contract structure
- Oracle updates must be restricted to university address
- All changes must be immutable and timestamped
- Gas-efficient (farmers have limited funds)
- Simple UI for non-technical users
