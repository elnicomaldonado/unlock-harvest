# Migration to Celo Sepolia Testnet - Complete

## ✅ Migration Summary

**Date:** October 4, 2025  
**From:** Celo Alfajores Testnet (Chain ID: 44787)  
**To:** Celo Sepolia Testnet (Chain ID: 11142220)

---

## 🔄 Changes Made

### 1. Network Configuration (hardhat.config.js)

**BEFORE:**
```javascript
alfajores: {
  url: "https://alfajores-forno.celo-testnet.org",
  chainId: 44787,
}
```

**AFTER:**
```javascript
"celo-sepolia": {
  url: "https://forno.celo.org/celo-sepolia",
  chainId: 11142220,
  gasPrice: 1000000000, // 1 gwei
}
```

**Explorer Update:**
- **Old:** https://alfajores.celoscan.io (Celoscan)
- **New:** https://celo-sepolia.blockscout.com (Blockscout - no API key needed)

---

### 2. Minimum Escrow Amount (contracts/CacaoEscrow.sol)

**BEFORE:**
```solidity
uint256 public constant MIN_ESCROW_AMOUNT = 100 * 10**18; // 100 cUSD
```

**AFTER:**
```solidity
uint256 public constant MIN_ESCROW_AMOUNT = 1 * 10**16; // 0.01 cUSD
```

**Reason:** Lower barrier for testing and farmer accessibility on testnet.

---

### 3. Test Suite Updates (test/CacaoEscrow.test.js)

**Updated constant:**
```javascript
const MIN_ESCROW_AMOUNT = ethers.parseUnits("0.01", 18) // 0.01 cUSD
```

**Updated test case:**
```javascript
const tooLow = ethers.parseUnits("0.009", 18) // Below 0.01 cUSD minimum
```

**Result:** ✅ All 140 tests passing

---

### 4. Deployment Scripts

**scripts/deploy.js:**
- Updated cUSD address mapping for `celo-sepolia`
- Ready to deploy to new network

**scripts/check-balance.js:**
- Updated faucet links
- Updated explorer URLs to Blockscout
- Updated network name to "Celo Sepolia"

---

### 5. Documentation Updates

**Files Updated:**
- `README.md` - Network info and deployment table
- `ENV_EXAMPLE.md` - RPC endpoints and network details
- `hardhat.config.js` - Network configuration and explorer config

**Network Details Added:**
- Chain ID: 11142220
- RPC: https://forno.celo.org/celo-sepolia
- Explorer: https://celo-sepolia.blockscout.com
- Faucet: https://faucet.celo.org
- Minimum Escrow: 0.01 cUSD

---

## 📊 Contract Changes Summary

| Contract | Size Change | Impact |
|----------|-------------|--------|
| CacaoEscrow | -0.004 KiB | ✅ Slight optimization |
| CacaoHarvestNFT | No change | ✅ No impact |
| FarmerReputationBadge | No change | ✅ No impact |

---

## 🚀 Deployment Instructions

### Step 1: Get Testnet CELO
```bash
# Visit the faucet
https://faucet.celo.org

# Select "Celo Sepolia Testnet"
# Enter your wallet address
# Receive free testnet CELO
```

### Step 2: Update Environment Variables
```bash
# Create/update .env file
PRIVATE_KEY=your_private_key_here
CELO_SEPOLIA_RPC=https://forno.celo.org/celo-sepolia
ORACLE_ADDRESS=your_oracle_address_here
```

### Step 3: Check Balance
```bash
npx hardhat run scripts/check-balance.js --network celo-sepolia
```

### Step 4: Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network celo-sepolia
```

### Step 5: Verify Deployment
Contracts will automatically be verified on Blockscout during deployment.

Check your deployments at:
```
/Users/fundacionfuturo/unlock-harvest/deployments/celo-sepolia.json
```

---

## 🔍 Network Comparison

| Feature | Alfajores (Old) | Celo Sepolia (New) |
|---------|----------------|-------------------|
| **Chain ID** | 44787 | 11142220 |
| **RPC URL** | alfajores-forno.celo-testnet.org | forno.celo.org/celo-sepolia |
| **Explorer** | Celoscan | Blockscout |
| **API Key** | Required | Not required |
| **Status** | Being phased out | Current testnet |
| **Faucet** | faucet.celo.org/alfajores | faucet.celo.org |
| **Min Escrow** | 100 cUSD | 0.01 cUSD |

---

## ⚠️ Important Notes

### Old Alfajores Deployments
The following contracts were deployed on Alfajores and are **NO LONGER ACTIVE**:

- **CacaoHarvestNFT:** 0xd86aa1347FAC13D4673a3CA346b7C8a39F4465d3
- **FarmerReputationBadge:** 0x82dA5C8997037588c18250EeD881857134dC9863
- **CacaoEscrow:** 0x95bc8aEe1FF04EdB02062F2c2dbEB92E0b074f83

These addresses are preserved for historical reference only.

### Fresh Start
Celo Sepolia is a **fresh network** with no state from Alfajores:
- All contracts must be re-deployed
- All escrows must be recreated
- All farmer reputation scores start at zero
- This is expected and intentional for the migration

### Environment Configuration
Update your `.env` file with new RPC endpoints:
```bash
CELO_SEPOLIA_RPC=https://forno.celo.org/celo-sepolia
```

---

## ✅ Verification Checklist

- [x] Network configuration updated in hardhat.config.js
- [x] Minimum escrow amount reduced to 0.01 cUSD
- [x] All tests updated and passing (140/140)
- [x] Deployment scripts updated
- [x] Documentation updated
- [x] Explorer links updated to Blockscout
- [x] Contract compilation successful
- [ ] Deploy to Celo Sepolia (next step)
- [ ] Update README with new contract addresses
- [ ] Test end-to-end flow on new network

---

## 🎯 Next Steps

1. **Deploy to Celo Sepolia:**
   ```bash
   npx hardhat run scripts/deploy.js --network celo-sepolia
   ```

2. **Test Deployment:**
   ```bash
   npx hardhat run scripts/test-deployment.js --network celo-sepolia
   ```

3. **Update README.md** with new contract addresses after deployment

4. **Test Full Flow:**
   - Create test escrow with 0.01 cUSD
   - Verify oracle can approve milestones
   - Check reputation system updates
   - Verify NFT metadata updates

---

## 📚 Resources

- **Celo Sepolia Docs:** https://docs.celo.org/network/sepolia
- **Blockscout Explorer:** https://celo-sepolia.blockscout.com
- **Celo Faucet:** https://faucet.celo.org
- **Celo Discord:** https://chat.celo.org (for support)

---

## 🎉 Migration Complete!

All code has been successfully migrated to Celo Sepolia testnet. The platform is ready for deployment with:

- ✅ Reduced minimum escrow (0.01 cUSD) for easier testing
- ✅ Updated network configuration for Celo Sepolia
- ✅ All 140 tests passing
- ✅ Deployment scripts ready
- ✅ Documentation updated

**Ready to deploy!** 🚀

