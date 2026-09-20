import { useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import BeekeeperDashboard from "./pages/BeekeeperDashboard";
import LabProcessorPortal from "./pages/LabProcessorPortal";

function App() {
  const [connection, setConnection] = useState(null);

  function handleConnect({ account, role, provider }) {
    setConnection({ account, role, provider });
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center gap-6 py-10 px-4">
      <h1 className="text-3xl font-bold text-yellow-800">HoneyChain</h1>
      <ConnectWallet onConnect={handleConnect} />

      {connection && connection.role === "Beekeeper" && (
        <BeekeeperDashboard connection={connection} />
      )}

      {connection && (connection.role === "Lab" || connection.role === "Processor") && (
        <LabProcessorPortal connection={connection} />
      )}

      {connection && !["Beekeeper", "Lab", "Processor"].includes(connection.role) && (
        <p className="text-gray-600 mt-4">
          Connected as <span className="font-semibold">{connection.role}</span>.
          No dashboard available for this role yet.
        </p>
      )}
    </div>
  );
}

export default App;