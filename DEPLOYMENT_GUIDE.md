# 🚀 RealFi Platform - Deployment Guide

Complete guide for deploying the RealFi Cacao Financing Platform to Celo networks.

---

## 📋 Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (see `ENV_EXAMPLE.md`):

```bash
# Required
PRIVATE_KEY=your_deployer_private_key_here
CELOSCAN_API_KEY=your_celoscan_api_key_here

# Optional (uses defaults if not set)
ORACLE_ADDRESS=0x...
CELO_RPC_URL=https://forno.celo.org
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
```

### 3. Fund Your Deployer Wallet

#### Testnet (Alfajores)
- Visit: https://faucet.celo.org/alfajores
- Enter your deployer address
- Receive free testnet CELO

#### Mainnet
- Purchase CELO from an exchange
- Transfer to your deployer wallet
- Ensure you have enough for gas (~$5-10 worth)

---

## 🧪 Local Testing

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Run Tests
```bash
npm test
```

Expected output: **140 tests passing** ✅

### 3. Deploy to Local Network
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

---

## 🌐 Testnet Deployment (Alfajores)

### 1. Verify Configuration
```bash
# Check your deployer balance
npx hardhat run scripts/check-balance.js --network alfajores

# Ensure you have testnet CELO
```

### 2. Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network alfajores
```

This script will:
1. ✅ Deploy CacaoHarvestNFT
2. ✅ Deploy FarmerReputationBadge
3. ✅ Deploy CacaoEscrow
4. ✅ Transfer NFT ownership to Escrow
5. ✅ Accept ownership in Escrow
6. ✅ Configure ReputationBadge with Escrow address
7. ✅ Save addresses to `deployments/alfajores.json`
8. ✅ Automatically verify contracts on Celoscan

### 3. Test Deployment
```bash
npx hardhat run scripts/test-deployment.js --network alfajores
```

### 4. View on Explorer
After deployment, visit:
- **Celoscan (Alfajores)**: https://alfajores.celoscan.io
- Search for your contract addresses

---

## 🏭 Production Deployment (Mainnet)

### ⚠️ Pre-Deployment Checklist

- [ ] All tests passing (140/140)
- [ ] Testnet deployment successful
- [ ] Security audit completed (recommended)
- [ ] Oracle address configured
- [ ] Deployer wallet funded with sufficient CELO
- [ ] Backup of private keys secured
- [ ] Team notified of deployment

### 1. Final Configuration Check

Review `.env`:
```bash
PRIVATE_KEY=your_mainnet_deployer_key
ORACLE_ADDRESS=0x_university_oracle_address
CELOSCAN_API_KEY=your_api_key
```

### 2. Deploy to Mainnet
```bash
npx hardhat run scripts/deploy.js --network celo
```

### 3. Verify Contracts
If auto-verification fails, manually verify:

```bash
# CacaoHarvestNFT
npx hardhat verify --network celo <HARVEST_NFT_ADDRESS> <ORACLE_ADDRESS>

# FarmerReputationBadge  
npx hardhat verify --network celo <BADGE_ADDRESS> <DEPLOYER_ADDRESS>

# CacaoEscrow
npx hardhat verify --network celo <ESCROW_ADDRESS> <CUSD_ADDRESS> <ORACLE_ADDRESS> <NFT_ADDRESS> <BADGE_ADDRESS>
```

### 4. Post-Deployment Steps

1. **Save Addresses**: Backup `deployments/celo.json`
2. **Document Deployment**: Update team documentation
3. **Configure Frontend**: Update frontend with contract addresses
4. **Oracle Setup**: Provide oracle with necessary access
5. **Monitor**: Set up monitoring and alerts

---

## 📁 Deployment Artifacts

After deployment, you'll find:

```
deployments/
├── localhost.json    # Local deployment addresses
├── alfajores.json    # Testnet deployment addresses
└── celo.json         # Mainnet deployment addresses
```

Each file contains:
```json
{
  "network": "alfajores",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "addresses": {
    "deployer": "0x...",
    "oracle": "0x...",
    "cUSD": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    "harvestNFT": "0x...",
    "reputationBadge": "0x...",
    "escrow": "0x..."
  }
}
```

---

## 🔍 Contract Verification

### Automatic Verification
The deployment script attempts automatic verification on Alfajores.

### Manual Verification
If automatic verification fails:

```bash
# Get deployed addresses
cat deployments/alfajores.json

# Verify each contract
npx hardhat verify --network alfajores <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Verification Status
Check on Celoscan:
- Alfajores: https://alfajores.celoscan.io/address/<CONTRACT_ADDRESS>
- Mainnet: https://celoscan.io/address/<CONTRACT_ADDRESS>

Look for ✅ green checkmark next to contract name.

---

## 🛠️ Useful Commands

### Check Deployment
```bash
# View deployed addresses
cat deployments/alfajores.json | jq '.addresses'

# Check contract owner
npx hardhat console --network alfajores
> const escrow = await ethers.getContractAt("CacaoEscrow", "0x...")
> await escrow.owner()
```

### Interact with Contracts
```bash
# Start Hardhat console
npx hardhat console --network alfajores

# Load contracts
const deployment = require('./deployments/alfajores.json')
const escrow = await ethers.getContractAt("CacaoEscrow", deployment.addresses.escrow)
const nft = await ethers.getContractAt("CacaoHarvestNFT", deployment.addresses.harvestNFT)

# Query contract
await escrow.totalEscrows()
await nft.totalHarvests()
```

### Update Oracle Address
If you need to change the oracle after deployment:

⚠️ **Note**: Oracle address is **immutable** in CacaoHarvestNFT and CacaoEscrow. This is by design for security. If you need to change it, you must redeploy.

---

## 🔒 Security Considerations

### Private Key Management
- ✅ Use dedicated deployer wallet
- ✅ Never commit `.env` to git
- ✅ Use hardware wallet for mainnet
- ✅ Limit funds in deployer wallet
- ✅ Rotate keys after deployment

### Access Control
- ✅ Oracle address is immutable (set in constructor)
- ✅ CacaoHarvestNFT owned by CacaoEscrow
- ✅ FarmerReputationBadge escrow is configurable by owner
- ✅ CacaoEscrow is pausable by owner

### Contract Verification
- ✅ Always verify on Celoscan
- ✅ Confirm constructor args match
- ✅ Review verified source code

---

## 🐛 Troubleshooting

### "Insufficient funds for gas"
- Fund your deployer wallet with more CELO
- Check balance: `npx hardhat run scripts/check-balance.js`

### "Nonce too low"
- Reset your wallet nonce
- Use `--reset` flag or clear cache

### "Contract verification failed"
- Wait 30 seconds and try again
- Verify manually with correct constructor args
- Check API key is valid

### "Error: network does not support ENS"
- This is a warning, can be ignored
- Contracts will still deploy successfully

### "Transaction underpriced"
- Increase gas price in `hardhat.config.js`
- Wait for network congestion to clear

---

## 📊 Gas Costs (Estimated)

| Operation | Alfajores | Mainnet |
|-----------|-----------|---------|
| CacaoHarvestNFT | ~0.05 CELO | ~0.05 CELO |
| FarmerReputationBadge | ~0.08 CELO | ~0.08 CELO |
| CacaoEscrow | ~0.06 CELO | ~0.06 CELO |
| **Total Deployment** | **~0.2 CELO** | **~0.2 CELO** |

*Costs vary based on network congestion*

---

## 📞 Support

### Issues?
- Check `TROUBLESHOOTING.md`
- Review Hardhat docs: https://hardhat.org
- Celo docs: https://docs.celo.org

### Contract Addresses
- **cUSD**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` (Mainnet & Alfajores)
- **Celoscan**: https://celoscan.io
- **Alfajores Explorer**: https://alfajores.celoscan.io

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Contracts compiled without errors
- [ ] All 140 tests passing
- [ ] Environment variables configured
- [ ] Deployer wallet funded
- [ ] Oracle address confirmed

### Deployment
- [ ] Deployed to testnet first
- [ ] Contracts verified on Celoscan
- [ ] Test deployment script passed
- [ ] Addresses saved to `deployments/`

### Post-Deployment
- [ ] Contract ownership verified
- [ ] Oracle can approve milestones
- [ ] Frontend updated with addresses
- [ ] Team notified
- [ ] Monitoring configured

---

## 🎉 Success!

Once deployed, your RealFi Cacao Financing Platform is ready to:
- ✅ Accept investor funds in escrow
- ✅ Track farmer harvests with NFTs
- ✅ Build farmer reputations on-chain
- ✅ Release funds based on verified milestones
- ✅ Reward environmental stewardship

**Welcome to the future of agricultural financing!** 🌱

