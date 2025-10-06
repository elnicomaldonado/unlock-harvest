// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title ICommitmentMarketplace
 * @notice Interface for the commitment marketplace
 */
interface ICommitmentMarketplace {
    enum CommitmentStatus {
        Open,
        Accepted,
        Cancelled,
        Expired
    }

    struct Commitment {
        address buyer;
        uint256 amount;
        int256 minReputation;
        uint256 deadline;
        uint256 createdAt;
        string metadataURI;
        CommitmentStatus status;
        address acceptedFarmer;
        uint256 escrowId;
    }

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

    function createCommitment(
        uint256 amount,
        int256 minReputation,
        uint256 deadline,
        string calldata metadataURI
    ) external returns (uint256 commitmentId);

    function applyToCommitment(uint256 commitmentId) external;

    function acceptFarmer(uint256 commitmentId, address farmer) external;

    function cancelCommitment(uint256 commitmentId) external;

    function getCommitment(uint256 commitmentId) external view returns (Commitment memory data);

    function getApplicants(uint256 commitmentId) external view returns (address[] memory applicants);

    function getBuyerCommitments(address buyer) external view returns (uint256[] memory commitmentIds);

    function getFarmerApplications(address farmer) external view returns (uint256[] memory commitmentIds);

    function hasApplied(uint256 commitmentId, address farmer) external view returns (bool hasApplied);

    function totalCommitments() external view returns (uint256 count);

    function getOpenCommitments() external view returns (uint256[] memory commitmentIds);
}


