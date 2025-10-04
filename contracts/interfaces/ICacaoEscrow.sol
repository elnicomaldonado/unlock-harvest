// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title ICacaoEscrow
 * @notice Interface for milestone-based escrow system for cacao farmer financing
 * @dev Integrates with CacaoHarvestNFT and FarmerReputationBadge for complete farmer credit system
 */
interface ICacaoEscrow {
    /**
     * @notice Milestone stages in the harvest cycle
     */
    enum Milestone {
        LandVerified,  // 0 - Initial land verification (25% release)
        Planted,       // 1 - Seeds planted (25% release)
        MidGrowth,     // 2 - Mid-cycle check (25% release)
        Harvested      // 3 - Harvest complete (25% release)
    }

    /**
     * @notice Escrow status
     */
    enum EscrowStatus {
        Active,      // 0 - Escrow is active
        Completed,   // 1 - All milestones completed
        Cancelled    // 2 - Escrow cancelled/refunded
    }

    /**
     * @notice Complete escrow data stored on-chain
     */
    struct EscrowData {
        address investor;
        address farmer;
        uint256 amount;
        Milestone currentMilestone;
        uint256[4] milestonePaidAmount;  // Amount paid at each milestone
        uint256 nftTokenId;
        uint256 createdAt;
        uint256 deadline;
        bool deforestationFlagged;
        bool premiumQuality;
        EscrowStatus status;
    }

    /**
     * @notice Emitted when new escrow is created
     */
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed investor,
        address indexed farmer,
        uint256 amount,
        uint256 nftTokenId,
        uint256 deadline
    );

    /**
     * @notice Emitted when milestone is approved and funds released
     */
    event MilestoneApproved(
        uint256 indexed escrowId,
        Milestone milestone,
        uint256 amountReleased,
        string proofHash
    );

    /**
     * @notice Emitted when deforestation is flagged
     */
    event DeforestationFlagged(
        uint256 indexed escrowId,
        address indexed farmer,
        uint256 timestamp
    );

    /**
     * @notice Emitted when premium quality is confirmed
     */
    event PremiumQualityConfirmed(
        uint256 indexed escrowId,
        address indexed farmer
    );

    /**
     * @notice Emitted when escrow is completed
     */
    event EscrowCompleted(
        uint256 indexed escrowId,
        address indexed farmer,
        uint256 totalPaid
    );

    /**
     * @notice Emitted when escrow is cancelled
     */
    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed investor,
        uint256 refundAmount
    );

    /**
     * @notice Create new escrow for farmer financing
     * @param farmer Address of the farmer
     * @param amount Total financing amount in cUSD
     * @param deadline Unix timestamp for completion (0 = default 6 months)
     * @param metadataURI IPFS URI for harvest documentation
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address farmer,
        uint256 amount,
        uint256 deadline,
        string calldata metadataURI
    ) external returns (uint256 escrowId);

    /**
     * @notice Approve milestone and release funds (oracle-only)
     * @param escrowId Escrow to update
     * @param proofHash IPFS hash of satellite/verification proof
     */
    function approveMilestone(
        uint256 escrowId,
        string calldata proofHash
    ) external;

    /**
     * @notice Flag deforestation for an escrow (oracle-only)
     * @param escrowId Escrow to flag
     */
    function flagDeforestation(uint256 escrowId) external;

    /**
     * @notice Confirm premium quality harvest (oracle-only)
     * @param escrowId Escrow to update
     */
    function confirmPremiumQuality(uint256 escrowId) external;

    /**
     * @notice Cancel escrow before first milestone (investor-only)
     * @param escrowId Escrow to cancel
     */
    function cancelEscrow(uint256 escrowId) external;

    /**
     * @notice Get escrow data
     * @param escrowId Escrow to query
     * @return data Complete escrow information
     */
    function getEscrow(uint256 escrowId) external view returns (EscrowData memory data);

    /**
     * @notice Get escrows for a farmer
     * @param farmer Farmer address
     * @return escrowIds Array of escrow IDs
     */
    function getFarmerEscrows(address farmer) external view returns (uint256[] memory escrowIds);

    /**
     * @notice Get escrows for an investor
     * @param investor Investor address
     * @return escrowIds Array of escrow IDs
     */
    function getInvestorEscrows(address investor) external view returns (uint256[] memory escrowIds);

    /**
     * @notice Check if milestone is on time
     * @param escrowId Escrow to check
     * @return onTime True if current milestone is before deadline
     */
    function isMilestoneOnTime(uint256 escrowId) external view returns (bool onTime);

    /**
     * @notice Get total number of escrows created
     * @return count Total escrow count
     */
    function totalEscrows() external view returns (uint256 count);

    /**
     * @notice Get cUSD token address
     * @return token cUSD address
     */
    function cUSD() external view returns (address token);

    /**
     * @notice Get oracle address
     * @return oracle Oracle address
     */
    function oracle() external view returns (address oracle);

    /**
     * @notice Get harvest NFT contract address
     * @return nft CacaoHarvestNFT address
     */
    function harvestNFT() external view returns (address nft);

    /**
     * @notice Get reputation badge contract address
     * @return badge FarmerReputationBadge address
     */
    function reputationBadge() external view returns (address badge);
}

