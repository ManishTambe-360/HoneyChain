import fs from "fs";
import path from "path";

async function main() {
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/HoneyChain.sol/HoneyChain.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS env variable before running this script");
  }

  const outputContent = `// AUTO-GENERATED FILE — do not edit manually.
// Regenerate with: npx hardhat run scripts/exportAbi.ts
export const CONTRACT_ADDRESS = "${contractAddress}";

export const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};

export const HARDHAT_CHAIN_ID = 31337;
`;

  const outputPath = path.join(process.cwd(), "frontend/src/contractConfig.js");
  fs.writeFileSync(outputPath, outputContent);

  console.log(`contractConfig.js written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});