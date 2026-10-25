import { useState, useEffect } from "react";
import { Contract, JsonRpcProvider, getAddress, sha256, ZeroHash } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { CONTRACT_ADDRESS, CONTRACT_ABI, NETWORK } from "../contractConfig";
import Spinner from "../components/Spinner";

const ROLE_NAMES = ["None", "Beekeeper", "Lab", "Processor", "Distributor"];
const STAGES = ["Harvested", "Tested", "Processed", "Shipped"];

function parseDetails(text) {
  const m = text.match(/\[IPFS: (\w+)\]/);
  if (!m) return { note: text, fileUrl: null };
  return {
    note: text.replace(m[0], "").trim(),
    fileUrl: `https://gateway.pinata.cloud/ipfs/${m[1]}`,
  };
}

// Public RPCs often cap how many blocks a log search may cover.
// Try one search first, then fall back to small chunks. If any chunk fails,
// return nothing rather than a partial list that would misalign with events.
async function getLogs(provider, contract, filter) {
  const from = NETWORK.deployBlock || 0;
  try {
    return await contract.queryFilter(filter, from, "latest");
  } catch {
    try {
      const latest = await provider.getBlockNumber();
      const out = [];
      for (let start = from; start <= latest; start += 2000) {
        out.push(...(await contract.queryFilter(filter, start, Math.min(start + 1999, latest))));
      }
      return out;
    } catch {
      return [];
    }
  }
}

function Hash({ value, kind }) {
  if (!NETWORK.explorerUrl) return <span className="font-mono break-all">{value}</span>;
  return (
    <a
      href={`${NETWORK.explorerUrl}/${kind}/${value}`}
      target="_blank"
      rel="noreferrer"
      className="font-mono break-all underline decoration-yellow-600 underline-offset-2 hover:text-yellow-700"
    >
      {value}
    </a>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col items-center">
      <dt className="text-gray-500">{label}</dt>
      <dd className="min-w-0 text-center">{children}</dd>
    </div>
  );
}

function RoleBadge({ role }) {
  return <span className="font-semibold bg-yellow-100 px-1.5 py-0.5 rounded mr-2">{role}</span>;
}

function ConsumerLookup({ jumpToBatchId }) {
  const urlBatchId = new URLSearchParams(window.location.search).get("batchId") || "";
  const initialBatchId = jumpToBatchId || urlBatchId;

  const [batchId, setBatchId] = useState(initialBatchId);
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [searchedId, setSearchedId] = useState("");
  const [checks, setChecks] = useState({});

  useEffect(() => {
    if (jumpToBatchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBatchId(jumpToBatchId.toString());
      loadBatch(jumpToBatchId);
    } else if (urlBatchId) {
      loadBatch(urlBatchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToBatchId]);

  // Live updates: refresh whenever a new event is logged for the open batch
  useEffect(() => {
    if (!searchedId) return;
    const provider = new JsonRpcProvider(NETWORK.rpcUrl);
    const contract = new Contract(getAddress(CONTRACT_ADDRESS.toLowerCase()), CONTRACT_ABI, provider);
    contract.on("EventLogged", (bid) => {
      if (Number(bid) === Number(searchedId)) loadBatch(searchedId, true);
    });
    return () => {
      contract.removeAllListeners();
      provider.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedId]);

  async function loadBatch(rawId, silent = false) {
    const id = Number(rawId);
    if (!silent) {
      setStatus("loading");
      setBatch(null);
      setHistory([]);
      setChecks({});
    }

    try {
      const provider = new JsonRpcProvider(NETWORK.rpcUrl);
      const contract = new Contract(getAddress(CONTRACT_ADDRESS.toLowerCase()), CONTRACT_ABI, provider);

      const [b, events] = await contract.getBatchDetails(id);

      const [eventLogs, createdLogs] = await Promise.all([
        getLogs(provider, contract, contract.filters.EventLogged(id)),
        getLogs(provider, contract, contract.filters.BatchCreated(id)),
      ]);

      const roles = await Promise.all(
        events.map(async (ev) => ROLE_NAMES[Number(await contract.roles(ev.actor))])
      );

      setBatch({
        location: b.apiaryLocation,
        floral: b.floralSource,
        harvested: new Date(Number(b.harvestDate) * 1000).toLocaleDateString(),
        kg: b.quantityKg.toString(),
        tested: b.qualityTested,
        beekeeper: b.beekeeper,
        stage: Number(b.stage),
        status: Number(b.status),
        txHash: createdLogs[0]?.transactionHash || "",
      });

      setHistory(
        events.map((ev, i) => ({
          rawType: ev.eventType,
          type: ev.eventType.replace(/([a-z])([A-Z])/g, "$1 $2"),
          actor: ev.actor,
          role: ev.eventType === "Recalled" ? "Admin" : roles[i],
          time: new Date(Number(ev.timestamp) * 1000).toLocaleString(),
          txHash: eventLogs.length === events.length ? eventLogs[i].transactionHash : "",
          docHash: ev.docHash,
          hasDoc: ev.docHash !== ZeroHash,
          ...parseDetails(ev.details),
        }))
      );

      setSearchedId(id.toString());
      setStatus("");
      provider.destroy();
    } catch (err) {
      console.error(err);
      if (!silent) setStatus("notfound");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    loadBatch(batchId);
  }

  async function checkFile(index, file, onChainHash) {
    if (!file) return;
    const hash = sha256(new Uint8Array(await file.arrayBuffer()));
    setChecks((c) => ({ ...c, [index]: { ok: hash === onChainHash.toLowerCase(), name: file.name } }));
  }

  const recallEvent = history.find((h) => h.rawType === "Recalled");

  return (
    <div className="w-full flex flex-col items-center gap-6 text-center">
      <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md">
        <input
          type="number"
          min="1"
          required
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="Batch number from the jar"
          className="flex-1 border border-white bg-white/80 backdrop-blur rounded-full px-5 py-2 shadow-sm"
        />
        <button className="bg-gradient-to-b from-yellow-700 to-yellow-800 text-white px-6 py-2 rounded-full font-semibold shadow-md shadow-yellow-800/25 hover:brightness-110 transition">
          Verify
        </button>
      </form>

      {status === "loading" && <Spinner text="Reading the blockchain..." />}
      {status === "notfound" && (
        <p className="text-sm text-red-700">
          No batch found with that number. Check the number on the jar and try again.
        </p>
      )}
      {!batch && !status && (
        <p className="text-gray-600 text-sm max-w-md">
          Enter the batch number printed on your jar to see where the honey came from and who handled it.
        </p>
      )}

      {batch && (
        <section className="w-full max-w-2xl rounded-3xl overflow-hidden border border-white bg-white/85 backdrop-blur-md shadow-2xl shadow-yellow-800/20">
          {batch.status === 1 && (
            <div className="bg-red-700 text-white px-6 py-3 text-sm font-semibold">
              This batch failed its quality test and must not be sold.
            </div>
          )}
          {batch.status === 2 && (
            <div className="bg-red-700 text-white px-6 py-3 text-sm">
              <p className="font-semibold">This batch has been recalled.</p>
              {recallEvent?.note && <p className="mt-1">Reason: {recallEvent.note}</p>}
              {recallEvent?.fileUrl && (
                <a href={recallEvent.fileUrl} target="_blank" rel="noreferrer"
                  className="inline-block mt-1 font-semibold underline decoration-2 underline-offset-4">
                  View recall report
                </a>
              )}
            </div>
          )}

          <div className="relative bg-gradient-to-br from-[#F8CF73] via-yellow-600 to-[#D98A1C] px-6 py-7 flex flex-col items-center gap-3">
            <span className="absolute top-3 right-4 flex items-center gap-1.5 text-xs font-medium text-yellow-900">
              <span className="w-2 h-2 rounded-full bg-yellow-900 animate-pulse" aria-hidden="true" />
              Live
            </span>
            <div>
              <p className="text-sm font-medium text-yellow-900">Batch</p>
              <p className="font-display text-6xl font-bold leading-none text-yellow-900">#{searchedId}</p>
            </div>
            {batch.tested && batch.status === 0 && (
              <span className="inline-flex items-center gap-2 bg-yellow-900 text-yellow-50 px-3 py-1 rounded-full text-sm font-medium">
                <span className="hex w-3 h-3.5 bg-yellow-600" aria-hidden="true" />
                Quality tested
              </span>
            )}
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG value={`${window.location.origin}?batchId=${searchedId}`} size={84} />
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <ol className="flex justify-center gap-2" aria-label="Batch progress">
              {STAGES.map((s, i) => (
                <li key={s} className="flex flex-col items-center gap-1 w-20">
                  <span className={`hex w-7 h-8 ${i <= batch.stage ? "bg-yellow-600" : "bg-yellow-100"}`} aria-hidden="true" />
                  <span className={`text-xs ${i <= batch.stage ? "font-semibold" : "text-gray-500"}`}>{s}</span>
                </li>
              ))}
            </ol>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm border-t border-yellow-300 pt-6">
              <div><dt className="text-gray-500">Apiary</dt><dd className="font-medium">{batch.location}</dd></div>
              <div><dt className="text-gray-500">Floral source</dt><dd className="font-medium">{batch.floral}</dd></div>
              <div><dt className="text-gray-500">Harvested</dt><dd className="font-medium">{batch.harvested}</dd></div>
              <div><dt className="text-gray-500">Quantity</dt><dd className="font-medium">{batch.kg} kg</dd></div>
            </dl>

            <dl className="text-xs flex flex-col gap-3 border-t border-yellow-300 pt-4">
              <Row label="Harvested by">
                <RoleBadge role="Beekeeper" />
                <Hash value={batch.beekeeper} kind="address" />
              </Row>
              {batch.txHash && (
                <Row label="Transaction">
                  <Hash value={batch.txHash} kind="tx" />
                </Row>
              )}
            </dl>

            <div className="border-t border-yellow-300 pt-6">
              <h3 className="font-bold text-lg mb-5">Chain of custody</h3>
              {history.length === 0 ? (
                <p className="text-sm text-gray-600">Nobody has logged an event for this batch yet.</p>
              ) : (
                <ol className="relative flex flex-col items-center gap-6 before:content-[''] before:absolute before:left-1/2 before:top-3 before:bottom-3 before:w-0.5 before:-translate-x-1/2 before:bg-yellow-600">
                  {history.map((ev, i) => (
                    <li key={i} className="relative z-10 w-full flex flex-col items-center">
                      <span className="hex w-6 h-7 bg-yellow-600" aria-hidden="true" />
                      <div className="mt-2 w-full max-w-md bg-white border border-yellow-300/60 shadow-md shadow-yellow-800/10 rounded-xl px-5 py-4">
                        <p className="font-semibold text-lg leading-tight">{ev.type}</p>
                        <p className="text-xs text-gray-500">{ev.time}</p>
                        <p className="text-sm mt-2">{ev.note}</p>

                        {ev.fileUrl && (
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-2 text-sm font-semibold text-yellow-700 underline decoration-2 decoration-yellow-600 underline-offset-4 hover:text-yellow-800"
                          >
                            View attached file
                          </a>
                        )}

                        {ev.hasDoc && (
                          <div className="mt-3 text-xs">
                            <label className="cursor-pointer font-semibold text-yellow-700 underline decoration-2 decoration-yellow-600 underline-offset-4 hover:text-yellow-800">
                              Check a file against this record
                              <input type="file" className="hidden" onChange={(e) => checkFile(i, e.target.files[0], ev.docHash)} />
                            </label>
                            {checks[i] && (
                              <p className={`mt-2 font-semibold ${checks[i].ok ? "text-green-700" : "text-red-700"}`}>
                                {checks[i].ok
                                  ? `${checks[i].name} matches the blockchain record.`
                                  : `${checks[i].name} does NOT match. This is not the original document.`}
                              </p>
                            )}
                          </div>
                        )}

                        <dl className="text-xs flex flex-col gap-3 mt-4 pt-3 border-t border-yellow-300">
                          <Row label="Logged by">
                            <RoleBadge role={ev.role} />
                            <Hash value={ev.actor} kind="address" />
                          </Row>
                          {ev.hasDoc && (
                            <Row label="Document hash (SHA-256)">
                              <span className="font-mono break-all">{ev.docHash}</span>
                            </Row>
                          )}
                          {ev.txHash && (
                            <Row label="Transaction">
                              <Hash value={ev.txHash} kind="tx" />
                            </Row>
                          )}
                        </dl>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ConsumerLookup;