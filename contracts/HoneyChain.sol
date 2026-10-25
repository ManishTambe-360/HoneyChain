// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title HoneyChain
/// @notice Honey traceability with enforced stage order, fail/recall flags,
///         and on-chain document hashes for tamper checks.
contract HoneyChain {

    address public admin;

    enum Role { None, Beekeeper, Lab, Processor, Distributor }
    enum Stage { Harvested, Tested, Processed, Shipped }
    enum Status { Active, Failed, Recalled }

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
        Stage stage;
        Status status;
    }

    struct Event {
        string eventType;
        address actor;
        string details;
        bytes32 docHash;    // SHA-256 of the attached document, or zero if none
        uint256 timestamp;
    }

    bytes32 private constant QUALITY_TESTED = keccak256("QualityTested");
    bytes32 private constant QUALITY_FAILED = keccak256("QualityFailed");
    bytes32 private constant PROCESSED = keccak256("Processed");
    bytes32 private constant SHIPPED = keccak256("Shipped");

    mapping(uint256 => Batch) public batches;
    mapping(uint256 => Event[]) public batchHistory;
    uint256 public nextBatchId = 1;

    event ParticipantRegistered(address indexed participant, Role role);
    event BatchCreated(uint256 indexed batchId, address indexed beekeeper, string location);
    event EventLogged(uint256 indexed batchId, string eventType, address indexed actor);
    event BatchStatusChanged(uint256 indexed batchId, Status status);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

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

    /// @notice Hand the admin role to another account (for example a multisig).
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        emit AdminTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }

    function registerParticipant(address _addr, Role _role) external onlyAdmin {
        require(_addr != address(0), "Invalid address");
        roles[_addr] = _role;
        emit ParticipantRegistered(_addr, _role);
    }

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
            exists: true,
            stage: Stage.Harvested,
            status: Status.Active
        });

        emit BatchCreated(id, msg.sender, _apiaryLocation);
        return id;
    }

    /// @notice Log a supply-chain event. Stage order and role are enforced.
    /// @param _docHash SHA-256 of an attached document, or bytes32(0) for none.
    function logEvent(
        uint256 _batchId,
        string memory _eventType,
        string memory _details,
        bytes32 _docHash
    ) external batchExists(_batchId) {
        Role senderRole = roles[msg.sender];
        require(senderRole != Role.None, "Not a registered participant");
        require(batches[_batchId].status == Status.Active, "Batch is not active");

        _applyEvent(_batchId, keccak256(bytes(_eventType)), senderRole);

        batchHistory[_batchId].push(Event({
            eventType: _eventType,
            actor: msg.sender,
            details: _details,
            docHash: _docHash,
            timestamp: block.timestamp
        }));

        emit EventLogged(_batchId, _eventType, msg.sender);
    }

    function _applyEvent(uint256 _batchId, bytes32 t, Role senderRole) internal {
        Batch storage b = batches[_batchId];

        if (t == QUALITY_TESTED) {
            require(senderRole == Role.Lab, "Only Lab can log QualityTested events");
            require(b.stage == Stage.Harvested, "Batch must be at Harvested stage");
            b.stage = Stage.Tested;
            b.qualityTested = true;
        } else if (t == QUALITY_FAILED) {
            require(senderRole == Role.Lab, "Only Lab can log QualityFailed events");
            require(b.stage == Stage.Harvested, "Batch must be at Harvested stage");
            b.status = Status.Failed;
            emit BatchStatusChanged(_batchId, Status.Failed);
        } else if (t == PROCESSED) {
            require(senderRole == Role.Processor, "Only Processor can log Processed events");
            require(b.stage == Stage.Tested, "Batch must be quality tested first");
            b.stage = Stage.Processed;
        } else if (t == SHIPPED) {
            require(senderRole == Role.Distributor, "Only Distributor can log Shipped events");
            require(b.stage == Stage.Processed, "Batch must be processed first");
            b.stage = Stage.Shipped;
        } else {
            revert("Unknown event type");
        }
    }

    /// @notice Admin recalls a batch. The reason is recorded in the history.
    /// @notice Admin recalls a batch. The reason and an optional report hash
    ///         are recorded in the history.
    function recallBatch(uint256 _batchId, string memory _reason, bytes32 _docHash)
        external
        onlyAdmin
        batchExists(_batchId)
    {
        require(batches[_batchId].status != Status.Recalled, "Batch already recalled");
        batches[_batchId].status = Status.Recalled;

        batchHistory[_batchId].push(Event({
            eventType: "Recalled",
            actor: msg.sender,
            details: _reason,
            docHash: _docHash,
            timestamp: block.timestamp
        }));

        emit BatchStatusChanged(_batchId, Status.Recalled);
        emit EventLogged(_batchId, "Recalled", msg.sender);
    }

    function getBatchDetails(uint256 _batchId)
        external
        view
        batchExists(_batchId)
        returns (Batch memory, Event[] memory)
    {
        return (batches[_batchId], batchHistory[_batchId]);
    }

    function getEventCount(uint256 _batchId) external view returns (uint256) {
        return batchHistory[_batchId].length;
    }

    function getTotalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }
}