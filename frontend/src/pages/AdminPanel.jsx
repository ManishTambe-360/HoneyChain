import { useState } from "react";
import { Contract, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractConfig";

const ROLES = [
  { label: "Beekeeper", value: 1 },
  { label: "Lab", value: 2 },
  { label: "Processor", value: 3 },
  { label: "Distributor", value: 4 },
];

function AdminPanel({ connection }) {
  const [address, setAddress] = useState("");
  const [role, setRole] = useState(ROLES[0].value);
  const [status, setStatus] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setStatus("Waiting for confirmation in MetaMask...");

    try {
      const checksummedTarget = getAddress(address.toLowerCase());
      const signer = await connection.provider.getSigner();
      const checksummedContractAddress = getAddress(CONTRACT_ADDRESS.toLowerCase());
      const contract = new Contract(checksummedContractAddress, CONTRACT_ABI, signer);

      const tx = await contract.registerParticipant(checksummedTarget, Number(role));

      setStatus("Transaction sent, waiting for it to be mined...");
      await tx.wait();

      const roleLabel = ROLES.find((r) => r.value === Number(role))?.label;
      setStatus(`Registered ${checksummedTarget.slice(0, 6)}...${checksummedTarget.slice(-4)} as ${roleLabel}!`);
      setAddress("");
    } catch (err) {
      console.error(err);
      setStatus("Failed to register participant. Check the address and try again.");
    }
  }

  return (
    <div className="bg-white border border-yellow-300 rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-yellow-800 mb-4">Register Participant</h2>

      <form onSubmit={handleRegister} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Wallet Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            required
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1 font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-800 transition mt-2"
        >
          Register
        </button>
      </form>

      {status && <p className="text-sm text-gray-700 mt-3">{status}</p>}
    </div>
  );
}

export default AdminPanel;