import ConnectWallet from "./components/ConnectWallet";

function App() {
  function handleConnect({ account, role }) {
    console.log("Connected:", account, "Role:", role);
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold text-yellow-800">HoneyChain</h1>
      <ConnectWallet onConnect={handleConnect} />
    </div>
  );
}

export default App;