import { expect } from "chai";
import { network } from "hardhat";

describe("HoneyChain", function () {
  let ethers: any;

  const Role = { None: 0, Beekeeper: 1, Lab: 2, Processor: 3, Distributor: 4 };

  before(async function () {
    ({ ethers } = await network.getOrCreate());
  });

  async function deployFixture() {
    const [admin, beekeeper, lab, outsider] = await ethers.getSigners();

    const HoneyChainFactory = await ethers.getContractFactory("HoneyChain");
    const honeyChain = await HoneyChainFactory.deploy();
    await honeyChain.waitForDeployment();

    return { honeyChain, admin, beekeeper, lab, outsider };
  }

  it("should set the deployer as admin", async function () {
    const { honeyChain, admin } = await deployFixture();
    expect(await honeyChain.admin()).to.equal(admin.address);
  });

  it("should allow admin to register a participant", async function () {
    const { honeyChain, beekeeper } = await deployFixture();
    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    expect(await honeyChain.roles(beekeeper.address)).to.equal(Role.Beekeeper);
  });

  it("should NOT allow a non-admin to register a participant", async function () {
    const { honeyChain, beekeeper, outsider } = await deployFixture();
    await expect(
      honeyChain.connect(outsider).registerParticipant(beekeeper.address, Role.Beekeeper)
    ).to.be.revertedWith("Only admin can perform this action");
  });

  it("should allow a registered beekeeper to create a batch", async function () {
    const { honeyChain, beekeeper } = await deployFixture();
    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);

    await expect(
      honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50)
    ).to.emit(honeyChain, "BatchCreated");

    const [batch] = await honeyChain.getBatchDetails(1);
    expect(batch.apiaryLocation).to.equal("Nilgiris, TN");
    expect(batch.quantityKg).to.equal(50);
  });

  it("should NOT allow a non-beekeeper to create a batch", async function () {
    const { honeyChain, outsider } = await deployFixture();
    await expect(
      honeyChain.connect(outsider).createBatch("Fake Location", "Fake Source", 10)
    ).to.be.revertedWith("Not authorized for this action");
  });

  it("should allow a registered lab to log a QualityTested event", async function () {
    const { honeyChain, beekeeper, lab } = await deployFixture();
    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    await honeyChain.registerParticipant(lab.address, Role.Lab);
    await honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50);

    await honeyChain.connect(lab).logEvent(1, "QualityTested", "QmFakeHash123");

    const [batch, history] = await honeyChain.getBatchDetails(1);
    expect(batch.qualityTested).to.equal(true);
    expect(history.length).to.equal(1);
    expect(history[0].eventType).to.equal("QualityTested");
    expect(history[0].actor).to.equal(lab.address);
  });

    it("should NOT allow a Processor to log a QualityTested event", async function () {
    const { honeyChain, beekeeper, lab } = await deployFixture();
    const [, , , processor] = await ethers.getSigners();

    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    await honeyChain.registerParticipant(processor.address, Role.Processor);
    await honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50);

    await expect(
      honeyChain.connect(processor).logEvent(1, "QualityTested", "QmFakeHash")
    ).to.be.revertedWith("Only Lab can log QualityTested events");
  });

  it("should allow a registered Distributor to log a Shipped event", async function () {
    const { honeyChain, beekeeper } = await deployFixture();
    const [, , , , distributor] = await ethers.getSigners();

    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    await honeyChain.registerParticipant(distributor.address, Role.Distributor);
    await honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50);

    await honeyChain.connect(distributor).logEvent(1, "Shipped", "Truck#45");

    const [, history] = await honeyChain.getBatchDetails(1);
    expect(history[0].eventType).to.equal("Shipped");
  });

  it("should NOT allow an unregistered address to log an event", async function () {
    const { honeyChain, beekeeper, outsider } = await deployFixture();
    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    await honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50);

    await expect(
      honeyChain.connect(outsider).logEvent(1, "QualityTested", "QmFakeHash123")
    ).to.be.revertedWith("Not a registered participant");
  });

  it("should revert when logging an event for a non-existent batch", async function () {
    const { honeyChain, lab } = await deployFixture();
    await honeyChain.registerParticipant(lab.address, Role.Lab);

    await expect(
      honeyChain.connect(lab).logEvent(999, "QualityTested", "QmFakeHash123")
    ).to.be.revertedWith("Batch does not exist");
  });

  it("should keep a full, growing, append-only history of events", async function () {
    const { honeyChain, beekeeper, lab } = await deployFixture();
    const [, , , processor, distributor] = await ethers.getSigners();

    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    await honeyChain.registerParticipant(lab.address, Role.Lab);
    await honeyChain.registerParticipant(processor.address, Role.Processor);
    await honeyChain.registerParticipant(distributor.address, Role.Distributor);
    await honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50);

    await honeyChain.connect(lab).logEvent(1, "QualityTested", "QmHash1");
    await honeyChain.connect(processor).logEvent(1, "Processed", "QmHash2");
    await honeyChain.connect(distributor).logEvent(1, "Shipped", "Truck#45");

    const count = await honeyChain.getEventCount(1);
    expect(count).to.equal(3);
  });
});