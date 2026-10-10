import { useState } from "react";
import { Contract, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";

const EVENT_TYPES = ["QualityTested", "Processed", "Shipped"];

function LabProcessorPortal({ connection }) {
  const [batchId, setBatchId] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [details, setDetails] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadToIPFS() {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("IPFS upload failed");
    const data = await response.json();
    return data.ipfsHash;
  }

  async function handleLogEvent(e) {
    e.preventDefault();
    const form = e.target;
    setBusy(true);

    try {
      let finalDetails = details;

      if (file) {
        setStatus("Uploading file to IPFS...");
        const ipfsHash = await uploadToIPFS();
        finalDetails = `${details} [IPFS: ${ipfsHash}]`;
      }

      setStatus("Waiting for confirmation in MetaMask...");
      const signer = await connection.provider.getSigner();
      const checksummedContractAddress = getAddress(CONTRACT_ADDRESS.toLowerCase());
      const contract = new Contract(checksummedContractAddress, CONTRACT_ABI, signer);

      const tx = await contract.logEvent(Number(batchId), eventType, finalDetails);

      setStatus("Transaction sent, waiting for it to be mined...");
      await tx.wait();

      setStatus(`Event "${eventType}" logged successfully for Batch #${batchId}!`);
      setDetails("");
      setFile(null);
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus("Failed to log event. See console for details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">Log Supply Chain Event</h2>

      <form onSubmit={handleLogEvent} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Batch ID</label>
          <input
            type="number"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="e.g. 1"
            required
            min="1"
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Details</label>
          <input
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. Passed purity test, 98.5%"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Attach File (optional)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-800 transition mt-2 disabled:opacity-50"
        >
          {busy ? "Working..." : "Log Event"}
        </button>
      </form>

      {status && <p className="text-sm text-gray-700 mt-3">{status}</p>}
    </div>
  );
}

export default LabProcessorPortal;