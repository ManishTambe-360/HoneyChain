function Navbar({ connection, activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", roles: ["Admin", "Beekeeper", "Lab", "Processor", "Distributor"] },
    { id: "browse", label: "All Batches", roles: ["Admin", "Beekeeper", "Lab", "Processor", "Distributor", "None"] },
    { id: "consumer", label: "Verify Honey", roles: ["Admin", "Beekeeper", "Lab", "Processor", "Distributor", "None"] },
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (!connection) return tab.id === "consumer" || tab.id === "browse";
    return tab.roles.includes(connection.role);
  });

  return (
    <nav className="w-full max-w-4xl flex gap-2 border-b border-yellow-300 pb-2">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 rounded-t-lg font-semibold transition ${
            activeTab === tab.id
              ? "bg-yellow-700 text-white"
              : "bg-white text-yellow-800 hover:bg-yellow-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default Navbar;