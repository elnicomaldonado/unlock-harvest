# CacaoHarvestNFT Quick Reference

## 🎯 Key Functions

### Owner Functions (Escrow Contract)
```solidity
// Mint new harvest NFT
function mintHarvest(
    address farmerId,
    uint256 escrowId,
    string calldata metadataURI
) external returns (uint256 tokenId)
```

### Oracle Functions (University Verification)
```solidity
// Progress to next milestone
function updateMilestone(uint256 tokenId, Milestone newMilestone) external

// Record final weight (only at Harvested stage)
function recordHarvestWeight(uint256 tokenId, uint256 weight) external

// Flag deforestation (permanent!)
function flagDeforestation(uint256 tokenId) external

// Update IPFS metadata
function updateMetadataURI(uint256 tokenId, string calldata newURI) external
```

### View Functions (Public)
```solidity
// Get all harvest data
function getHarvestData(uint256 tokenId) 
    external view returns (HarvestData memory)

// Get farmer's harvest history
function getFarmerHarvests(address farmerId) 
    external view returns (uint256[] memory)

// Check deforestation status
function isDeforestationFlagged(uint256 tokenId) 
    external view returns (bool)

// Get milestone timestamp
function getMilestoneTimestamp(uint256 tokenId, Milestone milestone)
    external view returns (uint256)

// Get total supply
function totalHarvests() external view returns (uint256)
```

## 📋 Milestone Enum
```solidity
enum Milestone {
    Verified,   // 0 - Initial verification
    Planted,    // 1 - Seeds planted
    MidGrowth,  // 2 - Mid-cycle check
    Harvested   // 3 - Ready for delivery
}
```

## 📊 HarvestData Struct
```solidity
struct HarvestData {
    address farmerId;              // Original farmer
    uint256 escrowId;              // Linked escrow
    Milestone currentMilestone;    // Current stage
    uint256[4] milestoneHistory;   // Timestamps
    bool deforestationStatus;      // Environmental flag
    uint256 harvestWeight;         // Final weight (kg)
    string metadataURI;            // IPFS URI
}
```

## 🎪 Events
```solidity
event HarvestMinted(uint256 indexed tokenId, address indexed farmerId, uint256 indexed escrowId)
event MilestoneUpdated(uint256 indexed tokenId, Milestone newMilestone, uint256 timestamp)
event DeforestationDetected(uint256 indexed tokenId, address indexed farmerId, uint256 detectionTimestamp)
event HarvestWeightRecorded(uint256 indexed tokenId, uint256 weight)
event MetadataURIUpdated(uint256 indexed tokenId, string newURI)
```

## 💻 Usage Examples

### JavaScript/TypeScript
```javascript
// Mint harvest (owner only)
const tx = await nft.mintHarvest(
    "0xFarmer...",
    1,
    "ipfs://QmHash..."
)
const receipt = await tx.wait()
const tokenId = receipt.events[0].args.tokenId

// Oracle updates progress
await nft.connect(oracle).updateMilestone(tokenId, 1) // Planted
await nft.connect(oracle).updateMilestone(tokenId, 2) // MidGrowth
await nft.connect(oracle).updateMilestone(tokenId, 3) // Harvested

// Record weight at harvest
await nft.connect(oracle).recordHarvestWeight(tokenId, 1500)

// Check status
const data = await nft.getHarvestData(tokenId)
console.log("Farmer:", data.farmerId)
console.log("Stage:", data.currentMilestone)
console.log("Weight:", data.harvestWeight, "kg")
console.log("Deforestation:", data.deforestationStatus)

// Get farmer history
const harvests = await nft.getFarmerHarvests(farmerAddress)
for (const id of harvests) {
    const info = await nft.getHarvestData(id)
    console.log(`Harvest ${id}: Stage ${info.currentMilestone}`)
}
```

### React Hook
```typescript
import { useContract, useContractRead } from '@thirdweb-dev/react'

function FarmerDashboard({ farmerAddress }) {
    const { contract } = useContract("NFT_ADDRESS")
    
    const { data: harvests } = useContractRead(
        contract,
        "getFarmerHarvests",
        [farmerAddress]
    )
    
    return (
        <div>
            {harvests?.map(id => (
                <HarvestCard key={id} tokenId={id} />
            ))}
        </div>
    )
}
```

## ⚠️ Important Rules

1. **Sequential Milestones**: Must progress 0→1→2→3, cannot skip
2. **Deforestation Permanent**: Once flagged, cannot be unflagged
3. **Weight Once**: Can only record weight at Harvested, only once
4. **Oracle Only**: All updates require oracle signature
5. **Owner Minting**: Only contract owner can mint new NFTs

## 💰 Gas Costs (Celo)
- Mint: ~240k gas ($0.0024)
- Update milestone: ~70k gas ($0.0007)
- Flag deforestation: ~50k gas ($0.0005)
- Record weight: ~55k gas ($0.0006)

## 🔗 Contract Addresses

### Alfajores Testnet
```
CacaoHarvestNFT: (deploy first)
Oracle:          (set in .env)
Escrow:          (deploy after)
```

### Celo Mainnet
```
(To be deployed)
```

## 📚 Resources
- Full docs: `docs/CACAO_HARVEST_NFT.md`
- Tests: `test/CacaoHarvestNFT.test.js`
- Deploy: `npm run deploy:alfajores`

