import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import Navbar from "./components/Navbar";
import BeekeeperDashboard from "./pages/BeekeeperDashboard";
import LabProcessorPortal from "./pages/LabProcessorPortal";
import ConsumerLookup from "./pages/ConsumerLookup";
import AdminPanel from "./pages/AdminPanel";
import BrowseBatches from "./pages/BrowseBatches";

function App() {
  const [connection, setConnection] = useState(null);
  const [activeTab, setActiveTab] = useState("consumer");
  const [jumpToBatchId, setJumpToBatchId] = useState(null);

  function handleConnect({ account, role, provider }) {
    setConnection({ account, role, provider });
    setActiveTab("dashboard");
  }

  function handleSelectBatch(id) {
    setJumpToBatchId(id);
    setActiveTab("consumer");
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center gap-6 py-10 px-4">
      <h1 className="text-3xl font-bold text-yellow-800">🍯 HoneyChain</h1>
      <ConnectWallet onConnect={handleConnect} />

      <Navbar connection={connection} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "dashboard" && connection && connection.role === "Admin" && (
        <AdminPanel connection={connection} />
      )}

      {activeTab === "dashboard" && connection && connection.role === "Beekeeper" && (
        <BeekeeperDashboard connection={connection} />
      )}

      {activeTab === "dashboard" &&
        connection &&
        ["Lab", "Processor", "Distributor"].includes(connection.role) && (
          <LabProcessorPortal connection={connection} />
        )}

      {activeTab === "browse" && <BrowseBatches onSelectBatch={handleSelectBatch} />}

      {activeTab === "consumer" && (
        <ConsumerLookup jumpToBatchId={jumpToBatchId} />
      )}
    </div>
  );
}

export default App;