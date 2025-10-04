// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IFarmerReputationBadge
 * @notice Interface for soulbound reputation NFTs
 */
interface IFarmerReputationBadge {
    enum Tier {
        Bronze,
        Silver,
        Gold,
        Platinum
    }

    event BadgeMinted(address indexed farmer, uint256 tokenId);
    event ScoreUpdated(address indexed farmer, int256 oldScore, int256 newScore, string reason);
    event TierUpgraded(address indexed farmer, Tier oldTier, Tier newTier);
    event TierDowngraded(address indexed farmer, Tier oldTier, Tier newTier);
    event DeforestationPenalty(address indexed farmer, uint256 penaltyPoints);

    struct FarmerStats {
        int256 score;
        Tier tier;
        uint256 totalHarvests;
        uint256 successfulHarvests;
        uint256 deforestationIncidents;
        uint256 onTimeCompletions;
        uint256 premiumQualityCount;
        uint256 lastUpdateTimestamp;
    }

    function mintBadge(address farmer) external returns (uint256 tokenId);
    
    function updateScore(
        address farmer,
        uint256 milestonesCompleted,
        bool onTime,
        bool zeroDeforestation,
        bool premiumQuality
    ) external;
    
    function applyDeforestationPenalty(address farmer) external;
    
    function getFarmerScore(address farmer) external view returns (int256 score);
    
    function getFarmerTier(address farmer) external view returns (Tier tier);
    
    function getFarmerStats(address farmer) external view returns (FarmerStats memory stats);
    
    function hasBadge(address farmer) external view returns (bool);
}

