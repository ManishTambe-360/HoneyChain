import { expect } from "chai";
import { network } from "hardhat";

describe("HoneyChain", function () {
  let ethers: any;

  const Role = { None: 0, Beekeeper: 1, Lab: 2, Processor: 3, Distributor: 4 };
  const Stage = { Harvested: 0, Tested: 1, Processed: 2, Shipped: 3 };
  const Status = { Active: 0, Failed: 1, Recalled: 2 };

  before(async function () {
    ({ ethers } = await network.connect());
  });

  async function deployFixture() {
    const [admin, beekeeper, lab, processor, distributor, outsider] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("HoneyChain");
    const honeyChain = await factory.deploy();
    await honeyChain.waitForDeployment();
    return { honeyChain, admin, beekeeper, lab, processor, distributor, outsider };
  }

  // Deploys, registers every role, and creates batch #1
  async function setupBatch() {
    const ctx = await deployFixture();
    const { honeyChain, beekeeper, lab, processor, distributor } = ctx;
    await honeyChain.registerParticipant(beekeeper.address, Role.Beekeeper);
    await honeyChain.registerParticipant(lab.address, Role.Lab);
    await honeyChain.registerParticipant(processor.address, Role.Processor);
    await honeyChain.registerParticipant(distributor.address, Role.Distributor);
    await honeyChain.connect(beekeeper).createBatch("Nilgiris, TN", "Wildflower", 50);
    return ctx;
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

  it("should let a beekeeper create a batch that starts Harvested and Active", async function () {
    const { honeyChain } = await setupBatch();
    const [batch] = await honeyChain.getBatchDetails(1);
    expect(batch.apiaryLocation).to.equal("Nilgiris, TN");
    expect(batch.quantityKg).to.equal(50);
    expect(batch.stage).to.equal(Stage.Harvested);
    expect(batch.status).to.equal(Status.Active);
  });

  it("should NOT allow a non-beekeeper to create a batch", async function () {
    const { honeyChain, outsider } = await deployFixture();
    await expect(
      honeyChain.connect(outsider).createBatch("Fake", "Fake", 10)
    ).to.be.revertedWith("Not authorized for this action");
  });

  it("should let a Lab log QualityTested and move the batch to Tested", async function () {
    const { honeyChain, lab } = await setupBatch();
    await honeyChain.connect(lab).logEvent(1, "QualityTested", "Passed 98.5%", ethers.ZeroHash);
    const [batch, history] = await honeyChain.getBatchDetails(1);
    expect(batch.qualityTested).to.equal(true);
    expect(batch.stage).to.equal(Stage.Tested);
    expect(history.length).to.equal(1);
    expect(history[0].actor).to.equal(lab.address);
  });

  it("should NOT allow a Processor to log QualityTested", async function () {
    const { honeyChain, processor } = await setupBatch();
    await expect(
      honeyChain.connect(processor).logEvent(1, "QualityTested", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Only Lab can log QualityTested events");
  });

  it("should NOT allow an unregistered address to log an event", async function () {
    const { honeyChain, outsider } = await setupBatch();
    await expect(
      honeyChain.connect(outsider).logEvent(1, "QualityTested", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Not a registered participant");
  });

  it("should revert when logging an event for a non-existent batch", async function () {
    const { honeyChain, lab } = await setupBatch();
    await expect(
      honeyChain.connect(lab).logEvent(999, "QualityTested", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Batch does not exist");
  });

  it("should walk a batch through the full ordered chain", async function () {
    const { honeyChain, lab, processor, distributor } = await setupBatch();
    await honeyChain.connect(lab).logEvent(1, "QualityTested", "ok", ethers.ZeroHash);
    await honeyChain.connect(processor).logEvent(1, "Processed", "ok", ethers.ZeroHash);
    await honeyChain.connect(distributor).logEvent(1, "Shipped", "ok", ethers.ZeroHash);

    expect(await honeyChain.getEventCount(1)).to.equal(3);
    const [batch] = await honeyChain.getBatchDetails(1);
    expect(batch.stage).to.equal(Stage.Shipped);
  });

  it("should NOT allow Processed before QualityTested", async function () {
    const { honeyChain, processor } = await setupBatch();
    await expect(
      honeyChain.connect(processor).logEvent(1, "Processed", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Batch must be quality tested first");
  });

  it("should NOT allow Shipped before Processed", async function () {
    const { honeyChain, lab, distributor } = await setupBatch();
    await honeyChain.connect(lab).logEvent(1, "QualityTested", "ok", ethers.ZeroHash);
    await expect(
      honeyChain.connect(distributor).logEvent(1, "Shipped", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Batch must be processed first");
  });

  it("should NOT allow the same stage to be logged twice", async function () {
    const { honeyChain, lab } = await setupBatch();
    await honeyChain.connect(lab).logEvent(1, "QualityTested", "ok", ethers.ZeroHash);
    await expect(
      honeyChain.connect(lab).logEvent(1, "QualityTested", "again", ethers.ZeroHash)
    ).to.be.revertedWith("Batch must be at Harvested stage");
  });

  it("should reject unknown event types", async function () {
    const { honeyChain, lab } = await setupBatch();
    await expect(
      honeyChain.connect(lab).logEvent(1, "Teleported", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Unknown event type");
  });

  it("should flag a batch as Failed and block further events", async function () {
    const { honeyChain, lab } = await setupBatch();
    await honeyChain.connect(lab).logEvent(1, "QualityFailed", "Sugar syrup found", ethers.ZeroHash);

    const [batch] = await honeyChain.getBatchDetails(1);
    expect(batch.status).to.equal(Status.Failed);
    expect(batch.qualityTested).to.equal(false);

    await expect(
      honeyChain.connect(lab).logEvent(1, "QualityTested", "retry", ethers.ZeroHash)
    ).to.be.revertedWith("Batch is not active");
  });

  it("should let admin recall a batch, record the reason, and block further events", async function () {
    const { honeyChain, admin, lab } = await setupBatch();
    await honeyChain.connect(admin).recallBatch(1, "Contamination report");

    const [batch, history] = await honeyChain.getBatchDetails(1);
    expect(batch.status).to.equal(Status.Recalled);
    expect(history[history.length - 1].eventType).to.equal("Recalled");
    expect(history[history.length - 1].details).to.equal("Contamination report");

    await expect(
      honeyChain.connect(lab).logEvent(1, "QualityTested", "x", ethers.ZeroHash)
    ).to.be.revertedWith("Batch is not active");
  });

  it("should NOT allow a non-admin to recall a batch", async function () {
    const { honeyChain, lab } = await setupBatch();
    await expect(
      honeyChain.connect(lab).recallBatch(1, "nope")
    ).to.be.revertedWith("Only admin can perform this action");
  });

  it("should store a document hash on-chain with the event", async function () {
    const { honeyChain, lab } = await setupBatch();
    const docHash = ethers.id("lab-report.pdf contents");
    await honeyChain.connect(lab).logEvent(1, "QualityTested", "with report", docHash);

    const [, history] = await honeyChain.getBatchDetails(1);
    expect(history[0].docHash).to.equal(docHash);
  });
});