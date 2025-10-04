// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./interfaces/ICacaoEscrow.sol";
import "./interfaces/ICacaoHarvestNFT.sol";
import "./interfaces/IFarmerReputationBadge.sol";

/**
 * @title CacaoEscrow
 * @notice Milestone-based escrow system for cacao farmer financing with reputation tracking
 * @dev Integrates CacaoHarvestNFT and FarmerReputationBadge for complete RealFi platform
 * 
 * Key features:
 * - Milestone-based fund releases (4 stages, 25% each)
 * - Oracle-verified satellite monitoring
 * - Automatic reputation scoring
 * - Deforestation detection and penalties
 * - Investor protection with cancellation rights
 * - Gas-optimized for farmer affordability
 * 
 * @custom:security-contact security@unlock-harvest.org
 */
contract CacaoEscrow is ICacaoEscrow, ReentrancyGuard, Pausable, Ownable2Step {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice USDC token (6 decimals)
    address public immutable cUSD; // Named cUSD for backward compatibility

    /// @notice Authorized oracle address
    address public immutable oracle;

    /// @notice CacaoHarvestNFT contract
    ICacaoHarvestNFT private immutable _harvestNFT;

    /// @notice FarmerReputationBadge contract
    IFarmerReputationBadge private immutable _reputationBadge;

    /// @notice Next escrow ID
    uint256 private _nextEscrowId;

    /// @notice Mapping from escrow ID to escrow data
    mapping(uint256 => EscrowData) private _escrows;

    /// @notice Mapping from farmer to escrow IDs
    mapping(address => uint256[]) private _farmerEscrows;

    /// @notice Mapping from investor to escrow IDs
    mapping(address => uint256[]) private _investorEscrows;

    // ============================================
    // CONSTANTS
    // ============================================

    /// @notice Default deadline (6 months in seconds)
    uint256 public constant DEFAULT_DEADLINE = 180 days;

    /// @notice Minimum escrow amount (0.01 USDC - 6 decimals)
    uint256 public constant MIN_ESCROW_AMOUNT = 10_000; // 0.01 USDC

    /// @notice Maximum escrow amount (100,000 USDC - 6 decimals)
    uint256 public constant MAX_ESCROW_AMOUNT = 100_000_000_000; // 100,000 USDC

    /// @notice Milestone release percentage (25%)
    uint256 public constant MILESTONE_PERCENTAGE = 25;

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Restricts function access to oracle only
     */
    modifier onlyOracle() {
        require(msg.sender == oracle, "CacaoEscrow: caller is not oracle");
        _;
    }

    /**
     * @notice Ensures escrow exists and is active
     */
    modifier escrowExists(uint256 escrowId) {
        require(escrowId < _nextEscrowId, "CacaoEscrow: escrow does not exist");
        _;
    }

    /**
     * @notice Ensures escrow is active
     */
    modifier escrowActive(uint256 escrowId) {
        require(
            _escrows[escrowId].status == EscrowStatus.Active,
            "CacaoEscrow: escrow not active"
        );
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Deploy the CacaoEscrow contract
     * @param cUSDAddress USDC token address (6 decimals)
     * @param oracleAddress Oracle address for verification
     * @param harvestNFTAddress CacaoHarvestNFT contract address
     * @param reputationBadgeAddress FarmerReputationBadge contract address
     */
    constructor(
        address cUSDAddress,
        address oracleAddress,
        address harvestNFTAddress,
        address reputationBadgeAddress
    ) Ownable(msg.sender) {
        require(cUSDAddress != address(0), "CacaoEscrow: zero token address");
        require(oracleAddress != address(0), "CacaoEscrow: zero oracle address");
        require(harvestNFTAddress != address(0), "CacaoEscrow: zero NFT address");
        require(reputationBadgeAddress != address(0), "CacaoEscrow: zero badge address");

        cUSD = cUSDAddress;
        oracle = oracleAddress;
        _harvestNFT = ICacaoHarvestNFT(harvestNFTAddress);
        _reputationBadge = IFarmerReputationBadge(reputationBadgeAddress);
    }

    // ============================================
    // ESCROW CREATION
    // ============================================

    /**
     * @notice Create new escrow for farmer financing
     * @param farmer Address of the farmer
     * @param amount Total financing amount in USDC (6 decimals)
     * @param deadline Unix timestamp for completion (0 = default 6 months)
     * @param metadataURI IPFS URI for harvest documentation
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address farmer,
        uint256 amount,
        uint256 deadline,
        string calldata metadataURI
    ) external nonReentrant whenNotPaused returns (uint256 escrowId) {
        require(farmer != address(0), "CacaoEscrow: zero farmer address");
        require(farmer != msg.sender, "CacaoEscrow: farmer cannot be investor");
        require(amount >= MIN_ESCROW_AMOUNT, "CacaoEscrow: amount too low");
        require(amount <= MAX_ESCROW_AMOUNT, "CacaoEscrow: amount too high");

        // Set deadline (default 6 months if not specified)
        uint256 finalDeadline = deadline == 0 
            ? block.timestamp + DEFAULT_DEADLINE 
            : deadline;
        require(finalDeadline > block.timestamp, "CacaoEscrow: deadline in past");

        // Transfer USDC from investor to escrow
        IERC20(cUSD).safeTransferFrom(msg.sender, address(this), amount);

        // Get next escrow ID
        escrowId = _nextEscrowId++;

        // Mint harvest NFT to farmer
        uint256 nftTokenId = _harvestNFT.mintHarvest(farmer, escrowId, metadataURI);

        // Mint reputation badge if first escrow
        if (!_reputationBadge.hasBadge(farmer)) {
            _reputationBadge.mintBadge(farmer);
        }

        // Initialize escrow data
        EscrowData storage escrow = _escrows[escrowId];
        escrow.investor = msg.sender;
        escrow.farmer = farmer;
        escrow.amount = amount;
        escrow.currentMilestone = Milestone.LandVerified;
        escrow.nftTokenId = nftTokenId;
        escrow.createdAt = block.timestamp;
        escrow.deadline = finalDeadline;
        escrow.status = EscrowStatus.Active;
        // deforestationFlagged and premiumQuality default to false
        // milestonePaidAmount defaults to [0,0,0,0]

        // Track escrows
        _farmerEscrows[farmer].push(escrowId);
        _investorEscrows[msg.sender].push(escrowId);

        emit EscrowCreated(
            escrowId,
            msg.sender,
            farmer,
            amount,
            nftTokenId,
            finalDeadline
        );
    }

    // ============================================
    // MILESTONE MANAGEMENT
    // ============================================

    /**
     * @notice Approve milestone and release funds
     * @param escrowId Escrow to update
     * @param proofHash IPFS hash of satellite/verification proof
     */
    function approveMilestone(
        uint256 escrowId,
        string calldata proofHash
    ) external onlyOracle escrowExists(escrowId) escrowActive(escrowId) nonReentrant {
        EscrowData storage escrow = _escrows[escrowId];

        // Cannot approve if deforestation flagged
        require(!escrow.deforestationFlagged, "CacaoEscrow: deforestation flagged");

        // Calculate amount to release (25% of total)
        uint256 releaseAmount = (escrow.amount * MILESTONE_PERCENTAGE) / 100;

        // Update milestone in NFT (convert enum)
        Milestone nextMilestone = Milestone(uint256(escrow.currentMilestone) + 1);
        ICacaoHarvestNFT.Milestone nftMilestone = ICacaoHarvestNFT.Milestone(uint256(nextMilestone));
        _harvestNFT.updateMilestone(escrow.nftTokenId, nftMilestone);

        // Record payment
        escrow.milestonePaidAmount[uint256(escrow.currentMilestone)] = releaseAmount;

        // Update current milestone
        escrow.currentMilestone = nextMilestone;

        // Transfer funds to farmer
        IERC20(cUSD).safeTransfer(escrow.farmer, releaseAmount);

        emit MilestoneApproved(
            escrowId,
            nextMilestone,
            releaseAmount,
            proofHash
        );

        // Check if escrow completed
        if (nextMilestone == Milestone.Harvested) {
            _completeEscrow(escrowId);
        }
    }

    /**
     * @notice Complete escrow and update reputation
     * @param escrowId Escrow to complete
     */
    function _completeEscrow(uint256 escrowId) private {
        EscrowData storage escrow = _escrows[escrowId];

        // Pay final milestone (Harvested) - 25%
        uint256 finalPayment = (escrow.amount * MILESTONE_PERCENTAGE) / 100;
        escrow.milestonePaidAmount[uint256(Milestone.Harvested)] = finalPayment;
        IERC20(cUSD).safeTransfer(escrow.farmer, finalPayment);

        // Mark as completed
        escrow.status = EscrowStatus.Completed;

        // Calculate total paid
        uint256 totalPaid = 0;
        for (uint256 i = 0; i < 4; i++) {
            totalPaid += escrow.milestonePaidAmount[i];
        }

        // Update reputation score
        bool onTime = block.timestamp <= escrow.deadline;
        bool zeroDeforestation = !escrow.deforestationFlagged;
        
        _reputationBadge.updateScore(
            escrow.farmer,
            4, // All 4 milestones completed
            onTime,
            zeroDeforestation,
            escrow.premiumQuality
        );

        emit EscrowCompleted(escrowId, escrow.farmer, totalPaid);
    }

    // ============================================
    // QUALITY & DEFORESTATION MANAGEMENT
    // ============================================

    /**
     * @notice Flag deforestation for an escrow
     * @param escrowId Escrow to flag
     */
    function flagDeforestation(
        uint256 escrowId
    ) external onlyOracle escrowExists(escrowId) escrowActive(escrowId) {
        EscrowData storage escrow = _escrows[escrowId];

        require(!escrow.deforestationFlagged, "CacaoEscrow: already flagged");

        escrow.deforestationFlagged = true;

        // Flag in NFT
        _harvestNFT.flagDeforestation(escrow.nftTokenId);

        // Apply reputation penalty
        _reputationBadge.applyDeforestationPenalty(escrow.farmer);

        emit DeforestationFlagged(escrowId, escrow.farmer, block.timestamp);
    }

    /**
     * @notice Confirm premium quality harvest
     * @param escrowId Escrow to update
     */
    function confirmPremiumQuality(
        uint256 escrowId
    ) external onlyOracle escrowExists(escrowId) {
        EscrowData storage escrow = _escrows[escrowId];

        require(!escrow.premiumQuality, "CacaoEscrow: already confirmed");
        require(
            escrow.currentMilestone == Milestone.Harvested,
            "CacaoEscrow: must be at harvest milestone"
        );
        require(
            escrow.status == EscrowStatus.Active || escrow.status == EscrowStatus.Completed,
            "CacaoEscrow: escrow cancelled"
        );

        escrow.premiumQuality = true;

        emit PremiumQualityConfirmed(escrowId, escrow.farmer);
    }

    // ============================================
    // CANCELLATION
    // ============================================

    /**
     * @notice Cancel escrow before first milestone
     * @param escrowId Escrow to cancel
     */
    function cancelEscrow(
        uint256 escrowId
    ) external escrowExists(escrowId) escrowActive(escrowId) nonReentrant {
        EscrowData storage escrow = _escrows[escrowId];

        require(msg.sender == escrow.investor, "CacaoEscrow: not investor");
        require(
            escrow.currentMilestone == Milestone.LandVerified,
            "CacaoEscrow: milestones already started"
        );

        // Check if any funds were already released
        uint256 totalPaid = 0;
        for (uint256 i = 0; i < 4; i++) {
            totalPaid += escrow.milestonePaidAmount[i];
        }
        require(totalPaid == 0, "CacaoEscrow: funds already released");

        // Mark as cancelled
        escrow.status = EscrowStatus.Cancelled;

        // Refund full amount to investor
        IERC20(cUSD).safeTransfer(escrow.investor, escrow.amount);

        emit EscrowCancelled(escrowId, escrow.investor, escrow.amount);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get escrow data
     * @param escrowId Escrow to query
     * @return data Complete escrow information
     */
    function getEscrow(uint256 escrowId) external view escrowExists(escrowId) returns (EscrowData memory data) {
        return _escrows[escrowId];
    }

    /**
     * @notice Get escrows for a farmer
     * @param farmer Farmer address
     * @return escrowIds Array of escrow IDs
     */
    function getFarmerEscrows(address farmer) external view returns (uint256[] memory escrowIds) {
        return _farmerEscrows[farmer];
    }

    /**
     * @notice Get escrows for an investor
     * @param investor Investor address
     * @return escrowIds Array of escrow IDs
     */
    function getInvestorEscrows(address investor) external view returns (uint256[] memory escrowIds) {
        return _investorEscrows[investor];
    }

    /**
     * @notice Check if milestone is on time
     * @param escrowId Escrow to check
     * @return onTime True if current milestone is before deadline
     */
    function isMilestoneOnTime(uint256 escrowId) external view escrowExists(escrowId) returns (bool onTime) {
        return block.timestamp <= _escrows[escrowId].deadline;
    }

    /**
     * @notice Get total number of escrows created
     * @return count Total escrow count
     */
    function totalEscrows() external view returns (uint256 count) {
        return _nextEscrowId;
    }

    /**
     * @notice Get harvest NFT contract address
     * @return nft CacaoHarvestNFT address
     */
    function harvestNFT() external view returns (address nft) {
        return address(_harvestNFT);
    }

    /**
     * @notice Get reputation badge contract address
     * @return badge FarmerReputationBadge address
     */
    function reputationBadge() external view returns (address badge) {
        return address(_reputationBadge);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Accept ownership of HarvestNFT contract (owner only)
     * @dev Required after transferOwnership due to Ownable2Step pattern
     */
    function acceptHarvestNFTOwnership() external onlyOwner {
        // Cast to Ownable2Step to call acceptOwnership()
        Ownable2Step(address(_harvestNFT)).acceptOwnership();
    }

    // ============================================
    // EMERGENCY FUNCTIONS
    // ============================================

    /**
     * @notice Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

