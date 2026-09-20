import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import BeekeeperDashboard from "./pages/BeekeeperDashboard";
import LabProcessorPortal from "./pages/LabProcessorPortal";
import ConsumerLookup from "./pages/ConsumerLookup";
import AdminPanel from "./pages/AdminPanel";

function App() {
  const [connection, setConnection] = useState(null);

  function handleConnect({ account, role, provider }) {
    setConnection({ account, role, provider });
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center gap-6 py-10 px-4">
      <h1 className="text-3xl font-bold text-yellow-800">HoneyChain</h1>
      <ConnectWallet onConnect={handleConnect} />

      {connection && connection.account?.toLowerCase() === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" && (
        <AdminPanel connection={connection} />
      )}

      {connection && connection.role === "Beekeeper" && (
        <BeekeeperDashboard connection={connection} />
      )}

      {connection && ["Lab", "Processor", "Distributor"].includes(connection.role) && (
        <LabProcessorPortal connection={connection} />
      )}

      <div className="w-full max-w-lg border-t border-yellow-300 pt-6 mt-2">
        <ConsumerLookup />
      </div>
    </div>
  );
}

export default App;