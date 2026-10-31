import { useState } from "react";
import { Contract, getAddress, sha256, ZeroHash } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";
import { uploadFile } from "../api";

const EVENTS_BY_ROLE = {
  Lab: ["QualityTested", "QualityFailed"],
  Processor: ["Processed"],
  Distributor: ["Shipped"],
};

function readableError(err) {
  if (err?.uploadError) return err.message;
  if (err?.code === "ACTION_REJECTED") return "Transaction cancelled in MetaMask.";
  const text = [err?.reason, err?.shortMessage, err?.message, err?.info?.error?.message, err?.info?.error?.data?.message]
    .filter(Boolean)
    .join(" ");
  const match = text.match(/reason string '([^']+)'/);
  return match ? match[1] : "The transaction was rejected. See the console for details.";
}

function LabProcessorPortal({ connection }) {
  const eventOptions = EVENTS_BY_ROLE[connection.role] || [];

  const [batchId, setBatchId] = useState("");
  const [eventType, setEventType] = useState(eventOptions[0]);
  const [details, setDetails] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const uploadToIPFS = () => uploadFile(file);

  async function handleLogEvent(e) {
    e.preventDefault();
    const form = e.target;
    setBusy(true);
    setFailed(false);

    try {
      let finalDetails = details;
      let docHash = ZeroHash;

      if (file) {
        setStatus("Fingerprinting and uploading the file...");
        docHash = sha256(new Uint8Array(await file.arrayBuffer()));
        const ipfsHash = await uploadToIPFS();
        finalDetails = `${details} [IPFS: ${ipfsHash}]`;
      }

      setStatus("Waiting for confirmation in MetaMask...");
      const signer = await connection.provider.getSigner();
      const contract = new Contract(getAddress(CONTRACT_ADDRESS.toLowerCase()), CONTRACT_ABI, signer);

      const tx = await contract.logEvent(Number(batchId), eventType, finalDetails, docHash);
      setStatus("Transaction sent, waiting for it to be mined...");
      await tx.wait();

      setStatus(`"${eventType}" logged for batch #${batchId}.`);
      setDetails("");
      setFile(null);
      form.reset();
    } catch (err) {
      console.error(err);
      setFailed(true);
      setStatus(readableError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white shadow-lg shadow-yellow-800/10 rounded-2xl p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-1">Log supply chain event</h2>
      <p className="text-sm text-gray-600 mb-4">
        Stages must happen in order: tested, processed, shipped.
      </p>

      <form onSubmit={handleLogEvent} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Batch ID</label>
          <input type="number" min="1" required value={batchId} onChange={(e) => setBatchId(e.target.value)}
            placeholder="e.g. 1" className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Event type</label>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 bg-white">
            {eventOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Details</label>
          <input type="text" required value={details} onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. Passed purity test, 98.5%" className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Attach file (optional)</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 text-sm bg-white" />
        </div>

        <button type="submit" disabled={busy}
          className="bg-gradient-to-b from-yellow-700 to-yellow-800 text-white px-6 py-2 rounded-full font-semibold shadow-md shadow-yellow-800/25 hover:brightness-110 transition mt-2 disabled:opacity-50">
          {busy ? "Working..." : "Log event"}
        </button>
      </form>

      {status && <p className={`text-sm mt-3 ${failed ? "text-red-700" : "text-gray-700"}`}>{status}</p>}
    </div>
  );
}

export default LabProcessorPortal;