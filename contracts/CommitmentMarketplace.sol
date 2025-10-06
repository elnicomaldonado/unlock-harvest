// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./interfaces/ICacaoEscrow.sol";
import "./interfaces/IFarmerReputationBadge.sol";

/**
 * @title CommitmentMarketplace
 * @notice Marketplace for buyers to create purchase commitments and farmers to apply
 * @dev Integrates with CacaoEscrow, FarmerReputationBadge, and CacaoHarvestNFT
 * 
 * Flow:
 * 1. Buyer creates commitment (deposits USDC)
 * 2. Farmers apply (reputation check)
 * 3. Buyer approves farmer → creates escrow → mints NFT
 * 
 * @custom:security-contact security@unlock-harvest.org
 */
contract CommitmentMarketplace is ReentrancyGuard, Pausable, Ownable2Step {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice CacaoEscrow contract for creating escrows
    ICacaoEscrow public immutable escrowContract;

    /// @notice FarmerReputationBadge contract for reputation checks
    IFarmerReputationBadge public immutable reputationContract;

    /// @notice USDC token address (from escrow)
    address public immutable usdc;

    /// @notice Next commitment ID
    uint256 private _nextCommitmentId;

    /// @notice Mapping from commitment ID to commitment data
    mapping(uint256 => Commitment) private _commitments;

    /// @notice Mapping from commitment ID to array of applicant addresses
    mapping(uint256 => address[]) private _applicants;

    /// @notice Mapping from commitment ID to farmer address to application index
    mapping(uint256 => mapping(address => uint256)) private _applicationIndex;

    /// @notice Mapping from buyer to their commitment IDs
    mapping(address => uint256[]) private _buyerCommitments;

    /// @notice Mapping from farmer to commitment IDs they've applied to
    mapping(address => uint256[]) private _farmerApplications;

    // ============================================
    // STRUCTS & ENUMS
    // ============================================

    /**
     * @notice Status of a commitment
     */
    enum CommitmentStatus {
        Open,        // 0 - Open for applications
        Accepted,    // 1 - Farmer accepted, escrow created
        Cancelled,   // 2 - Cancelled by buyer
        Expired      // 3 - Expired (past deadline)
    }

    /**
     * @notice Purchase commitment data
     */
    struct Commitment {
        address buyer;
        uint256 amount;            // Amount in USDC (6 decimals)
        int256 minReputation;      // Minimum reputation score required
        uint256 deadline;          // Deadline for farmer to deliver
        uint256 createdAt;
        string metadataURI;        // IPFS URI with commitment details
        CommitmentStatus status;
        address acceptedFarmer;    // Farmer who was accepted (if any)
        uint256 escrowId;          // Escrow ID (if created)
    }

    // ============================================
    // EVENTS
    // ============================================

    event CommitmentCreated(
        uint256 indexed commitmentId,
        address indexed buyer,
        uint256 amount,
        int256 minReputation,
        uint256 deadline
    );

    event FarmerApplied(
        uint256 indexed commitmentId,
        address indexed farmer,
        int256 reputation
    );

    event FarmerAccepted(
        uint256 indexed commitmentId,
        address indexed buyer,
        address indexed farmer,
        uint256 escrowId
    );

    event CommitmentCancelled(
        uint256 indexed commitmentId,
        address indexed buyer,
        uint256 refundAmount
    );

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Ensures commitment exists
     */
    modifier commitmentExists(uint256 commitmentId) {
        require(commitmentId < _nextCommitmentId, "CommitmentMarketplace: commitment does not exist");
        _;
    }

    /**
     * @notice Ensures caller is the buyer of the commitment
     */
    modifier onlyBuyer(uint256 commitmentId) {
        require(
            _commitments[commitmentId].buyer == msg.sender,
            "CommitmentMarketplace: caller is not buyer"
        );
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Deploy the CommitmentMarketplace contract
     * @param _escrowContract CacaoEscrow contract address
     * @param _reputationContract FarmerReputationBadge contract address
     */
    constructor(
        address _escrowContract,
        address _reputationContract
    ) Ownable(msg.sender) {
        require(_escrowContract != address(0), "CommitmentMarketplace: zero escrow address");
        require(_reputationContract != address(0), "CommitmentMarketplace: zero reputation address");

        escrowContract = ICacaoEscrow(_escrowContract);
        reputationContract = IFarmerReputationBadge(_reputationContract);
        usdc = escrowContract.cUSD(); // Get USDC address from escrow
    }

    // ============================================
    // COMMITMENT CREATION
    // ============================================

    /**
     * @notice Create a new purchase commitment
     * @param amount Amount willing to pay in USDC (6 decimals)
     * @param minReputation Minimum reputation score required (-100 to 1000+)
     * @param deadline Unix timestamp deadline for delivery
     * @param metadataURI IPFS URI with commitment details (crop specs, quality, etc.)
     * @return commitmentId The ID of the created commitment
     */
    function createCommitment(
        uint256 amount,
        int256 minReputation,
        uint256 deadline,
        string calldata metadataURI
    ) external nonReentrant whenNotPaused returns (uint256 commitmentId) {
        require(amount >= 10_000, "CommitmentMarketplace: amount too low"); // Min 0.01 USDC
        require(amount <= 100_000_000_000, "CommitmentMarketplace: amount too high"); // Max 100k USDC
        require(deadline > block.timestamp, "CommitmentMarketplace: deadline in past");
        require(bytes(metadataURI).length > 0, "CommitmentMarketplace: empty metadata");

        // Transfer USDC from buyer to marketplace
        IERC20(usdc).safeTransferFrom(msg.sender, address(this), amount);

        // Create commitment
        commitmentId = _nextCommitmentId++;

        _commitments[commitmentId] = Commitment({
            buyer: msg.sender,
            amount: amount,
            minReputation: minReputation,
            deadline: deadline,
            createdAt: block.timestamp,
            metadataURI: metadataURI,
            status: CommitmentStatus.Open,
            acceptedFarmer: address(0),
            escrowId: 0
        });

        // Track buyer's commitments
        _buyerCommitments[msg.sender].push(commitmentId);

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            amount,
            minReputation,
            deadline
        );
    }

    // ============================================
    // FARMER APPLICATION
    // ============================================

    /**
     * @notice Apply to a commitment as a farmer
     * @param commitmentId Commitment to apply to
     */
    function applyToCommitment(
        uint256 commitmentId
    ) external commitmentExists(commitmentId) whenNotPaused {
        Commitment storage commitment = _commitments[commitmentId];

        // Validation
        require(commitment.status == CommitmentStatus.Open, "CommitmentMarketplace: not open");
        require(commitment.deadline > block.timestamp, "CommitmentMarketplace: expired");
        require(msg.sender != commitment.buyer, "CommitmentMarketplace: buyer cannot apply");
        
        // Check if already applied
        require(
            _applicationIndex[commitmentId][msg.sender] == 0 || 
            (_applicants[commitmentId].length > 0 && _applicants[commitmentId][0] != msg.sender),
            "CommitmentMarketplace: already applied"
        );

        // Reputation check - farmer must have badge
        require(
            reputationContract.hasBadge(msg.sender),
            "CommitmentMarketplace: no reputation badge"
        );

        // Get farmer's reputation score
        int256 farmerScore = reputationContract.getFarmerScore(msg.sender);
        
        // Check minimum reputation requirement
        require(
            farmerScore >= commitment.minReputation,
            "CommitmentMarketplace: insufficient reputation"
        );

        // Add to applicants
        _applicants[commitmentId].push(msg.sender);
        _applicationIndex[commitmentId][msg.sender] = _applicants[commitmentId].length;

        // Track farmer's applications
        _farmerApplications[msg.sender].push(commitmentId);

        emit FarmerApplied(commitmentId, msg.sender, farmerScore);
    }

    // ============================================
    // BUYER ACTIONS
    // ============================================

    /**
     * @notice Accept a farmer and create escrow
     * @param commitmentId Commitment ID
     * @param farmer Farmer address to accept
     */
    function acceptFarmer(
        uint256 commitmentId,
        address farmer
    ) external nonReentrant commitmentExists(commitmentId) onlyBuyer(commitmentId) whenNotPaused {
        Commitment storage commitment = _commitments[commitmentId];

        // Validation
        require(commitment.status == CommitmentStatus.Open, "CommitmentMarketplace: not open");
        require(commitment.deadline > block.timestamp, "CommitmentMarketplace: expired");
        
        // Verify farmer has applied
        require(
            _applicationIndex[commitmentId][farmer] > 0 ||
            (_applicants[commitmentId].length > 0 && _applicants[commitmentId][0] == farmer),
            "CommitmentMarketplace: farmer has not applied"
        );

        // Approve escrow contract to spend USDC
        IERC20(usdc).approve(address(escrowContract), commitment.amount);

        // Create escrow (this will also mint CacaoHarvestNFT)
        uint256 escrowId = escrowContract.createEscrow(
            farmer,
            commitment.amount,
            commitment.deadline,
            commitment.metadataURI
        );

        // Update commitment
        commitment.status = CommitmentStatus.Accepted;
        commitment.acceptedFarmer = farmer;
        commitment.escrowId = escrowId;

        emit FarmerAccepted(commitmentId, msg.sender, farmer, escrowId);
    }

    /**
     * @notice Cancel commitment before accepting any farmer
     * @param commitmentId Commitment to cancel
     */
    function cancelCommitment(
        uint256 commitmentId
    ) external nonReentrant commitmentExists(commitmentId) onlyBuyer(commitmentId) {
        Commitment storage commitment = _commitments[commitmentId];

        require(commitment.status == CommitmentStatus.Open, "CommitmentMarketplace: not open");

        // Refund USDC to buyer
        IERC20(usdc).safeTransfer(commitment.buyer, commitment.amount);

        // Update status
        commitment.status = CommitmentStatus.Cancelled;

        emit CommitmentCancelled(commitmentId, msg.sender, commitment.amount);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get commitment data
     * @param commitmentId Commitment to query
     * @return data Complete commitment information
     */
    function getCommitment(
        uint256 commitmentId
    ) external view commitmentExists(commitmentId) returns (Commitment memory data) {
        return _commitments[commitmentId];
    }

    /**
     * @notice Get applicants for a commitment
     * @param commitmentId Commitment to query
     * @return applicants Array of farmer addresses
     */
    function getApplicants(
        uint256 commitmentId
    ) external view commitmentExists(commitmentId) returns (address[] memory applicants) {
        return _applicants[commitmentId];
    }

    /**
     * @notice Get commitments created by a buyer
     * @param buyer Buyer address
     * @return commitmentIds Array of commitment IDs
     */
    function getBuyerCommitments(
        address buyer
    ) external view returns (uint256[] memory commitmentIds) {
        return _buyerCommitments[buyer];
    }

    /**
     * @notice Get commitments a farmer has applied to
     * @param farmer Farmer address
     * @return commitmentIds Array of commitment IDs
     */
    function getFarmerApplications(
        address farmer
    ) external view returns (uint256[] memory commitmentIds) {
        return _farmerApplications[farmer];
    }

    /**
     * @notice Check if farmer has applied to commitment
     * @param commitmentId Commitment ID
     * @param farmer Farmer address
     * @return hasApplied True if farmer has applied
     */
    function hasApplied(
        uint256 commitmentId,
        address farmer
    ) external view commitmentExists(commitmentId) returns (bool) {
        return _applicationIndex[commitmentId][farmer] > 0 ||
               (_applicants[commitmentId].length > 0 && _applicants[commitmentId][0] == farmer);
    }

    /**
     * @notice Get total number of commitments created
     * @return count Total commitment count
     */
    function totalCommitments() external view returns (uint256 count) {
        return _nextCommitmentId;
    }

    /**
     * @notice Get all open commitments (limited to 100)
     * @return commitmentIds Array of open commitment IDs
     */
    function getOpenCommitments() external view returns (uint256[] memory commitmentIds) {
        uint256 count = 0;
        uint256 total = _nextCommitmentId;
        
        // Count open commitments
        for (uint256 i = 0; i < total && count < 100; i++) {
            if (_commitments[i].status == CommitmentStatus.Open && 
                _commitments[i].deadline > block.timestamp) {
                count++;
            }
        }

        // Populate array
        commitmentIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < total && index < count; i++) {
            if (_commitments[i].status == CommitmentStatus.Open && 
                _commitments[i].deadline > block.timestamp) {
                commitmentIds[index] = i;
                index++;
            }
        }
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Mark expired commitments (callable by anyone)
     * @param commitmentIds Array of commitment IDs to check
     */
    function markExpired(uint256[] calldata commitmentIds) external {
        for (uint256 i = 0; i < commitmentIds.length; i++) {
            uint256 commitmentId = commitmentIds[i];
            if (commitmentId < _nextCommitmentId) {
                Commitment storage commitment = _commitments[commitmentId];
                if (commitment.status == CommitmentStatus.Open && 
                    commitment.deadline <= block.timestamp) {
                    commitment.status = CommitmentStatus.Expired;
                    
                    // Refund buyer
                    IERC20(usdc).safeTransfer(commitment.buyer, commitment.amount);
                    
                    emit CommitmentCancelled(commitmentId, commitment.buyer, commitment.amount);
                }
            }
        }
    }
}

