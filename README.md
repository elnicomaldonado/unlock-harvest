# 🌱 Unlock Harvest - RealFi Cacao Financing Platform

Blockchain-based escrow system providing milestone-based financing for smallholder cacao farmers on the Celo network.

## 🎯 Problem We're Solving

Smallholder cacao farmers face a triple crisis:
- **Financial exclusion**: No access to traditional credit
- **Exploitative value chains**: Farmers receive only 6% of final product value
- **Liquidity gaps**: 5-6 month harvest cycles with zero income

This forces farmers into environmentally devastating decisions—abandoning sustainable cacao or clearing forests.

## 💡 Our Solution

- **Milestone-based smart contract escrows** that release funds automatically
- **Direct pre-purchase agreements** with guaranteed fair prices
- **Cryptographic proof of origin** and environmental impact
- **Dynamic NFTs** tracking crop progress
- **On-chain reputation system** for farmers

## 🏗️ Technology Stack

- **Blockchain**: Celo (EVM-compatible, low gas fees)
- **Smart Contracts**: Solidity 0.8.20 + OpenZeppelin v5
- **Framework**: Thirdweb SDK v5
- **Testing**: Hardhat + Chai
- **Development**: Node.js 18+

## 📦 Smart Contracts

### Core Contracts
- `CacaoEscrow.sol` - Milestone-based escrow logic
- `CacaoHarvestNFT.sol` - Dynamic NFTs for crop traceability
- `FarmerReputationBadge.sol` - Soulbound reputation tokens

### Key Features
- University oracle verification (Nest Lab)
- Satellite monitoring integration
- Gas-optimized for farmers with limited funds
- Immutable environmental data on-chain

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

\`\`\`bash
# Clone the repository
git clone <repo-url>
cd unlock-harvest

# Install dependencies
npm install

# Copy environment template
cp ENV.md .env
# Edit .env with your configuration
\`\`\`

### Configuration

Create a `.env` file with:
\`\`\`
CELO_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org
PRIVATE_KEY=your_private_key_here
ORACLE_ADDRESS=0x...
CELOSCAN_API_KEY=your_api_key
REPORT_GAS=true
\`\`\`

### Development Commands

\`\`\`bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Start local node
npm run node

# Deploy to Alfajores testnet
npm run deploy:alfajores

# Check contract sizes
npm run size

# Generate gas reports
REPORT_GAS=true npm test
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run coverage
\`\`\`

## 📝 Contract Development Guidelines

### Gas Efficiency (Critical!)
- Farmers have limited funds - every gas unit matters
- Use `uint256` over smaller types (unless packing)
- Minimize storage writes
- Use events for non-critical data
- Batch operations where possible

### Security
- Use OpenZeppelin libraries exclusively
- Never write custom crypto logic
- Oracle functions restricted to university address
- All state changes must emit events
- Follow checks-effects-interactions pattern

### Code Style
- One contract, one responsibility
- Clear, descriptive function names
- Comprehensive NatSpec comments
- Test coverage > 90%

## 📁 Project Structure

\`\`\`
unlock-harvest/
├── contracts/          # Solidity smart contracts
│   ├── interfaces/    # Contract interfaces
│   ├── CacaoEscrow.sol
│   ├── CacaoHarvestNFT.sol
│   └── FarmerReputationBadge.sol
├── test/              # Contract tests
├── scripts/           # Deployment scripts
├── docs/              # Documentation
└── hardhat.config.js  # Hardhat configuration
\`\`\`

## 🌍 Networks

### Celo Alfajores (Testnet)
- Chain ID: 44787
- RPC: https://alfajores-forno.celo-testnet.org
- Explorer: https://alfajores.celoscan.io
- Faucet: https://faucet.celo.org

### Celo Mainnet
- Chain ID: 42220
- RPC: https://forno.celo.org
- Explorer: https://celoscan.io

## 🤝 Contributing

This project is built with Cursor AI Agent Mode. Follow the coding patterns in `.cursor/rules/`.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Celo Documentation](https://docs.celo.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Thirdweb SDK](https://portal.thirdweb.com)
- [Hardhat Documentation](https://hardhat.org)

