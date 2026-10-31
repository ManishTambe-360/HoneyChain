import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Pick the target with: $env:TARGET="amoy"   (defaults to "local")
const NETWORKS: Record<string, any> = {
  local: {
    name: "Hardhat Local",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "",
    currency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  amoy: {
    name: "Polygon Amoy",
    chainId: 80002,
    rpcUrl: "https://polygon-amoy.drpc.org",
    explorerUrl: "https://amoy.polygonscan.com",
    currency: { name: "POL", symbol: "POL", decimals: 18 },
  },
};

async function main() {
  const target = process.env.TARGET || "local";
  const network = NETWORKS[target];
  if (!network) {
    throw new Error(`Unknown TARGET "${target}". Use one of: ${Object.keys(NETWORKS).join(", ")}`);
  }

  const artifactPath = path.join(process.cwd(), "artifacts/contracts/HoneyChain.sol/HoneyChain.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const rawAddress = process.env.CONTRACT_ADDRESS;
  if (!rawAddress) {
    throw new Error("Set CONTRACT_ADDRESS before running this script");
  }

  const isValidAddress = ethers.isAddress(rawAddress);
  if (!isValidAddress) {
    throw new Error(`CONTRACT_ADDRESS is not a valid address: "${rawAddress}" (length: ${rawAddress.length})`);
  }
  const contractAddress = ethers.getAddress(rawAddress);

  // Block the contract was deployed in. Log searches start here.
  const deployBlock = Number(process.env.DEPLOY_BLOCK || 0);

  const config = { ...network, deployBlock };

  const output = `// AUTO-GENERATED FILE. Do not edit manually.
// Regenerate with: npx hardhat run scripts/exportAbi.ts
export const CONTRACT_ADDRESS = "${contractAddress}";

export const NETWORK = ${JSON.stringify(config, null, 2)};

export const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};
`;

  const outputPath = path.join(process.cwd(), "frontend/src/contractConfig.js");
  fs.writeFileSync(outputPath, output);

  console.log(`Target:   ${network.name} (chain ${network.chainId})`);
  console.log(`Contract: ${contractAddress} (length ${contractAddress.length})`);
  console.log(`From block: ${deployBlock}`);
  console.log(`Written to ${outputPath}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});