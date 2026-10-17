function Navbar({ connection, activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", needsRole: true },
    { id: "browse", label: "All batches" },
    { id: "consumer", label: "Verify honey" },
  ];

  const visibleTabs = tabs.filter((t) => !t.needsRole || (connection && connection.role !== "None"));

  return (
    <nav className="inline-flex gap-1 p-1 rounded-full bg-white/55 backdrop-blur-md border border-white shadow-sm">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-yellow-900 text-yellow-50 shadow"
              : "text-gray-600 hover:text-yellow-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default Navbar;