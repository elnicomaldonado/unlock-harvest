# 🌱 UnlockHarvest - RealFi Hack 2025

> **Coordination Infrastructure for Agriculture Finance**
> 
> Oracle-verified (academia/third party verification) milestone escrow enabling fair financing for smallholder farmers. Deployed on Celo.

---

## 🎯 TL;DR - What Judges Need to Know

**Problem:** 70% of cacao farmers in Ecuador are forced to sell future harvests at 40-60% below market price due to 6-month working capital gap.

**Solution:** Oracle-verified milestone escrow contracts that release USDC payments throughout the growing season at 4 verified stages (planting, growth, pre-harvest, delivery).

**Innovation:** Satellite-based verification + portable reputation NFTs + parametric climate insurance (Phase 2 vision).

**Status:** ✅ Deployed & Working on Celo Sepolia Testnet

### Smart Contracts Deployed

| Contract | Address | Status |
|----------|---------|--------|
| CommitmentMarketplace | `0x5e3b189eA42c90d23796Ee21e44f56b8B219e48a` | ✅ Verified |
| CacaoEscrow | `0x4B0291561f3Bc9cd7a72f4124E10020444f3a15d` | ✅ Verified |
| FarmerReputationBadge | `0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c` | ✅ Verified |
| CacaoHarvestNFT | `0xB28e3a03A73Ee67604F019C56E27382b133240Bb` | ✅ Verified |
| Oracle | `0x751E3EF3858102230FcbFcbaD0B212a4235DF59C` | ✅ Active |

### Key Features

🌱 **Milestone-Based Financing** - Farmers get paid as they work, not after 6 months  
🛰️ **Oracle Verification** - Satellite monitoring of crop quality & deforestation  
🏆 **Portable Reputation** - NFT-based credit history that travels with farmers  
🌍 **Climate Resilience** - Phase 2: Parametric insurance for weather events  
📱 **Mobile-First** - Built on Celo for smartphone accessibility  

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-repo/unlock-harvest
cd unlock-harvest

# Install dependencies
npm install

# Start local blockchain
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Start frontend
cd client
npm run dev
```

---

# 🌱 Unlock Harvest v2.0 - Complete Ecosystem

**"Purchase Commitments + Reputation Credit + Parametric Insurance"**

A complete harvest-to-market platform that connects buyers with farmers through guaranteed purchase commitments, milestone-based financing, and built-in climate insurance.

## 🎯 THE COMPLETE ECOSYSTEM

### Four User Roles:
- **🌱 Farmers** - Request funding, build reputation, get insured
- **🏢 Buyers** (Chocolate companies, cooperatives) - Create purchase commitments  
- **💰 Liquidity Providers** (Investors/Community) - Fund escrows, earn returns
- **🔮 Oracle** - Verify milestones, trigger insurance payouts

## 📊 HOW INSURANCE FITS IN (Parametric Model)

### Innovation: Built-in Crop Insurance via Smart Contract
Instead of separate insurance companies, insurance is embedded in the escrow. When a farmer gets financing, a small percentage (5-10%) goes to an insurance pool. If verified climate events destroy crops, instant payout.

### Insurance Mechanics:

**Parametric Triggers (Auto-Payout):**
- Extreme drought (rainfall < 30% normal for 30 days)
- Flooding (rainfall > 200% normal in 7 days)  
- Temperature extremes (>40°C for 14+ consecutive days)
- Pest outbreak (verified by oracle)

**Insurance Pool Structure:**
- Farmer pays 8% of escrow amount as premium (built into financing)
- Buyer/Investor contributes 2% (supply chain protection)
- Total: 10% of escrow goes to insurance pool
- If trigger event occurs: Farmer receives 50-75% of escrow value instantly
- If no trigger: Pool compounds for future claims

**Example:**
```
Farmer receives $1,000 escrow
- $100 goes to insurance pool (10%)
- $900 released via milestones
- If drought verified by oracle: Farmer gets $500 instant payout
- Farmer doesn't lose reputation score (protected claim)
```

## 🚀 COMPLETE USER FLOWS

### Flow 1: Buyer Creates Purchase Commitment

**Buyer Dashboard:**
```
1. Click "Create Purchase Commitment"
2. Fill form:
   - Crop: Organic Cacao
   - Quantity: 5,000 kg
   - Price: $2.50/kg (Total: $12,500)
   - Quality standards: Organic certified, <5% defects
   - Delivery deadline: 6 months
   - Insurance coverage: Yes (10% premium)
3. Deposit 10% down payment ($1,250) to smart contract
4. Commitment goes live, visible to farmers
```

**Smart Contract Action:**
- Creates PurchaseCommitment struct
- Locks buyer's deposit in escrow
- Emits CommitmentCreated event
- Opens application period for farmers

### Flow 2: Farmer Applies to Commitment

**Farmer Dashboard:**
```
1. Browse "Available Commitments"
2. See commitment card:
   - Buyer: Pacari Chocolate
   - Need: 5,000 kg organic cacao
   - Price: $2.50/kg
   - My share if accepted: 500 kg = $1,250
   - Insurance: Included (drought, flood, pest)
   - Reputation required: Silver tier minimum
3. Click "Apply" if qualified
4. System shows:
   - Your reputation: Gold (score: 450)
   - Estimated approval: High
   - Financing amount: $1,000 (working capital)
   - Insurance premium: $100 (auto-deducted)
   - Net financing: $900 released via milestones
5. Submit application
```

**Smart Contract Action:**
- Checks hasBadge(farmer) - must have reputation badge
- Checks reputation tier >= Silver
- Creates application record
- Notifies buyer

### Flow 3: Buyer Approves Farmers & Escrows Created

**Buyer Dashboard:**
```
1. See "Pending Applications" (15 farmers applied)
2. Filter by:
   - Reputation tier (prioritize Platinum/Gold)
   - Past success rate
   - Deforestation incidents (0 preferred)
3. Select 10 farmers (each will supply 500kg)
4. Click "Approve & Create Escrows"
5. System automatically:
   - Creates 10 escrows (CacaoEscrow contract)
   - Transfers financing to each escrow
   - Deducts 10% insurance premium to pool
   - Mints NFTs for each farmer (CacaoHarvestNFT)
   - Links escrows to purchase commitment
```

**Smart Contract Actions:**
- Buyer approves farmer addresses
- Platform creates escrows automatically using createEscrow()
- Insurance premium (10% of each escrow) goes to InsurancePool contract
- NFTs minted showing "Insured Harvest" badge
- Reputation badges updated (harvest started)

### Flow 4: Farmer Works & Milestones Progress

**Farmer Dashboard:**
```
1. See active harvest card:
   - Commitment: Pacari Chocolate
   - Amount: $1,250 to be earned
   - Financing: $900 (4 milestone releases)
   - Insurance: $100 in pool (protects up to $750)
   - Current stage: Land Verification (Milestone 1)
2. Submit proof:
   - Upload: Land photos, GPS coordinates
   - Oracle reviews and approves
   - Receive: $225 (25% of $900)
3. Repeat for milestones 2-4
```

**Insurance Monitoring (Background):**
- Oracle checks weather APIs automatically
- If drought detected (rainfall < 30% of normal):
  - Smart contract triggers checkInsuranceClaim()
  - If conditions met for 30 days:
    - Insurance payout released instantly
    - Farmer receives 75% of remaining escrow
    - Reputation score PROTECTED (not penalized)
    - Buyer refunded their deposit (risk shared)

### Flow 5A: Successful Harvest (Normal Flow)

**Completion:**
```
1. Farmer completes all 4 milestones
2. Delivers 500kg organic cacao to Pacari
3. Oracle verifies:
   - Quantity correct
   - Quality meets standards
   - No deforestation
   - On-time delivery
4. System releases:
   - Final milestone payment to farmer ($225)
   - Buyer's deposit returned ($1,250)
   - Buyer pays farmer for delivery ($1,250)
   - Insurance premium returned to pool (unused)
5. Farmer reputation increases:
   - +50 points (successful harvest)
   - +30 points (premium quality)
   - +50 points (zero deforestation)
   - Total: +130 points → moves from Gold to Platinum
```

### Flow 5B: Insured Event (Drought Scenario)

**Insurance Trigger:**
```
1. Week 8: Oracle detects severe drought
   - Rainfall: 15% of normal (trigger: <30%)
   - Duration: 35 consecutive days (trigger: 30 days)
2. Smart contract automatically:
   - Flags harvest as "Climate Event"
   - Checks insurance pool balance
   - Calculates payout: 75% of remaining escrow
   - Example: $675 remaining → $500 instant payout
3. Farmer receives:
   - Already released: $225 (Milestone 1)
   - Insurance payout: $500 (protection)
   - Total: $725 of $1,000 escrow (72% protected)
4. Farmer reputation:
   - NO penalty (insured event)
   - +20 points for completing Milestone 1
   - Can apply to new commitments immediately
5. Buyer:
   - Deposit refunded ($1,250)
   - Can create new commitment for replacement
   - Diversified risk (10 farmers, only 1-2 affected)
```

## 💡 INSURANCE POOL ECONOMICS

### Sustainability Model:

**Income:**
- 10% of every escrow funded (example: $1,000 escrow = $100 premium)
- If 100 escrows created monthly = $10,000/month income
- Annual pool income: $120,000

**Payouts:**
- Historical climate event frequency: ~10-15% of crops
- Average payout: 60% of escrow value
- Example: 10 claims @ $600 each = $6,000/month
- Annual payouts: $72,000

**Net Pool Growth: $48,000/year**

**Compounding Effect:**
- Year 1: $48K surplus
- Year 2: $96K surplus (pool earns interest)
- Year 3: Pool fully self-sustaining + reserves
- Can reduce premium to 6-7% by Year 3


---

## 📞 CONTACT

- **GitHub:** [unlock-harvest](https://github.com/your-repo/unlock-harvest)

---

## 📄 LICENSE

MIT License - see [LICENSE](LICENSE) file for details.

---

**🌱 Building the future of sustainable agriculture, one harvest at a time.**
