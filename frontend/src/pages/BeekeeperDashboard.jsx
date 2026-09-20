import { useState } from "react";
import { Contract, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";

function BeekeeperDashboard({ connection }) {
  const [apiaryLocation, setApiaryLocation] = useState("");
  const [floralSource, setFloralSource] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [status, setStatus] = useState("");
  const [lastBatchId, setLastBatchId] = useState(null);

  async function handleCreateBatch(e) {
    e.preventDefault();
    setStatus("Waiting for confirmation in MetaMask...");
    setLastBatchId(null);

    try {
      const signer = await connection.provider.getSigner();
      const checksummedContractAddress = getAddress(CONTRACT_ADDRESS.toLowerCase());
      const contract = new Contract(checksummedContractAddress, CONTRACT_ABI, signer);

      const tx = await contract.createBatch(
        apiaryLocation,
        floralSource,
        Number(quantityKg)
      );

      setStatus("Transaction sent, waiting for it to be mined...");
      const receipt = await tx.wait();

      // Find the BatchCreated event to get the new batch ID
      const event = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "BatchCreated");

      if (event) {
        setLastBatchId(event.args.batchId.toString());
      }

      setStatus("Batch created successfully!");
      setApiaryLocation("");
      setFloralSource("");
      setQuantityKg("");
    } catch (err) {
      console.error(err);
      setStatus("Failed to create batch. See console for details.");
    }
  }

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">Create a New Batch</h2>

      <form onSubmit={handleCreateBatch} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Apiary Location</label>
          <input
            type="text"
            value={apiaryLocation}
            onChange={(e) => setApiaryLocation(e.target.value)}
            placeholder="e.g. Nilgiris, Tamil Nadu"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Floral Source</label>
          <input
            type="text"
            value={floralSource}
            onChange={(e) => setFloralSource(e.target.value)}
            placeholder="e.g. Wildflower"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Quantity (kg)</label>
          <input
            type="number"
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
            placeholder="e.g. 50"
            required
            min="1"
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        <button
          type="submit"
          className="bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-800 transition mt-2"
        >
          Create Batch
        </button>
      </form>

      {status && <p className="text-sm text-gray-700 mt-3">{status}</p>}
      {lastBatchId && (
        <p className="text-sm text-green-700 font-semibold mt-1">
          New Batch ID: {lastBatchId}
        </p>
      )}
    </div>
  );
}

export default BeekeeperDashboard;