# CacaoHarvestNFT - Dynamic NFT Implementation

## 📋 Overview

`CacaoHarvestNFT` is a dynamic ERC-721 NFT contract that represents individual cacao harvest cycles. Each NFT is a living, updateable record that tracks a farmer's crop from initial verification through harvest, with satellite-verified environmental data permanently stored on-chain.

## 🎯 Key Features

### 1. **Dynamic Metadata**
- NFT metadata updates as the crop progresses through milestones
- Oracle-verified updates ensure data integrity
- Complete audit trail with timestamps

### 2. **Environmental Accountability**
- Permanent deforestation flagging (immutable once set)
- Satellite monitoring integration via oracle
- Cryptographic proof of sustainable farming

### 3. **Milestone Tracking**
Four sequential stages:
- `Verified` (0) - Initial verification, satellite baseline established
- `Planted` (1) - Seeds planted, growth cycle started
- `MidGrowth` (2) - Mid-cycle health check (~3 months)
- `Harvested` (3) - Final harvest complete, ready for delivery

### 4. **Gas Optimization**
Designed for farmer affordability on Celo:
- Contract size: **9.144 KiB** (62% under 24 KiB limit)
- First mint: ~238k gas
- Subsequent mints to same farmer: ~206k gas (13% cheaper!)
- Milestone update: ~70k gas
- Deforestation flag: ~50k gas

## 📊 Data Structure

Each NFT stores:
```solidity
struct HarvestData {
    address farmerId;              // Immutable farmer address
    uint256 escrowId;              // Link to escrow contract
    Milestone currentMilestone;    // Current growth stage
    uint256[4] milestoneHistory;   // Timestamp for each milestone
    bool deforestationStatus;      // Environmental flag (immutable)
    uint256 harvestWeight;         // Final weight in kg
    string metadataURI;            // IPFS URI for additional data
}
```

## 🔒 Access Control

### Owner-Only Functions
- `mintHarvest()` - Create new harvest NFT

### Oracle-Only Functions
- `updateMilestone()` - Progress to next stage
- `recordHarvestWeight()` - Set final harvest weight
- `flagDeforestation()` - Mark environmental violation
- `updateMetadataURI()` - Update off-chain metadata

### Public View Functions
- `getHarvestData()` - Get complete harvest information
- `getFarmerHarvests()` - Get all NFTs for a farmer
- `isDeforestationFlagged()` - Check environmental status
- `getMilestoneTimestamp()` - Get specific milestone time
- `totalHarvests()` - Get total NFT count

## 🛡️ Security Features

1. **Immutable Oracle**: Set at deployment, cannot be changed
2. **Sequential Milestones**: Cannot skip or reverse stages
3. **One-Time Weight Recording**: Cannot be changed once set
4. **Permanent Deforestation Flag**: Cannot be unflagged
5. **ERC-721 Standard**: Fully compliant, audited base

## 📝 Events

All state changes emit events for transparency:

```solidity
event HarvestMinted(uint256 indexed tokenId, address indexed farmerId, uint256 indexed escrowId)
event MilestoneUpdated(uint256 indexed tokenId, Milestone newMilestone, uint256 timestamp)
event DeforestationDetected(uint256 indexed tokenId, address indexed farmerId, uint256 detectionTimestamp)
event HarvestWeightRecorded(uint256 indexed tokenId, uint256 weight)
event MetadataURIUpdated(uint256 indexed tokenId, string newURI)
```

## 💡 Usage Examples

### Minting a New Harvest (Owner/Escrow Contract)
```javascript
const tx = await nft.mintHarvest(
  farmerAddress,
  escrowId,
  "ipfs://QmHash..."
)
const receipt = await tx.wait()
const tokenId = receipt.events[0].args.tokenId
```

### Oracle Updates Progress
```javascript
// Progress through stages
await nft.connect(oracle).updateMilestone(tokenId, Milestone.Planted)
await nft.connect(oracle).updateMilestone(tokenId, Milestone.MidGrowth)
await nft.connect(oracle).updateMilestone(tokenId, Milestone.Harvested)

// Record final weight (only at Harvested)
await nft.connect(oracle).recordHarvestWeight(tokenId, 1500) // 1500 kg
```

### Check Deforestation Status
```javascript
const isFlagged = await nft.isDeforestationFlagged(tokenId)
if (isFlagged) {
  // Take action: withhold payment, alert authorities, etc.
}
```

### Get Farmer's History
```javascript
const tokenIds = await nft.getFarmerHarvests(farmerAddress)
for (const id of tokenIds) {
  const data = await nft.getHarvestData(id)
  console.log(`Harvest ${id}: ${data.currentMilestone}, Weight: ${data.harvestWeight}`)
}
```

## 🧪 Test Coverage

**38 tests, 100% passing**

Coverage includes:
- ✅ Deployment & initialization
- ✅ Minting functionality
- ✅ Oracle-only access control
- ✅ Sequential milestone progression
- ✅ Harvest weight recording
- ✅ Deforestation flagging
- ✅ Metadata URI updates
- ✅ View function accuracy
- ✅ ERC-721 standard compliance
- ✅ Gas optimization verification
- ✅ Error condition handling
- ✅ Event emission

## 🚀 Deployment

### 1. Set Environment Variables
```bash
cp ENV.md .env
# Edit .env with:
# - ORACLE_ADDRESS (university verification system)
# - PRIVATE_KEY (deployer wallet)
# - CELO_ALFAJORES_RPC (testnet)
```

### 2. Deploy to Alfajores Testnet
```bash
npm run deploy:alfajores
```

### 3. Verify on Celoscan
```bash
npx hardhat verify --network alfajores <CONTRACT_ADDRESS> <ORACLE_ADDRESS>
```

## 🔗 Integration with Other Contracts

### Escrow Contract Integration
The escrow contract should:
1. Be the owner of CacaoHarvestNFT
2. Mint NFT when farmer creates new escrow
3. Check deforestation status before releasing funds
4. Use milestone progression to trigger payment releases

### Frontend Integration
The frontend should:
1. Display NFT metadata and progress
2. Show milestone timestamps
3. Alert on deforestation flags
4. Provide farmer harvest history dashboard

## 📈 Gas Cost Analysis (Celo Alfajores)

| Operation | Gas Used | Estimated Cost* |
|-----------|----------|-----------------|
| First mint | ~238,124 | $0.0024 |
| Subsequent mint (same farmer) | ~206,724 | $0.0021 |
| Milestone update | ~70,471 | $0.0007 |
| Deforestation flag | ~50,097 | $0.0005 |
| Record harvest weight | ~55,000 | $0.0006 |
| Update metadata URI | ~60,000 | $0.0006 |

*Estimated at 1 Gwei gas price and $0.50 CELO

**Total cost per complete harvest cycle: ~$0.006**

This is extremely affordable for farmers, especially considering Celo's stable gas prices and low fees.

## 🔄 Upgrade Path

Current implementation uses `Ownable2Step` for secure ownership transfer. If upgradability is needed in the future, consider:
1. Deploy new version with proxy pattern
2. Migrate data via off-chain indexing
3. Maintain backward compatibility for existing NFTs

## 🛣️ Future Enhancements

1. **Batch Operations**: Mint multiple harvests in one transaction
2. **Metadata Schema**: Standardize JSON format for off-chain data
3. **Reputation Integration**: Link to FarmerReputationBadge contract
4. **Photo Verification**: Store IPFS hashes of crop photos at each milestone
5. **GPS Coordinates**: Embed immutable location data

## 📚 References

- [OpenZeppelin ERC-721](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [Celo Documentation](https://docs.celo.org)
- [EIP-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Dynamic NFT Best Practices](https://ethereum.org/en/developers/docs/standards/tokens/erc-721/)

## 🤝 Contributing

This contract follows RealFi best practices:
- **Gas efficiency first**: Every optimization helps farmers
- **Security**: Use audited OpenZeppelin libraries
- **Simplicity**: One contract, one responsibility
- **Transparency**: Every state change emits an event

## 📄 License

MIT License - see LICENSE file for details

