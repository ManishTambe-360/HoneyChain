import { useState, useEffect } from "react";
import { Contract, JsonRpcProvider, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";
import Spinner from "../components/Spinner";

function BrowseBatches({ onSelectBatch }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    setLoading(true);
    setError("");

    try {
      const provider = new JsonRpcProvider("http://127.0.0.1:8545");
      const checksummedContractAddress = getAddress(CONTRACT_ADDRESS.toLowerCase());
      const contract = new Contract(checksummedContractAddress, CONTRACT_ABI, provider);

      const total = await contract.getTotalBatches();
      const totalNum = Number(total);

      const results = [];
      for (let id = 1; id <= totalNum; id++) {
        const [batchData] = await contract.getBatchDetails(id);
        results.push({
          id,
          apiaryLocation: batchData.apiaryLocation,
          floralSource: batchData.floralSource,
          quantityKg: batchData.quantityKg.toString(),
          qualityTested: batchData.qualityTested,
          harvestDate: new Date(Number(batchData.harvestDate) * 1000).toLocaleDateString(),
        });
      }

      setBatches(results.reverse()); // newest first
    } catch (err) {
      console.error(err);
      setError("Failed to load batches.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-6 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-yellow-800">All Batches</h2>
        <button
          onClick={loadBatches}
          className="text-sm text-yellow-700 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && <Spinner text="Loading batches from the blockchain..." />}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && batches.length === 0 && (
        <p className="text-gray-500 text-sm">No batches created yet.</p>
      )}

      <div className="space-y-2">
        {batches.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBatch(b.id)}
            className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-yellow-50 transition"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-yellow-900">Batch #{b.id}</span>
              <span className="text-xs text-gray-500">{b.harvestDate}</span>
            </div>
            <p className="text-sm text-gray-700">{b.apiaryLocation} — {b.floralSource} — {b.quantityKg}kg</p>
            <p className="text-xs mt-1">
              {b.qualityTested ? (
                <span className="text-green-700">✅ Quality Tested</span>
              ) : (
                <span className="text-gray-400">⏳ Not yet tested</span>
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BrowseBatches;