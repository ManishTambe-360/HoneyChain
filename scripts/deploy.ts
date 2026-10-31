import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  const chain = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network chain ID: ${chain.chainId}`);
  console.log(`Deployer (will become admin): ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(balance)}`);

  const factory = await ethers.getContractFactory("HoneyChain");

  // Pre-flight: estimate the cost and stop early if the balance is too low
  const deployTx = await factory.getDeployTransaction();
  const gasEstimate = await ethers.provider.estimateGas({ ...deployTx, from: deployer.address });
  const fees = await ethers.provider.getFeeData();
  const feePerGas = fees.maxFeePerGas ?? fees.gasPrice ?? 0n;
  const estimatedCost = gasEstimate * feePerGas;

  console.log(`Estimated gas: ${gasEstimate}`);
  console.log(`Estimated cost: ${ethers.formatEther(estimatedCost)}`);

  if (balance < estimatedCost) {
    throw new Error("Balance is too low for this deployment. Add funds and try again.");
  }

  console.log("Deploying HoneyChain contract...");
  const honeyChain = await factory.deploy();
  const receipt = await honeyChain.deploymentTransaction()?.wait();
  await honeyChain.waitForDeployment();

  const address = await honeyChain.getAddress();
  console.log(`HoneyChain deployed to: ${address}`);
  console.log(`Deployed in block: ${receipt?.blockNumber}`);
  console.log(`Admin address: ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});