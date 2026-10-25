import { useState, useEffect } from "react";
import { BrowserProvider, Contract, getAddress, toQuantity } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, NETWORK } from "../contractConfig";

const ROLE_NAMES = ["None", "Beekeeper", "Lab", "Processor", "Distributor"];

// Ask MetaMask to switch to the right network, adding it if it is unknown.
async function ensureNetwork() {
  const chainId = toQuantity(NETWORK.chainId);
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (err) {
    const code = err?.code ?? err?.data?.originalError?.code;
    if (code !== 4902 && code !== -32603) throw err;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId,
        chainName: NETWORK.name,
        nativeCurrency: NETWORK.currency,
        rpcUrls: [NETWORK.rpcUrl],
        ...(NETWORK.explorerUrl ? { blockExplorerUrls: [NETWORK.explorerUrl] } : {}),
      }],
    });
  }
}

function ConnectWallet({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");

  async function connectWallet() {
    setError("");

    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it to continue.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const connectedAccount = accounts[0];

      const currentChain = parseInt(await window.ethereum.request({ method: "eth_chainId" }), 16);
      if (currentChain !== NETWORK.chainId) {
        await ensureNetwork();
      }

      // Create the provider after any network switch so it sees the right chain
      const provider = new BrowserProvider(window.ethereum);

      const contract = new Contract(getAddress(CONTRACT_ADDRESS.toLowerCase()), CONTRACT_ABI, provider);
      const checksummedAccount = getAddress(connectedAccount.toLowerCase());

      const [roleIndex, adminAddress] = await Promise.all([
        contract.roles(checksummedAccount),
        contract.admin(),
      ]);

      const isAdmin = checksummedAccount.toLowerCase() === adminAddress.toLowerCase();
      const resolvedRole = isAdmin ? "Admin" : ROLE_NAMES[Number(roleIndex)];

      setAccount(connectedAccount);
      setRole(resolvedRole);

      if (onConnect) {
        onConnect({ account: connectedAccount, role: resolvedRole, provider });
      }
    } catch (err) {
      console.error(err);
      setError(err?.code === 4001 ? "Connection cancelled in MetaMask." : "Failed to connect wallet. See console for details.");
    }
  }

  useEffect(() => {
    if (!window.ethereum) return;
    const reload = () => window.location.reload();
    window.ethereum.on("accountsChanged", reload);
    window.ethereum.on("chainChanged", reload);
    return () => {
      window.ethereum.removeListener("accountsChanged", reload);
      window.ethereum.removeListener("chainChanged", reload);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-1">
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-gradient-to-b from-yellow-700 to-yellow-800 text-white px-6 py-2 rounded-full font-semibold shadow-md shadow-yellow-800/25 hover:brightness-110 transition"
        >
          Connect wallet
        </button>
      ) : (
        <div className="flex items-center gap-2 border border-white bg-white/80 backdrop-blur rounded-full px-4 py-1.5 shadow-sm text-sm">
          <span className="hex w-3 h-3.5 bg-yellow-600" aria-hidden="true" />
          <span className="font-semibold">{role}</span>
          <span className="font-mono text-xs text-gray-500">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      )}
      <p className="text-xs text-gray-500">{NETWORK.name}</p>
      {error && <p className="text-red-700 text-xs max-w-xs text-center">{error}</p>}
    </div>
  );
}

export default ConnectWallet;