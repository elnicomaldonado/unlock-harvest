// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./interfaces/ICacaoHarvestNFT.sol";

/**
 * @title CacaoHarvestNFT
 * @notice Dynamic NFTs representing individual cacao harvest cycles with satellite-verified sustainability data
 * @dev Each NFT is a living record that updates as the crop progresses from planting to harvest
 * 
 * Key features:
 * - Immutable farmer and escrow linkage
 * - Oracle-verified milestone progression
 * - Permanent deforestation flagging
 * - Complete audit trail via milestone history
 * - Gas-optimized for farmer affordability
 * 
 * @custom:security-contact security@unlock-harvest.org
 */
contract CacaoHarvestNFT is ERC721, ERC721URIStorage, Ownable2Step, ICacaoHarvestNFT {
    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Authorized oracle address (university verification system)
    address public immutable oracle;

    /// @notice Token ID counter for sequential minting (OpenZeppelin v5 removed Counters library)
    uint256 private _nextTokenId;

    /// @notice Mapping from token ID to harvest data
    mapping(uint256 => HarvestData) private _harvestData;

    /// @notice Mapping from farmer address to array of token IDs
    mapping(address => uint256[]) private _farmerHarvests;

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Restricts function access to oracle only
     * @dev Critical for data integrity - only university can verify milestones
     */
    modifier onlyOracle() {
        require(msg.sender == oracle, "CacaoHarvestNFT: caller is not oracle");
        _;
    }

    /**
     * @notice Ensures token exists before operations
     * @param tokenId Token to check
     */
    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "CacaoHarvestNFT: token does not exist");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Deploys the CacaoHarvestNFT contract
     * @param _oracle Address of the trusted oracle (university verification system)
     * @dev Oracle address is immutable - choose carefully!
     */
    constructor(address _oracle) ERC721("Cacao Harvest", "CACAO") Ownable(msg.sender) {
        require(_oracle != address(0), "CacaoHarvestNFT: oracle is zero address");
        oracle = _oracle;
    }

    // ============================================
    // MINTING FUNCTIONS
    // ============================================

    /**
     * @notice Mint a new harvest NFT to track a farmer's crop cycle
     * @param farmerId Address of the farmer (receives the NFT)
     * @param escrowId Associated escrow contract ID for payment tracking
     * @param metadataURI IPFS URI pointing to additional metadata (photos, GPS coordinates, etc.)
     * @return tokenId The ID of the newly minted NFT
     * 
     * @dev Initially minted at Verified milestone with timestamp
     * @dev Only owner (escrow contract or admin) can mint
     */
    function mintHarvest(
        address farmerId,
        uint256 escrowId,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        require(farmerId != address(0), "CacaoHarvestNFT: farmer is zero address");
        
        // Get next token ID and increment
        tokenId = _nextTokenId++;

        // Mint NFT to farmer
        _safeMint(farmerId, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Initialize harvest data at Verified milestone
        HarvestData storage data = _harvestData[tokenId];
        data.farmerId = farmerId;
        data.escrowId = escrowId;
        data.currentMilestone = Milestone.Verified;
        data.milestoneHistory[uint256(Milestone.Verified)] = block.timestamp;
        data.metadataURI = metadataURI;
        // deforestationStatus defaults to false
        // harvestWeight defaults to 0

        // Track farmer's harvests
        _farmerHarvests[farmerId].push(tokenId);

        emit HarvestMinted(tokenId, farmerId, escrowId);
    }

    // ============================================
    // ORACLE UPDATE FUNCTIONS
    // ============================================

    /**
     * @notice Update harvest to next milestone in the growth cycle
     * @param tokenId NFT to update
     * @param newMilestone Next stage (must be sequential progression)
     * 
     * @dev Only oracle or owner (escrow) can call
     * @dev Validates sequential milestone progression
     * @dev Records timestamp for audit trail
     */
    function updateMilestone(
        uint256 tokenId,
        Milestone newMilestone
    ) external tokenExists(tokenId) {
        require(
            msg.sender == oracle || msg.sender == owner(),
            "CacaoHarvestNFT: caller is not oracle or owner"
        );
        
        HarvestData storage data = _harvestData[tokenId];
        
        // Validate sequential progression (can't skip milestones)
        require(
            uint256(newMilestone) == uint256(data.currentMilestone) + 1,
            "CacaoHarvestNFT: invalid milestone progression"
        );
        
        // Update milestone
        data.currentMilestone = newMilestone;
        data.milestoneHistory[uint256(newMilestone)] = block.timestamp;

        emit MilestoneUpdated(tokenId, newMilestone, block.timestamp);
    }

    /**
     * @notice Record final harvest weight in kilograms
     * @param tokenId NFT to update
     * @param weight Harvest weight (in kg, scaled by contract consumers as needed)
     * 
     * @dev Only oracle can call
     * @dev Only allowed at Harvested milestone
     * @dev Weight is immutable once set (can only set once)
     */
    function recordHarvestWeight(
        uint256 tokenId,
        uint256 weight
    ) external onlyOracle tokenExists(tokenId) {
        HarvestData storage data = _harvestData[tokenId];
        
        require(
            data.currentMilestone == Milestone.Harvested,
            "CacaoHarvestNFT: can only record weight at Harvested milestone"
        );
        require(data.harvestWeight == 0, "CacaoHarvestNFT: weight already recorded");
        require(weight > 0, "CacaoHarvestNFT: weight must be positive");

        data.harvestWeight = weight;

        emit HarvestWeightRecorded(tokenId, weight);
    }

    /**
     * @notice Flag harvest for deforestation detected via satellite monitoring
     * @param tokenId NFT to flag
     * 
     * @dev Only oracle can call
     * @dev Immutable - once flagged, cannot be unflagged (permanent record)
     * @dev Critical for environmental accountability
     */
    function flagDeforestation(uint256 tokenId) external tokenExists(tokenId) {
        require(
            msg.sender == oracle || msg.sender == owner(),
            "CacaoHarvestNFT: caller is not oracle or owner"
        );
        
        HarvestData storage data = _harvestData[tokenId];
        
        require(!data.deforestationStatus, "CacaoHarvestNFT: already flagged");

        data.deforestationStatus = true;

        emit DeforestationDetected(tokenId, data.farmerId, block.timestamp);
    }

    /**
     * @notice Update metadata URI for additional off-chain data
     * @param tokenId NFT to update
     * @param newURI New IPFS or HTTP URI
     * 
     * @dev Only oracle can call
     * @dev Allows updating photos, documents, etc. as harvest progresses
     */
    function updateMetadataURI(
        uint256 tokenId,
        string calldata newURI
    ) external onlyOracle tokenExists(tokenId) {
        _setTokenURI(tokenId, newURI);
        _harvestData[tokenId].metadataURI = newURI;

        emit MetadataURIUpdated(tokenId, newURI);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get complete harvest data for a token
     * @param tokenId NFT to query
     * @return data Complete HarvestData struct with all fields
     */
    function getHarvestData(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (HarvestData memory data) 
    {
        return _harvestData[tokenId];
    }

    /**
     * @notice Get all NFT IDs owned by a farmer
     * @param farmerId Farmer address to query
     * @return tokenIds Array of token IDs (empty array if no harvests)
     * 
     * @dev Useful for farmer dashboards showing all their harvest history
     */
    function getFarmerHarvests(address farmerId) 
        external 
        view 
        returns (uint256[] memory tokenIds) 
    {
        return _farmerHarvests[farmerId];
    }

    /**
     * @notice Check if a harvest has been flagged for deforestation
     * @param tokenId NFT to check
     * @return flagged True if deforestation was detected
     */
    function isDeforestationFlagged(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId) 
        returns (bool flagged) 
    {
        return _harvestData[tokenId].deforestationStatus;
    }

    /**
     * @notice Get the total number of harvests ever created
     * @return count Total supply of NFTs
     */
    function totalHarvests() external view returns (uint256 count) {
        return _nextTokenId;
    }

    /**
     * @notice Get milestone timestamp for a specific stage
     * @param tokenId NFT to query
     * @param milestone Which milestone to check
     * @return timestamp Unix timestamp (0 if milestone not reached yet)
     */
    function getMilestoneTimestamp(uint256 tokenId, Milestone milestone)
        external
        view
        tokenExists(tokenId)
        returns (uint256 timestamp)
    {
        return _harvestData[tokenId].milestoneHistory[uint256(milestone)];
    }

    // ============================================
    // OVERRIDES
    // ============================================

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

