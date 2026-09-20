import { useState, useEffect } from "react";
import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";
import { QRCodeSVG } from "qrcode.react";

function ConsumerLookup() {
  const params = new URLSearchParams(window.location.search);
  const initialBatchId = params.get("batchId") || "";

  const [batchId, setBatchId] = useState(initialBatchId);
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {                              // ← the actual useEffect call
    if (initialBatchId) {
      handleSearch({ preventDefault: () => {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setStatus("Searching...");
    setBatch(null);
    setHistory([]);

    try {
      // Read-only lookup — no wallet needed, connects directly to the local node
      const provider = new JsonRpcProvider("http://127.0.0.1:8545");
      const checksummedContractAddress = getAddress(CONTRACT_ADDRESS.toLowerCase());
      const contract = new Contract(checksummedContractAddress, CONTRACT_ABI, provider);

      const [batchData, eventHistory] = await contract.getBatchDetails(Number(batchId));

      setBatch({
        apiaryLocation: batchData.apiaryLocation,
        floralSource: batchData.floralSource,
        harvestDate: new Date(Number(batchData.harvestDate) * 1000).toLocaleString(),
        quantityKg: batchData.quantityKg.toString(),
        qualityTested: batchData.qualityTested,
        beekeeper: batchData.beekeeper,
      });

      setHistory(
        eventHistory.map((ev) => ({
          eventType: ev.eventType,
          actor: ev.actor,
          details: ev.details,
          timestamp: new Date(Number(ev.timestamp) * 1000).toLocaleString(),
        }))
      );

      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Batch not found, or an error occurred.");
    }
  }

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-6 w-full max-w-lg">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">Verify Your Honey</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="number"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="Enter Batch ID"
          required
          min="1"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-800 transition"
        >
          Search
        </button>
      </form>

      {status && <p className="text-sm text-gray-600">{status}</p>}

      {batch && (
         <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-yellow-900">Batch #{batchId}</h3>
                <QRCodeSVG
                    value={`${window.location.origin}?batchId=${batchId}`}
                    size={64}
                />
            </div>
          <div className="text-sm text-gray-700 space-y-1 mb-4">
            <p><span className="font-semibold">Apiary Location:</span> {batch.apiaryLocation}</p>
            <p><span className="font-semibold">Floral Source:</span> {batch.floralSource}</p>
            <p><span className="font-semibold">Quantity:</span> {batch.quantityKg} kg</p>
            <p><span className="font-semibold">Harvested:</span> {batch.harvestDate}</p>
            <p><span className="font-semibold">Quality Tested:</span> {batch.qualityTested ? "Yes" : "Not yet"}</p>
            <p className="font-mono text-xs"><span className="font-semibold font-sans">Beekeeper:</span> {batch.beekeeper}</p>
          </div>

          <h4 className="font-bold text-yellow-900 mb-2">Supply Chain Timeline</h4>
          <div className="space-y-3">
            {history.length === 0 && (
              <p className="text-sm text-gray-500">No events logged yet.</p>
            )}
            {history.map((ev, idx) => (
              <div key={idx} className="border-l-4 border-yellow-600 pl-3">
                <p className="font-semibold text-yellow-800">{ev.eventType}</p>
                <p className="text-xs text-gray-600">{ev.timestamp}</p>
                <p className="text-sm text-gray-700">{ev.details}</p>
                <p className="text-xs font-mono text-gray-400">by {ev.actor.slice(0, 6)}...{ev.actor.slice(-4)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsumerLookup;
