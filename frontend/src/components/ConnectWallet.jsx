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
    <div className="flex flex-col items-center gap-2">
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-800 transition"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="bg-white border border-yellow-300 rounded-lg px-4 py-2 text-sm">
          <p className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</p>
          <p className="text-yellow-800 font-semibold">Role: {role}</p>
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

export default ConnectWallet;