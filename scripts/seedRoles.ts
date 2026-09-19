import { network } from "hardhat";

const Role = { None: 0, Beekeeper: 1, Lab: 2, Processor: 3, Distributor: 4 };

async function main() {
  const { ethers } = await network.getOrCreate();

  // Reads the deployed contract address from an environment variable
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS env variable before running this script");
  }

  const [admin, beekeeper1, lab1, processor1] = await ethers.getSigners();

  const checksummedAddress = ethers.getAddress(contractAddress.toLowerCase());
  const honeyChain = await ethers.getContractAt("HoneyChain", checksummedAddress);

  console.log("Registering dummy participants...");

  await (await honeyChain.connect(admin).registerParticipant(beekeeper1.address, Role.Beekeeper)).wait();
  console.log(`Beekeeper registered: ${beekeeper1.address}`);

  await (await honeyChain.connect(admin).registerParticipant(lab1.address, Role.Lab)).wait();
  console.log(`Lab registered: ${lab1.address}`);

  await (await honeyChain.connect(admin).registerParticipant(processor1.address, Role.Processor)).wait();
  console.log(`Processor registered: ${processor1.address}`);

  console.log("\nSeeding complete. Save these addresses for testing in the frontend:");
  console.log({
    admin: admin.address,
    beekeeper1: beekeeper1.address,
    lab1: lab1.address,
    processor1: processor1.address,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});