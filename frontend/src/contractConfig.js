// AUTO-GENERATED FILE — do not edit manually.
// Regenerate with: npx hardhat run scripts/exportAbi.ts
export const CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "beekeeper",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "location",
        "type": "string"
      }
    ],
    "name": "BatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "actor",
        "type": "address"
      }
    ],
    "name": "EventLogged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum HoneyChain.Role",
        "name": "role",
        "type": "uint8"
      }
    ],
    "name": "ParticipantRegistered",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "batchHistory",
    "outputs": [
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "actor",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "details",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "batches",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "batchId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "beekeeper",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "apiaryLocation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "floralSource",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "harvestDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantityKg",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "qualityTested",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_apiaryLocation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_floralSource",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_quantityKg",
        "type": "uint256"
      }
    ],
    "name": "createBatch",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      }
    ],
    "name": "getBatchDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "batchId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "beekeeper",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "apiaryLocation",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "floralSource",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "harvestDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quantityKg",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "qualityTested",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct HoneyChain.Batch",
        "name": "",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "eventType",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "actor",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "details",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct HoneyChain.Event[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      }
    ],
    "name": "getEventCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_eventType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_details",
        "type": "string"
      }
    ],
    "name": "logEvent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextBatchId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_addr",
        "type": "address"
      },
      {
        "internalType": "enum HoneyChain.Role",
        "name": "_role",
        "type": "uint8"
      }
    ],
    "name": "registerParticipant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "roles",
    "outputs": [
      {
        "internalType": "enum HoneyChain.Role",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const HARDHAT_CHAIN_ID = 31337;
