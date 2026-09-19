import { network } from "hardhat";

async function main() {
  const { ethers } = await network.getOrCreate();

  console.log("Deploying HoneyChain contract...");

  const HoneyChainFactory = await ethers.getContractFactory("HoneyChain");
  const honeyChain = await HoneyChainFactory.deploy();
  await honeyChain.waitForDeployment();

  const address = await honeyChain.getAddress();
  console.log(`HoneyChain deployed to: ${address}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployed by (admin address): ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});