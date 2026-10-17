import { useState } from "react";
import { Contract, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";

function RecallPanel({ connection }) {
  const [batchId, setBatchId] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);

  async function handleRecall(e) {
    e.preventDefault();
    setFailed(false);
    setStatus("Waiting for confirmation in MetaMask...");

    try {
      const signer = await connection.provider.getSigner();
      const contract = new Contract(getAddress(CONTRACT_ADDRESS.toLowerCase()), CONTRACT_ABI, signer);
      const tx = await contract.recallBatch(Number(batchId), reason);
      setStatus("Transaction sent, waiting for it to be mined...");
      await tx.wait();
      setStatus(`Batch #${batchId} has been recalled.`);
      setBatchId("");
      setReason("");
    } catch (err) {
      console.error(err);
      setFailed(true);
      setStatus("Could not recall the batch. Check the batch ID and that it is not already recalled.");
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white shadow-lg shadow-yellow-800/10 rounded-2xl p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-1">Recall a batch</h2>
      <p className="text-sm text-gray-600 mb-4">
        A recalled batch is flagged for every consumer and can no longer receive events. This cannot be undone.
      </p>

      <form onSubmit={handleRecall} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Batch ID</label>
          <input type="number" min="1" required value={batchId} onChange={(e) => setBatchId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <input type="text" required value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Contamination report" className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
        </div>
        <button type="submit"
          className="bg-red-700 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:brightness-110 transition mt-2">
          Recall batch
        </button>
      </form>

      {status && <p className={`text-sm mt-3 ${failed ? "text-red-700" : "text-gray-700"}`}>{status}</p>}
    </div>
  );
}

export default RecallPanel;