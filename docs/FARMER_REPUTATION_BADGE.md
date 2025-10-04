# FarmerReputationBadge - Soulbound Reputation System

## 📋 Overview

`FarmerReputationBadge` is a soulbound (non-transferable) ERC-721 NFT system that builds on-chain credit scores for smallholder cacao farmers. Each badge tracks performance history, calculates dynamic reputation scores, and automatically adjusts tier levels based on farming practices.

## 🎯 Key Features

### 1. **Soulbound Tokens**
- Cannot be transferred, sold, or approved
- Permanently bound to farmer's address
- One badge per farmer (lifetime credential)

### 2. **Dynamic Scoring System**
Performance-based points:
- **+25 points** per on-time milestone completion
- **+50 points** for zero deforestation (full cycle)
- **+30 points** for premium quality harvest
- **-100 points** for deforestation detection

### 3. **Automatic Tier System**
- **Bronze**: 0-199 points (starting tier)
- **Silver**: 200-299 points (proven reliability)
- **Gold**: 300-399 points (excellent track record)
- **Platinum**: 400+ points (elite farmer status)

### 4. **On-Chain Credit History**
Complete performance tracking:
- Total harvest cycles
- Successful completions
- Deforestation incidents
- On-time milestone count
- Premium quality count
- Last update timestamp

### 5. **Dynamic NFT Metadata**
- SVG badges with tier colors
- Auto-updating metadata
- Base64-encoded on-chain
- No external dependencies

## 📊 Data Structure

### FarmerStats Struct
```solidity
struct FarmerStats {
    int256 score;                    // Can be negative temporarily
    Tier tier;                       // Bronze/Silver/Gold/Platinum
    uint256 totalHarvests;           // All cycles initiated
    uint256 successfulHarvests;      // Completed without violations
    uint256 deforestationIncidents;  // Environmental violations
    uint256 onTimeCompletions;       // Milestone punctuality
    uint256 premiumQualityCount;     // Premium-grade harvests
    uint256 lastUpdateTimestamp;     // Unix timestamp
}
```

### Tier Enum
```solidity
enum Tier {
    Bronze,    // 0-199 points
    Silver,    // 200-299 points
    Gold,      // 300-399 points
    Platinum   // 400+ points
}
```

## 🔒 Access Control

### Escrow-Only Functions
```solidity
function mintBadge(address farmer) external returns (uint256 tokenId)
function updateScore(address farmer, uint256 milestones, bool onTime, bool zeroDefo, bool premium) external
function applyDeforestationPenalty(address farmer) external
```

### Owner-Only Functions
```solidity
function setEscrowContract(address newEscrow) external
```

### Public View Functions
```solidity
function getFarmerScore(address farmer) external view returns (int256)
function getFarmerTier(address farmer) external view returns (Tier)
function getFarmerStats(address farmer) external view returns (FarmerStats memory)
function hasBadge(address farmer) external view returns (bool)
function getFarmerTokenId(address farmer) external view returns (uint256)
function getTierName(Tier tier) external pure returns (string memory)
function getTierColor(Tier tier) external pure returns (string memory)
function getTierThreshold(Tier tier) external pure returns (int256)
function tokenURI(uint256 tokenId) public view returns (string memory)
```

## 📝 Events

All state changes emit events for transparency:

```solidity
event BadgeMinted(address indexed farmer, uint256 tokenId)
event ScoreUpdated(address indexed farmer, int256 oldScore, int256 newScore, string reason)
event TierUpgraded(address indexed farmer, Tier oldTier, Tier newTier)
event TierDowngraded(address indexed farmer, Tier oldTier, Tier newTier)
event DeforestationPenalty(address indexed farmer, uint256 penaltyPoints)
```

## 💡 Usage Examples

### JavaScript/TypeScript

```javascript
// Mint badge for new farmer (escrow only)
const tx = await badge.connect(escrow).mintBadge(farmerAddress)
const receipt = await tx.wait()
console.log(`Badge minted with ID: ${receipt.events[0].args.tokenId}`)

// Update score after harvest completion
await badge.connect(escrow).updateScore(
    farmerAddress,
    4,        // 4 milestones completed
    true,     // on time
    true,     // zero deforestation
    true      // premium quality
)

// Apply penalty for deforestation
await badge.connect(escrow).applyDeforestationPenalty(farmerAddress)

// Check farmer stats
const stats = await badge.getFarmerStats(farmerAddress)
console.log("Score:", stats.score.toString())
console.log("Tier:", ["Bronze", "Silver", "Gold", "Platinum"][stats.tier])
console.log("Total Harvests:", stats.totalHarvests.toString())
console.log("Deforestation Incidents:", stats.deforestationIncidents.toString())

// Check if farmer has badge
const hasBadge = await badge.hasBadge(farmerAddress)
if (hasBadge) {
    const tier = await badge.getFarmerTier(farmerAddress)
    console.log("Farmer tier:", tier)
}
```

### React Hook

```typescript
import { useContract, useContractRead } from '@thirdweb-dev/react'

function FarmerProfile({ farmerAddress }: { farmerAddress: string }) {
    const { contract } = useContract("BADGE_ADDRESS")
    
    const { data: stats } = useContractRead(
        contract,
        "getFarmerStats",
        [farmerAddress]
    )
    
    const { data: hasBadge } = useContractRead(
        contract,
        "hasBadge",
        [farmerAddress]
    )
    
    if (!hasBadge) return <p>No reputation badge yet</p>
    
    return (
        <div>
            <h2>Reputation: {getTierName(stats.tier)}</h2>
            <p>Score: {stats.score.toString()}</p>
            <p>Total Harvests: {stats.totalHarvests.toString()}</p>
            <p>Success Rate: {
                (stats.successfulHarvests / stats.totalHarvests * 100).toFixed(1)
            }%</p>
        </div>
    )
}
```

## 🎨 Tier Badges

Each tier has a unique color and visual appearance:

| Tier | Color | Hex Code | Points Required |
|------|-------|----------|-----------------|
| Bronze | Bronze | #CD7F32 | 0-199 |
| Silver | Silver | #C0C0C0 | 200-299 |
| Gold | Gold | #FFD700 | 300-399 |
| Platinum | Platinum Gray | #E5E4E2 | 400+ |

## 📈 Scoring Scenarios

### Scenario 1: Perfect Farmer
```
Harvest 1: 4 milestones on time + zero defo + premium = +180 points
Harvest 2: 4 milestones on time + zero defo + premium = +180 points
Harvest 3: 4 milestones on time + zero defo + premium = +180 points
Total: 540 points → PLATINUM tier
```

### Scenario 2: Reliable Farmer
```
Harvest 1: 4 milestones on time = +100 points
Harvest 2: 4 milestones on time + zero defo = +150 points
Total: 250 points → SILVER tier
```

### Scenario 3: Recovery After Penalty
```
Harvest 1: 4 milestones on time + bonuses = +180 points (Bronze)
Deforestation penalty: -100 points = 80 points (Bronze)
Harvest 2: 4 milestones on time + bonuses = +180 points = 260 points (Silver)
Harvest 3: 4 milestones on time + zero defo = +150 points = 410 points (Platinum)
```

### Scenario 4: Poor Performance
```
Harvest 1: Late milestones, no bonuses = 0 points
Deforestation penalty: -100 points
Harvest 2: 2 milestones late + zero defo = +50 points
Total: -50 points → BRONZE tier (negative scores stay in Bronze)
```

## 🛡️ Security Features

### Soulbound Enforcement
All transfer and approval functions revert:
- `transferFrom()` → reverts
- `safeTransferFrom()` → reverts
- `approve()` → reverts
- `setApprovalForAll()` → reverts

Only minting (to farmer) and burning (if needed) are allowed.

### Access Control
- Only escrow contract can mint badges and update scores
- Only owner can update escrow contract address
- All score updates are validated (e.g., milestone count ≤ 4)
- Farmers cannot manipulate their own scores

### Data Integrity
- Scores can be negative (accountability)
- Tier automatically adjusts on score changes
- Complete audit trail via events
- Stats are cumulative and immutable

## 🧪 Test Coverage

**50 tests, 100% passing ✅**

Coverage includes:
- ✅ Deployment & initialization (5 tests)
- ✅ Badge minting (6 tests)
- ✅ Score updates - basic scenarios (11 tests)
- ✅ Deforestation penalties (4 tests)
- ✅ Tier system progression (7 tests)
- ✅ View functions (6 tests)
- ✅ Soulbound enforcement (4 tests)
- ✅ Metadata generation (2 tests)
- ✅ Admin functions (3 tests)
- ✅ Complex scenarios (2 tests)

## 📊 Gas Costs

*To be measured on Celo network - estimated costs:*

| Operation | Estimated Gas | Est. Cost* |
|-----------|---------------|------------|
| Mint badge | ~200k | $0.002 |
| Update score | ~80k | $0.0008 |
| Apply penalty | ~70k | $0.0007 |
| View functions | 0 (free) | $0 |

*Estimated at 1 Gwei gas price and $0.50 CELO

## 🔗 Integration with Other Contracts

### Escrow Contract Integration

The escrow contract should:

```solidity
FarmerReputationBadge public reputationBadge;

function completeEscrow(...) external {
    address farmer = ...;
    
    // Mint badge if first escrow
    if (!reputationBadge.hasBadge(farmer)) {
        reputationBadge.mintBadge(farmer);
    }
    
    // Update score based on performance
    bool onTime = ...;
    bool zeroDeforestation = !harvestNFT.isDeforestationFlagged(tokenId);
    bool premiumQuality = ...;
    
    reputationBadge.updateScore(
        farmer,
        4, // completed all milestones
        onTime,
        zeroDeforestation,
        premiumQuality
    );
    
    // Or apply penalty if needed
    if (deforestationDetected) {
        reputationBadge.applyDeforestationPenalty(farmer);
    }
}
```

### Frontend Dashboard Integration

```typescript
// Show farmer's reputation dashboard
async function FarmerDashboard({ farmerAddress }) {
    const badge = useContract("BADGE_ADDRESS")
    const stats = await badge.getFarmerStats(farmerAddress)
    
    // Calculate success rate
    const successRate = stats.totalHarvests > 0
        ? (stats.successfulHarvests / stats.totalHarvests) * 100
        : 0
    
    // Display tier progression
    const nextTier = getNextTier(stats.tier)
    const pointsNeeded = getTierThreshold(nextTier) - stats.score
    
    return (
        <ReputationCard
            tier={stats.tier}
            score={stats.score}
            successRate={successRate}
            pointsToNextTier={pointsNeeded}
            stats={stats}
        />
    )
}
```

## 🚀 Deployment

### 1. Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network alfajores
```

### 2. Verify on Celoscan
```bash
npx hardhat verify --network alfajores <BADGE_ADDRESS> <ESCROW_ADDRESS>
```

### 3. Update Escrow Contract
```bash
# After deploying escrow
await badge.setEscrowContract(ESCROW_ADDRESS)
```

## 🛣️ Future Enhancements

1. **Reputation Decay**: Reduce score if inactive for extended periods
2. **Bonus Multipliers**: Higher rewards for consecutive excellent harvests
3. **Achievements System**: Special badges for milestones (e.g., "100 Harvests")
4. **Reputation Lending**: Allow farmers to use reputation as loan collateral
5. **Social Features**: Farmer leaderboards and community rankings
6. **Insurance Integration**: Lower premiums for high-reputation farmers

## 📚 References

- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Soulbound Tokens (SBT)](https://vitalik.ca/general/2022/01/26/soulbound.html)
- [OpenZeppelin ERC721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [Base64 Encoding](https://docs.openzeppelin.com/contracts/5.x/utilities#base64)

## 📄 License

MIT License - see LICENSE file for details

