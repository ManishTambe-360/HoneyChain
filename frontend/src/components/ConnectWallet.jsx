import { useState, useEffect } from "react";
import { BrowserProvider, Contract, getAddress } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, HARDHAT_CHAIN_ID } from "../contractConfig";

const ROLE_NAMES = ["None", "Beekeeper", "Lab", "Processor", "Distributor"];

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
      const provider = new BrowserProvider(window.ethereum);

      // Ask MetaMask to connect
      const accounts = await provider.send("eth_requestAccounts", []);
      const connectedAccount = accounts[0];

      // Confirm we're on the right network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== HARDHAT_CHAIN_ID) {
        setError(`Wrong network. Please switch MetaMask to Hardhat Local (Chain ID ${HARDHAT_CHAIN_ID}).`);
        return;
      }

      // Read this account's role from the contract
      const checksummedContractAddress = getAddress(CONTRACT_ADDRESS.toLowerCase());
      const contract = new Contract(checksummedContractAddress, CONTRACT_ABI, provider);
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
      setError("Failed to connect wallet. See console for details.");
    }
  }

  // Reload if the user switches accounts in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;

    function handleAccountsChanged() {
      window.location.reload();
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
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
      {error && <p className="text-red-700 text-xs max-w-xs text-center">{error}</p>}
    </div>
  );
}

export default ConnectWallet;