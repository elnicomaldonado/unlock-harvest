// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title ICacaoHarvestNFT
 * @notice Interface for dynamic NFTs representing cacao harvest cycles
 * @dev Each NFT tracks a single harvest from planting to delivery with immutable environmental data
 */
interface ICacaoHarvestNFT {
    /**
     * @notice Harvest growth milestones verified by university oracle
     * @dev Enum values map to verification stages in the physical harvest cycle
     */
    enum Milestone {
        Verified,    // Initial verification complete (satellite baseline established)
        Planted,     // Seeds planted, growth cycle started
        MidGrowth,   // Mid-cycle health check (3 months)
        Harvested    // Final harvest complete, ready for delivery
    }

    /**
     * @notice Complete harvest data stored on-chain
     * @param farmerId Ethereum address of the farmer (immutable)
     * @param escrowId Reference to the associated escrow contract ID
     * @param currentMilestone Current stage in the harvest cycle
     * @param milestoneHistory Array of block timestamps when each milestone was reached
     * @param deforestationStatus True if satellite data detected forest clearing (immutable once true)
     * @param harvestWeight Final weight in kilograms (only set at Harvested milestone)
     * @param metadataURI IPFS or HTTP URI pointing to additional off-chain data
     */
    struct HarvestData {
        address farmerId;
        uint256 escrowId;
        Milestone currentMilestone;
        uint256[4] milestoneHistory; // Fixed array: [Verified, Planted, MidGrowth, Harvested]
        bool deforestationStatus;
        uint256 harvestWeight;
        string metadataURI;
    }

    /**
     * @notice Emitted when a harvest NFT is minted to track a new cycle
     * @param tokenId Unique identifier for this NFT
     * @param farmerId Address of the farmer
     * @param escrowId Associated escrow contract ID
     */
    event HarvestMinted(uint256 indexed tokenId, address indexed farmerId, uint256 indexed escrowId);

    /**
     * @notice Emitted when oracle updates harvest milestone
     * @param tokenId NFT being updated
     * @param newMilestone Updated growth stage
     * @param timestamp Block timestamp of the update
     */
    event MilestoneUpdated(uint256 indexed tokenId, Milestone newMilestone, uint256 timestamp);

    /**
     * @notice Emitted when deforestation is detected (CRITICAL alert)
     * @param tokenId Affected NFT
     * @param farmerId Farmer address for accountability
     * @param detectionTimestamp When the violation was detected
     */
    event DeforestationDetected(uint256 indexed tokenId, address indexed farmerId, uint256 detectionTimestamp);

    /**
     * @notice Emitted when final harvest weight is recorded
     * @param tokenId NFT being finalized
     * @param weight Harvest weight in kilograms
     */
    event HarvestWeightRecorded(uint256 indexed tokenId, uint256 weight);

    /**
     * @notice Emitted when metadata URI is updated
     * @param tokenId NFT being updated
     * @param newURI New IPFS or HTTP URI
     */
    event MetadataURIUpdated(uint256 indexed tokenId, string newURI);

    /**
     * @notice Mint a new harvest NFT for a farmer's crop cycle
     * @param farmerId Address of the farmer
     * @param escrowId Associated escrow contract ID
     * @param metadataURI Initial metadata URI (IPFS hash recommended)
     * @return tokenId The ID of the newly minted NFT
     */
    function mintHarvest(
        address farmerId,
        uint256 escrowId,
        string calldata metadataURI
    ) external returns (uint256 tokenId);

    /**
     * @notice Update harvest to next milestone (oracle-only)
     * @param tokenId NFT to update
     * @param newMilestone Next stage in the cycle
     */
    function updateMilestone(uint256 tokenId, Milestone newMilestone) external;

    /**
     * @notice Record final harvest weight (oracle-only, only at Harvested milestone)
     * @param tokenId NFT to update
     * @param weight Harvest weight in kilograms
     */
    function recordHarvestWeight(uint256 tokenId, uint256 weight) external;

    /**
     * @notice Flag deforestation detected via satellite monitoring (oracle-only)
     * @param tokenId NFT to flag
     * @dev This is immutable - once flagged, cannot be unflagged
     */
    function flagDeforestation(uint256 tokenId) external;

    /**
     * @notice Update metadata URI (oracle-only)
     * @param tokenId NFT to update
     * @param newURI New metadata URI
     */
    function updateMetadataURI(uint256 tokenId, string calldata newURI) external;

    /**
     * @notice Get complete harvest data for a token
     * @param tokenId NFT to query
     * @return data Complete HarvestData struct
     */
    function getHarvestData(uint256 tokenId) external view returns (HarvestData memory data);

    /**
     * @notice Get all NFT IDs owned by a farmer
     * @param farmerId Farmer address to query
     * @return tokenIds Array of token IDs
     */
    function getFarmerHarvests(address farmerId) external view returns (uint256[] memory tokenIds);

    /**
     * @notice Check if a harvest has been flagged for deforestation
     * @param tokenId NFT to check
     * @return flagged True if deforestation was detected
     */
    function isDeforestationFlagged(uint256 tokenId) external view returns (bool flagged);

    /**
     * @notice Get the current oracle address
     * @return Address of the authorized oracle
     */
    function oracle() external view returns (address);
}

