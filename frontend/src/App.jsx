import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import Navbar from "./components/Navbar";
import BeekeeperDashboard from "./pages/BeekeeperDashboard";
import LabProcessorPortal from "./pages/LabProcessorPortal";
import ConsumerLookup from "./pages/ConsumerLookup";
import AdminPanel from "./pages/AdminPanel";
import BrowseBatches from "./pages/BrowseBatches";
import Logo from "./components/Logo";
import RecallPanel from "./pages/RecallPanel";

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
    <div className="min-h-screen flex flex-col items-center gap-8 py-10 px-4">
      <header className="flex flex-col items-center gap-3 text-center">
        <Logo size={72} />
        <h1 className="text-4xl font-bold">HoneyChain</h1>
        <ConnectWallet onConnect={handleConnect} />
      </header>

      <main className="w-full max-w-3xl flex flex-col items-center gap-6">
        <Navbar connection={connection} activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "dashboard" && connection?.role === "Admin" && (
          <>
            <AdminPanel connection={connection} />
            <RecallPanel connection={connection} />
          </>
        )}
        {activeTab === "dashboard" && connection?.role === "Beekeeper" && (
          <BeekeeperDashboard connection={connection} />
        )}
        {activeTab === "dashboard" &&
          ["Lab", "Processor", "Distributor"].includes(connection?.role) && (
            <LabProcessorPortal connection={connection} />
          )}

        {activeTab === "browse" && <BrowseBatches onSelectBatch={handleSelectBatch} />}
        {activeTab === "consumer" && <ConsumerLookup jumpToBatchId={jumpToBatchId} />}
      </main>
    </div>
  );
}

export default App;