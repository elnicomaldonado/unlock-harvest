// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./interfaces/IFarmerReputationBadge.sol";

/**
 * @title FarmerReputationBadge
 * @notice Soulbound NFTs representing farmer reputation with dynamic on-chain scoring
 * @dev Non-transferable ERC-721 tokens that build credit history for smallholder farmers
 * 
 * Key features:
 * - Soulbound (cannot be transferred or sold)
 * - One badge per farmer address
 * - Dynamic score based on harvest performance
 * - Automatic tier progression (Bronze → Silver → Gold → Platinum)
 * - On-chain metadata with SVG badges
 * - Complete performance history
 * 
 * Scoring rules:
 * - +25 points per on-time milestone
 * - +50 points for zero deforestation
 * - +30 points for premium quality
 * - -100 points for deforestation
 * 
 * @custom:security-contact security@unlock-harvest.org
 */
contract FarmerReputationBadge is ERC721, Ownable2Step, IFarmerReputationBadge {
    using Strings for uint256;
    using Strings for int256;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Authorized escrow contract address
    address public escrowContract;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @notice Mapping from farmer address to their token ID
    mapping(address => uint256) private _farmerToTokenId;

    /// @notice Mapping from farmer address to their statistics
    mapping(address => FarmerStats) private _farmerStats;

    /// @notice Mapping to track if farmer has a badge
    mapping(address => bool) private _hasBadge;

    // ============================================
    // CONSTANTS
    // ============================================

    /// @notice Points awarded per on-time milestone completion
    uint256 public constant POINTS_PER_MILESTONE = 25;

    /// @notice Bonus points for zero deforestation in full cycle
    uint256 public constant ZERO_DEFORESTATION_BONUS = 50;

    /// @notice Bonus points for premium quality harvest
    uint256 public constant PREMIUM_QUALITY_BONUS = 30;

    /// @notice Penalty points for deforestation detection
    uint256 public constant DEFORESTATION_PENALTY = 100;

    /// @notice Tier thresholds
    int256 public constant SILVER_THRESHOLD = 200;
    int256 public constant GOLD_THRESHOLD = 300;
    int256 public constant PLATINUM_THRESHOLD = 400;

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Restricts function access to escrow contract only
     */
    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "FarmerReputationBadge: caller is not escrow");
        _;
    }

    /**
     * @notice Ensures farmer has a badge
     */
    modifier hasBadgeOnly(address farmer) {
        require(_hasBadge[farmer], "FarmerReputationBadge: farmer has no badge");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Deploy the FarmerReputationBadge contract
     * @param _escrow Address of the escrow contract (can update later)
     */
    constructor(address _escrow) ERC721("Farmer Reputation Badge", "REPUTATION") Ownable(msg.sender) {
        escrowContract = _escrow;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update escrow contract address (owner only)
     * @param newEscrow New escrow contract address
     */
    function setEscrowContract(address newEscrow) external onlyOwner {
        require(newEscrow != address(0), "FarmerReputationBadge: zero address");
        escrowContract = newEscrow;
    }

    // ============================================
    // BADGE MINTING
    // ============================================

    /**
     * @notice Mint initial badge for a new farmer
     * @param farmer Address of the farmer
     * @return tokenId The ID of the newly minted badge
     * @dev Escrow-only, one badge per farmer
     */
    function mintBadge(address farmer) external onlyEscrow returns (uint256 tokenId) {
        require(farmer != address(0), "FarmerReputationBadge: zero address");
        require(!_hasBadge[farmer], "FarmerReputationBadge: farmer already has badge");

        tokenId = _nextTokenId++;
        _safeMint(farmer, tokenId);

        _farmerToTokenId[farmer] = tokenId;
        _hasBadge[farmer] = true;

        // Initialize stats at Bronze tier with 0 score
        _farmerStats[farmer] = FarmerStats({
            score: 0,
            tier: Tier.Bronze,
            totalHarvests: 0,
            successfulHarvests: 0,
            deforestationIncidents: 0,
            onTimeCompletions: 0,
            premiumQualityCount: 0,
            lastUpdateTimestamp: block.timestamp
        });

        emit BadgeMinted(farmer, tokenId);
    }

    // ============================================
    // SCORE UPDATES
    // ============================================

    /**
     * @notice Update farmer's reputation based on harvest performance
     * @param farmer Address of the farmer
     * @param milestonesCompleted Number of milestones completed (0-4)
     * @param onTime Whether milestones were completed on schedule
     * @param zeroDeforestation Whether no deforestation was detected
     * @param premiumQuality Whether harvest met premium standards
     */
    function updateScore(
        address farmer,
        uint256 milestonesCompleted,
        bool onTime,
        bool zeroDeforestation,
        bool premiumQuality
    ) external onlyEscrow hasBadgeOnly(farmer) {
        require(milestonesCompleted <= 4, "FarmerReputationBadge: invalid milestone count");

        FarmerStats storage stats = _farmerStats[farmer];
        int256 oldScore = stats.score;
        int256 pointsToAdd = 0;
        string memory reason = "";

        // Calculate points from milestones
        if (onTime && milestonesCompleted > 0) {
            pointsToAdd += int256(milestonesCompleted * POINTS_PER_MILESTONE);
            stats.onTimeCompletions += milestonesCompleted;
            reason = string.concat(reason, "On-time milestones: +", uint256(milestonesCompleted * POINTS_PER_MILESTONE).toString(), " ");
        }

        // Zero deforestation bonus
        if (zeroDeforestation) {
            pointsToAdd += int256(ZERO_DEFORESTATION_BONUS);
            reason = string.concat(reason, "Zero deforestation: +", ZERO_DEFORESTATION_BONUS.toString(), " ");
        }

        // Premium quality bonus
        if (premiumQuality) {
            pointsToAdd += int256(PREMIUM_QUALITY_BONUS);
            stats.premiumQualityCount += 1;
            reason = string.concat(reason, "Premium quality: +", PREMIUM_QUALITY_BONUS.toString(), " ");
        }

        // Update score and stats
        stats.score += pointsToAdd;
        stats.totalHarvests += 1;
        if (pointsToAdd > 0) {
            stats.successfulHarvests += 1;
        }
        stats.lastUpdateTimestamp = block.timestamp;

        emit ScoreUpdated(farmer, oldScore, stats.score, reason);

        // Check for tier change
        _updateTier(farmer);
    }

    /**
     * @notice Apply deforestation penalty to farmer
     * @param farmer Address of the farmer
     */
    function applyDeforestationPenalty(address farmer) external onlyEscrow hasBadgeOnly(farmer) {
        FarmerStats storage stats = _farmerStats[farmer];
        int256 oldScore = stats.score;

        stats.score -= int256(DEFORESTATION_PENALTY);
        stats.deforestationIncidents += 1;
        stats.totalHarvests += 1;
        stats.lastUpdateTimestamp = block.timestamp;

        emit DeforestationPenalty(farmer, DEFORESTATION_PENALTY);
        emit ScoreUpdated(farmer, oldScore, stats.score, "Deforestation penalty: -100");

        // Check for tier downgrade
        _updateTier(farmer);
    }

    /**
     * @notice Internal function to update farmer's tier based on score
     * @param farmer Address of the farmer
     */
    function _updateTier(address farmer) private {
        FarmerStats storage stats = _farmerStats[farmer];
        Tier oldTier = stats.tier;
        Tier newTier = _calculateTier(stats.score);

        if (newTier != oldTier) {
            stats.tier = newTier;
            
            if (newTier > oldTier) {
                emit TierUpgraded(farmer, oldTier, newTier);
            } else {
                emit TierDowngraded(farmer, oldTier, newTier);
            }
        }
    }

    /**
     * @notice Calculate tier based on score
     * @param score Reputation score
     * @return tier Calculated tier
     */
    function _calculateTier(int256 score) private pure returns (Tier tier) {
        if (score >= PLATINUM_THRESHOLD) {
            return Tier.Platinum;
        } else if (score >= GOLD_THRESHOLD) {
            return Tier.Gold;
        } else if (score >= SILVER_THRESHOLD) {
            return Tier.Silver;
        } else {
            return Tier.Bronze;
        }
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get farmer's current reputation score
     * @param farmer Address to query
     * @return score Current reputation points
     */
    function getFarmerScore(address farmer) external view hasBadgeOnly(farmer) returns (int256 score) {
        return _farmerStats[farmer].score;
    }

    /**
     * @notice Get farmer's current tier
     * @param farmer Address to query
     * @return tier Current reputation tier
     */
    function getFarmerTier(address farmer) external view hasBadgeOnly(farmer) returns (Tier tier) {
        return _farmerStats[farmer].tier;
    }

    /**
     * @notice Get comprehensive farmer statistics
     * @param farmer Address to query
     * @return stats Complete FarmerStats struct
     */
    function getFarmerStats(address farmer) external view hasBadgeOnly(farmer) returns (FarmerStats memory stats) {
        return _farmerStats[farmer];
    }

    /**
     * @notice Check if farmer has a badge
     * @param farmer Address to check
     * @return True if farmer has been issued a badge
     */
    function hasBadge(address farmer) external view returns (bool) {
        return _hasBadge[farmer];
    }

    /**
     * @notice Get token ID for a farmer's badge
     * @param farmer Address to query
     * @return tokenId The NFT token ID
     */
    function getFarmerTokenId(address farmer) external view hasBadgeOnly(farmer) returns (uint256 tokenId) {
        return _farmerToTokenId[farmer];
    }

    /**
     * @notice Get tier name as string
     * @param tier Tier enum value
     * @return name Human-readable tier name
     */
    function getTierName(Tier tier) public pure returns (string memory name) {
        if (tier == Tier.Bronze) return "Bronze";
        if (tier == Tier.Silver) return "Silver";
        if (tier == Tier.Gold) return "Gold";
        if (tier == Tier.Platinum) return "Platinum";
        return "Unknown";
    }

    /**
     * @notice Get tier color for UI
     * @param tier Tier enum value
     * @return color Hex color code
     */
    function getTierColor(Tier tier) public pure returns (string memory color) {
        if (tier == Tier.Bronze) return "#CD7F32";
        if (tier == Tier.Silver) return "#C0C0C0";
        if (tier == Tier.Gold) return "#FFD700";
        if (tier == Tier.Platinum) return "#E5E4E2";
        return "#000000";
    }

    /**
     * @notice Get minimum score for tier
     * @param tier Tier to query
     * @return minScore Minimum points needed
     */
    function getTierThreshold(Tier tier) public pure returns (int256 minScore) {
        if (tier == Tier.Bronze) return 0;
        if (tier == Tier.Silver) return SILVER_THRESHOLD;
        if (tier == Tier.Gold) return GOLD_THRESHOLD;
        if (tier == Tier.Platinum) return PLATINUM_THRESHOLD;
        return 0;
    }

    // ============================================
    // METADATA GENERATION
    // ============================================

    /**
     * @notice Generate dynamic metadata for badge NFT
     * @param tokenId Token ID to generate metadata for
     * @return JSON metadata with SVG badge
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address farmer = ownerOf(tokenId);
        FarmerStats memory stats = _farmerStats[farmer];
        
        string memory tierName = getTierName(stats.tier);
        string memory tierColor = getTierColor(stats.tier);
        
        // Generate SVG badge
        string memory svg = _generateBadgeSVG(tierName, tierColor, stats.score);
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name": "Farmer Reputation Badge - ',
                    tierName,
                    '", "description": "Soulbound reputation badge for cacao farmer with on-chain performance history.", "image": "data:image/svg+xml;base64,',
                    Base64.encode(bytes(svg)),
                    '", "attributes": [{"trait_type": "Tier", "value": "',
                    tierName,
                    '"}, {"trait_type": "Score", "value": ',
                    _int256ToString(stats.score),
                    '}, {"trait_type": "Total Harvests", "value": ',
                    stats.totalHarvests.toString(),
                    '}, {"trait_type": "Successful Harvests", "value": ',
                    stats.successfulHarvests.toString(),
                    '}, {"trait_type": "Deforestation Incidents", "value": ',
                    stats.deforestationIncidents.toString(),
                    '}]}'
                )
            )
        );
        
        return string.concat("data:application/json;base64,", json);
    }

    /**
     * @notice Generate SVG badge image
     * @param tierName Name of the tier
     * @param tierColor Color hex code
     * @param score Current score
     * @return SVG string
     */
    function _generateBadgeSVG(
        string memory tierName,
        string memory tierColor,
        int256 score
    ) private pure returns (string memory) {
        return string.concat(
            '<svg width="350" height="350" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="350" height="350" fill="',
            tierColor,
            '" rx="20"/>',
            '<circle cx="175" cy="120" r="70" fill="white" opacity="0.3"/>',
            '<text x="175" y="135" font-size="48" fill="white" text-anchor="middle" font-weight="bold">',
            tierName,
            '</text>',
            '<text x="175" y="200" font-size="32" fill="white" text-anchor="middle">Score: ',
            _int256ToString(score),
            '</text>',
            '<text x="175" y="250" font-size="18" fill="white" text-anchor="middle" opacity="0.8">Farmer Reputation</text>',
            '<text x="175" y="280" font-size="14" fill="white" text-anchor="middle" opacity="0.6">Soulbound Token</text>',
            '</svg>'
        );
    }

    /**
     * @notice Convert int256 to string (handles negatives)
     * @param value Integer value
     * @return String representation
     */
    function _int256ToString(int256 value) private pure returns (string memory) {
        if (value < 0) {
            return string.concat("-", uint256(-value).toString());
        }
        return uint256(value).toString();
    }

    // ============================================
    // SOULBOUND ENFORCEMENT
    // ============================================

    /**
     * @notice Override transfer to make token soulbound
     * @dev Always reverts - badges cannot be transferred
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != address(0) && to != address(0))
        // Allow burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert("FarmerReputationBadge: soulbound token cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Override approve to prevent approval
     * @dev Always reverts - badges cannot be approved
     */
    function approve(address, uint256) public pure override {
        revert("FarmerReputationBadge: soulbound token cannot be approved");
    }

    /**
     * @notice Override setApprovalForAll to prevent approval
     * @dev Always reverts - badges cannot be approved
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("FarmerReputationBadge: soulbound token cannot be approved");
    }
}

