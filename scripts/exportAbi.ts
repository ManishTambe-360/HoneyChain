import fs from "fs";
import path from "path";
import { ethers } from "ethers";

async function main() {
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/HoneyChain.sol/HoneyChain.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const rawAddress = process.env.CONTRACT_ADDRESS;
  if (!rawAddress) {
    throw new Error("Set CONTRACT_ADDRESS env variable before running this script");
  }

  const isValidAddress = ethers.isAddress(rawAddress);

  if (!isValidAddress) {
    throw new Error(
      `CONTRACT_ADDRESS is not a valid Ethereum address: "${rawAddress}" (length: ${rawAddress.length}). ` +
      `Re-copy the address from your deploy.ts output and try again.`
    );
  }

  const contractAddress = ethers.getAddress(rawAddress);

  const outputContent = `// AUTO-GENERATED FILE — do not edit manually.
// Regenerate with: npx hardhat run scripts/exportAbi.ts
export const CONTRACT_ADDRESS = "${contractAddress}";

export const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};

export const HARDHAT_CHAIN_ID = 31337;
`;

  const outputPath = path.join(process.cwd(), "frontend/src/contractConfig.js");
  fs.writeFileSync(outputPath, outputContent);

  console.log(`✅ Valid address confirmed: ${contractAddress} (length: ${contractAddress.length})`);
  console.log(`contractConfig.js written to: ${outputPath}`);
}

main().catch((error) => {
  console.error("❌", error.message);
  process.exitCode = 1;
});