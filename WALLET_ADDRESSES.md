# 🔑 Wallet Addresses - Unlock Harvest v2.0

## 📋 Testnet Wallets (Celo Sepolia)

### 1. Deployer Wallet
**Address:** `0xA58809476a2CCBa71A53B3f3C2d984Db673238dD`
**Role:** Deployer & Farmer (for testing)
**Usage:** 
- Deploys all smart contracts
- Acts as farmer in demo scenarios
- Creates farmer applications

### 2. Oracle Wallet  
**Address:** `0x751E3EF3858102230FcbFcbaD0B212a4235DF59C`
**Role:** Oracle (University - Nest Lab)
**Usage:**
- Approves milestones in escrows
- Verifies harvest quality
- Triggers insurance claims
- Monitors weather conditions

### 3. Buyer/Investor Wallet
**Address:** `0x86115145f2305FD6d86A84c86E84f4E72129ebCD`
**Role:** Buyer (Chocolate companies, cooperatives)
**Usage:**
- Creates purchase commitments
- Approves farmer applications
- Funds escrows
- Receives harvest deliveries

## 🏗️ Deployed Contract Addresses

### Core Contracts (Celo Sepolia)
| Contract | Address | Status |
|----------|---------|--------|
| **CacaoEscrow** | `0x4B0291561f3Bc9cd7a72f4124E10020444f3a15d` | ✅ **NEW** (Bug Fixed) |
| **CommitmentMarketplace** | `0x5e3b189eA42c90d23796Ee21e44f56b8B219e48a` | ✅ **NEW** (Updated) |
| **FarmerReputationBadge** | `0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c` | ✅ **ACTIVE** |
| **CacaoHarvestNFT** | `0xB28e3a03A73Ee67604F019C56E27382b133240Bb` | ✅ **ACTIVE** |

### Token Addresses
| Token | Address | Decimals |
|-------|---------|----------|
| **USDC** | `0x456a3D042C0DbD3db53D5489e98dFb038553B0d0` | 6 |

### Network Configuration
- **Network:** Celo Sepolia Testnet
- **Chain ID:** 11142220
- **RPC:** https://forno.celo.org/celo-sepolia
- **Explorer:** https://celo-sepolia.blockscout.com

## 🔄 Contract Interactions

### Deployer → Farmer Flow
```
Deployer (0xA588...) creates escrow
↓
Oracle (0x751E...) approves milestones
↓
Farmer receives payments
```

### Buyer → Farmer Flow
```
Buyer (0x8611...) creates commitment
↓
Farmer (0xA588...) applies
↓
Buyer approves → Escrow created
↓
Oracle monitors & approves milestones
```

## 🧪 Testing Scenarios

### Scenario 1: Complete Harvest Flow
1. **Buyer** creates commitment for 5,000kg cacao
2. **Farmer** applies with Gold reputation
3. **Buyer** approves → Escrow created
4. **Oracle** approves milestones 0-3
5. **Farmer** receives full payment
6. **Reputation** increases to Platinum

### Scenario 2: Insurance Claim
1. **Farmer** starts harvest with insurance
2. **Oracle** detects drought conditions
3. **Insurance** triggers automatic payout
4. **Farmer** receives 75% of remaining escrow
5. **Reputation** protected (no penalty)

### Scenario 3: Deforestation Penalty
1. **Farmer** completes harvest
2. **Oracle** flags deforestation
3. **Reputation** decreases by 100 points
4. **Future** applications may be rejected

## 🔍 Verification Links

### Smart Contracts
- [CacaoEscrow](https://celo-sepolia.blockscout.com/address/0x4B0291561f3Bc9cd7a72f4124E10020444f3a15d)
- [CommitmentMarketplace](https://celo-sepolia.blockscout.com/address/0x5e3b189eA42c90d23796Ee21e44f56b8B219e48a)
- [FarmerReputationBadge](https://celo-sepolia.blockscout.com/address/0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c)
- [CacaoHarvestNFT](https://celo-sepolia.blockscout.com/address/0xB28e3a03A73Ee67604F019C56E27382b133240Bb)

### Wallets
- [Deployer](https://celo-sepolia.blockscout.com/address/0xA58809476a2CCBa71A53B3f3C2d984Db673238dD)
- [Oracle](https://celo-sepolia.blockscout.com/address/0x751E3EF3858102230FcbFcbaD0B212a4235DF59C)
- [Buyer](https://celo-sepolia.blockscout.com/address/0x86115145f2305FD6d86A84c86E84f4E72129ebCD)

## 🚨 Security Notes

### Private Keys
- **NEVER** commit private keys to repository
- Store in secure environment variables
- Use hardware wallets for mainnet
- Rotate keys regularly

### Access Control
- **Oracle** has critical permissions (milestone approval)
- **Deployer** owns all contracts initially
- **Buyers** control their own commitments
- **Farmers** can only apply, not approve

### Testing vs Production
- Current addresses are for **testnet only**
- Mainnet deployment will use different addresses
- Update frontend configuration for production
- Verify all addresses before mainnet launch

---

**🔐 Keep your keys safe and your harvests secure!**
