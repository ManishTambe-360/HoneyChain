import { useState } from "react";
import { Contract, getAddress, sha256, ZeroHash } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";

function RecallPanel({ connection }) {
  const [batchId, setBatchId] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function uploadToIPFS() {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("http://localhost:4000/upload", { method: "POST", body: formData });
    if (!response.ok) throw new Error("IPFS upload failed");
    return (await response.json()).ipfsHash;
  }

  async function handleRecall(e) {
    e.preventDefault();
    const form = e.target;
    setBusy(true);
    setFailed(false);

    try {
      let finalReason = reason;
      let docHash = ZeroHash;

      if (file) {
        setStatus("Fingerprinting and uploading the report...");
        docHash = sha256(new Uint8Array(await file.arrayBuffer()));
        const ipfsHash = await uploadToIPFS();
        finalReason = `${reason} [IPFS: ${ipfsHash}]`;
      }

      setStatus("Waiting for confirmation in MetaMask...");
      const signer = await connection.provider.getSigner();
      const contract = new Contract(getAddress(CONTRACT_ADDRESS.toLowerCase()), CONTRACT_ABI, signer);

      const tx = await contract.recallBatch(Number(batchId), finalReason, docHash);
      setStatus("Transaction sent, waiting for it to be mined...");
      await tx.wait();

      setStatus(`Batch #${batchId} has been recalled.`);
      setBatchId("");
      setReason("");
      setFile(null);
      form.reset();
    } catch (err) {
      console.error(err);
      setFailed(true);
      setStatus(
        err?.code === "ACTION_REJECTED"
          ? "Transaction cancelled in MetaMask."
          : "Could not recall the batch. Check the batch ID, that it is not already recalled, and that the upload server is running."
      );
    } finally {
      setBusy(false);
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
            placeholder="e.g. Contamination found at the processing unit"
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Attach recall report (optional)</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 text-sm bg-white" />
        </div>
        <button type="submit" disabled={busy}
          className="bg-red-700 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:brightness-110 transition mt-2 disabled:opacity-50">
          {busy ? "Working..." : "Recall batch"}
        </button>
      </form>

      {status && <p className={`text-sm mt-3 ${failed ? "text-red-700" : "text-gray-700"}`}>{status}</p>}
    </div>
  );
}

export default RecallPanel;