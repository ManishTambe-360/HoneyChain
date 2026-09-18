// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title HoneyChain
/// @notice Tracks honey batches from hive to consumer with tamper-evident,
///         role-gated event logging on-chain.
contract HoneyChain {

    address public admin;

    enum Role { None, Beekeeper, Lab, Processor, Distributor }

    mapping(address => Role) public roles;

    struct Batch {
        uint256 batchId;
        address beekeeper;
        string apiaryLocation;
        string floralSource;
        uint256 harvestDate;
        uint256 quantityKg;
        bool qualityTested;
        bool exists;
    }

    struct Event {
        string eventType;   // "QualityTested", "Processed", "Shipped", etc.
        address actor;
        string details;     // free text OR an IPFS hash of supporting doc
        uint256 timestamp;
    }

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => Event[]) public batchHistory;
    uint256 public nextBatchId = 1;

    event ParticipantRegistered(address indexed participant, Role role);
    event BatchCreated(uint256 indexed batchId, address indexed beekeeper, string location);
    event EventLogged(uint256 indexed batchId, string eventType, address indexed actor);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Not authorized for this action");
        _;
    }

    modifier batchExists(uint256 _batchId) {
        require(batches[_batchId].exists, "Batch does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Admin registers a participant with a specific role.
    function registerParticipant(address _addr, Role _role) external onlyAdmin {
        require(_addr != address(0), "Invalid address");
        roles[_addr] = _role;
        emit ParticipantRegistered(_addr, _role);
    }

    /// @notice Beekeeper creates a new honey batch record.
    function createBatch(
        string memory _apiaryLocation,
        string memory _floralSource,
        uint256 _quantityKg
    ) external onlyRole(Role.Beekeeper) returns (uint256) {
        require(_quantityKg > 0, "Quantity must be greater than zero");

        uint256 id = nextBatchId++;

        batches[id] = Batch({
            batchId: id,
            beekeeper: msg.sender,
            apiaryLocation: _apiaryLocation,
            floralSource: _floralSource,
            harvestDate: block.timestamp,
            quantityKg: _quantityKg,
            qualityTested: false,
            exists: true
        });

        emit BatchCreated(id, msg.sender, _apiaryLocation);
        return id;
    }

    /// @notice Any registered participant logs a supply-chain event against a batch.
    function logEvent(
        uint256 _batchId,
        string memory _eventType,
        string memory _details
    ) external batchExists(_batchId) {
        require(roles[msg.sender] != Role.None, "Not a registered participant");

        batchHistory[_batchId].push(Event({
            eventType: _eventType,
            actor: msg.sender,
            details: _details,
            timestamp: block.timestamp
        }));

        if (keccak256(bytes(_eventType)) == keccak256(bytes("QualityTested"))) {
            batches[_batchId].qualityTested = true;
        }

        emit EventLogged(_batchId, _eventType, msg.sender);
    }

    /// @notice Public read-only lookup — no wallet or gas required to call.
    function getBatchDetails(uint256 _batchId)
        external
        view
        batchExists(_batchId)
        returns (Batch memory, Event[] memory)
    {
        return (batches[_batchId], batchHistory[_batchId]);
    }

    /// @notice Returns how many events exist for a batch (useful for frontend pagination).
    function getEventCount(uint256 _batchId) external view returns (uint256) {
        return batchHistory[_batchId].length;
    }
}