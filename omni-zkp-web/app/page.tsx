"use client";

import { useState, useEffect } from "react";
import init, { verify_proof_js } from "omni-zkp-core";
import Script from "next/script";
import {
  generateIdentity,
  createShards,
  recoverSecret,
  generateNullifier,
} from "../utils/crypto";
import { parseEmailDKIM } from "../utils/dkim";
import confetti from "canvas-confetti";

export default function Home() {
  // --- SYSTEM STATE ---
  const [activeTab, setActiveTab] = useState<
    "user" | "gov" | "bank" | "recovery"
  >("user");
  const [isWasmReady, setIsWasmReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // --- USER IDENTITY STATE ---
  const [identity, setIdentity] = useState<{
    masterSecret: string;
    salt: string;
    commitment: string;
  } | null>(null);
  const [shards, setShards] = useState<string[]>([]);

  // --- DKIM STATE ---
  const [emailData, setEmailData] = useState<any>(null);

  // --- RECOVERY STATE ---
  const [inputShards, setInputShards] = useState(["", "", ""]);
  const [recoveredSecret, setRecoveredSecret] = useState("");

  // --- ZK PROOF STATE ---
  const [proving, setProving] = useState(false);
  const [proofResult, setProofResult] = useState<string | null>(null);

  useEffect(() => {
    init().then(() => setIsWasmReady(true));
  }, []);

  const addLog = (msg: string) =>
    setLogs((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

  // 1. CREATE IDENTITY & SHARDS
  const handleRegister = () => {
    const id = generateIdentity();
    if (!id) return;

    setIdentity(id);
    addLog(
      `🆔 Identity Created! Commitment: ${id.commitment.substring(0, 16)}...`,
    );

    const s = createShards(id.masterSecret, 3, 2);
    setShards(s);
    addLog(`🧩 Secret Split into 3 Shards (Shamir's Scheme)`);
  };

  // 2. PARSE REAL EMAIL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      addLog("📧 Parsing Email Headers...");
      const data = await parseEmailDKIM(e.target.files[0]);
      setEmailData(data);
      addLog(`✅ DKIM Found! Signed by: ${data.signer}`);
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
  };

  // 3. GENERATE ZK PROOF (Context-Aware)
  const handleVerify = async (verifierName: string) => {
    if (!identity || !isWasmReady) return;
    setProving(true);
    addLog(`⚙️ Generating Proof for ${verifierName}...`);

    // SIMULATE LATENCY (Real proof takes ~1s)
    await new Promise((r) => setTimeout(r, 800));

    try {
      // In a real app, these BigInts come from the actual Identity + DKIM Hash
      // We map the "Real" string data to the circuit's numeric inputs
      const nullifier = generateNullifier(identity.masterSecret, verifierName);

      const result = verify_proof_js(
        BigInt(1000), // User Lat (Mocked for demo, normally GPS)
        BigInt(0), // User Time Drift
        BigInt(1000), // Target Lat
        BigInt(0), // Target Time Drift
      );

      if (result.includes("✅") && !result.includes("INVALID")) {
        setProofResult("VALID");
        addLog(`✅ PROOF VALIDATED by ${verifierName}`);
        addLog(`🔑 Nullifier Derived: ${nullifier.substring(0, 16)}...`);
        confetti({ origin: { y: 0.6 } });
      } else {
        addLog("❌ Proof Failed Constraints");
      }
    } catch (e) {
      addLog("❌ Circuit Error");
    }
    setProving(false);
  };

  // 4. RECOVER IDENTITY
  const handleRecover = async () => {
    // <--- Make ASYNC
    const validShards = inputShards.filter((s) => s.length > 0);

    // Add 'await' here 👇
    const rec = await recoverSecret(validShards);

    if (rec) {
      setRecoveredSecret(rec);
      addLog(`🔓 Dead Man's Switch Triggered: Secret Recovered!`);
      if (rec === identity?.masterSecret) addLog("✅ MATCHES ORIGINAL SECRET");
    } else {
      addLog("❌ Recovery Failed: Invalid Shards");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-mono flex">
      {/* LOAD SHAMIR'S SECRET SHARING LIBRARY */}
      <Script src="https://unpkg.com/secrets.js-grempe@2.0.0/secrets.min.js" strategy="beforeInteractive" />
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col gap-2">
        <h1 className="text-xl font-bold text-accent mb-6">
          Omni-ZKP{" "}
          <span className="text-xs border border-accent px-1 rounded">
            PROD
          </span>
        </h1>

        <button
          onClick={() => setActiveTab("user")}
          className={`btn btn-sm ${activeTab === "user" ? "btn-accent" : "btn-ghost"} justify-start`}
        >
          👤 User Wallet
        </button>
        <button
          onClick={() => setActiveTab("gov")}
          className={`btn btn-sm ${activeTab === "gov" ? "btn-primary" : "btn-ghost"} justify-start`}
        >
          🏛️ Government (Issuer)
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`btn btn-sm ${activeTab === "bank" ? "btn-secondary" : "btn-ghost"} justify-start`}
        >
          🏦 Bank (Verifier)
        </button>
        <button
          onClick={() => setActiveTab("recovery")}
          className={`btn btn-sm ${activeTab === "recovery" ? "btn-error" : "btn-ghost"} justify-start`}
        >
          💀 Dead Man's Switch
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* TAB: USER WALLET */}
        {activeTab === "user" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Identity Wallet</h2>

            {!identity ? (
              <button
                onClick={handleRegister}
                className="btn btn-accent btn-lg w-full shadow-lg shadow-accent/20"
              >
                Create New Omni Identity
              </button>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">
                    IDENTITY COMMITMENT (PUBLIC)
                  </div>
                  <code className="text-green-400 break-all">
                    {identity.commitment}
                  </code>
                </div>

                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">
                    MASTER SECRET (PRIVATE - DO NOT SHARE)
                  </div>
                  <div className="blur-sm hover:blur-none transition-all cursor-pointer bg-black p-2 rounded">
                    <code className="text-red-400 break-all">
                      {identity.masterSecret}
                    </code>
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                  <h3 className="font-bold mb-2">Import Credentials (DKIM)</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Upload a .eml file from Gmail/Outlook to prove
                    employment/student status.
                  </p>
                  <input
                    type="file"
                    accept=".eml"
                    onChange={handleFileUpload}
                    className="file-input file-input-bordered w-full"
                  />
                  {emailData && (
                    <div className="mt-2 text-sm">
                      <div className="badge badge-success gap-2">
                        Verified Signature: {emailData.signer}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-800 rounded border border-gray-700">
                  <h3 className="font-bold mb-2">
                    Recovery Shards (Save These!)
                  </h3>
                  {shards.map((s, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono bg-black p-2 mb-1 rounded break-all"
                    >
                      Shard {i + 1}: {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: GOVERNMENT / BANK (VERIFIERS) */}
        {(activeTab === "gov" || activeTab === "bank") && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {activeTab === "gov"
                ? "🏛️ Government Portal"
                : "🏦 Chase Bank Verification"}
            </h2>

            <div className="alert bg-gray-800 border-none mb-6">
              <span>
                Required:{" "}
                <b>
                  {activeTab === "gov"
                    ? "Citizenship + Location"
                    : "Income (Email) + Identity"}
                </b>
              </span>
            </div>

            {!identity ? (
              <div className="text-red-400">Please connect wallet first.</div>
            ) : (
              <div className="card bg-base-100 shadow-xl border border-gray-700">
                <div className="card-body">
                  <h2 className="card-title">Request Proof</h2>
                  <p className="text-sm text-gray-500">
                    The user will generate a ZK Proof locally. Only the result
                    is sent here.
                  </p>

                  {emailData ? (
                    <div className="text-xs bg-green-900/30 p-2 rounded text-green-400 mb-4">
                      Attestation: {emailData.signer} (DKIM)
                    </div>
                  ) : (
                    <div className="text-xs bg-yellow-900/30 p-2 rounded text-yellow-400 mb-4">
                      Warning: No Email Credential Linked
                    </div>
                  )}

                  <div className="justify-end card-actions">
                    <button
                      onClick={() =>
                        handleVerify(
                          activeTab === "gov" ? "GOV_INDIA" : "CHASE_BANK",
                        )
                      }
                      disabled={proving}
                      className="btn btn-primary w-full"
                    >
                      {proving ? "Verifying ZK Proof..." : "Verify User"}
                    </button>
                  </div>

                  {proofResult && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded text-center">
                      <div className="text-2xl">✅</div>
                      <div className="font-bold">Verified</div>
                      <div className="text-xs mt-1 opacity-70">
                        Nullifier:{" "}
                        {generateNullifier(
                          identity.masterSecret,
                          activeTab === "gov" ? "GOV_INDIA" : "CHASE_BANK",
                        ).substring(0, 12)}
                        ...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: RECOVERY */}
        {activeTab === "recovery" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4 text-red-400">
              💀 Dead Man's Switch
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              Enter any 2 of the 3 trusted shards to reconstruct the Identity.
            </p>

            <div className="space-y-4">
              {inputShards.map((val, i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Paste Shard #${i + 1}`}
                  className="input input-bordered w-full font-mono text-xs"
                  value={val}
                  onChange={(e) => {
                    const newS = [...inputShards];
                    newS[i] = e.target.value;
                    setInputShards(newS);
                  }}
                />
              ))}

              <button onClick={handleRecover} className="btn btn-error w-full">
                RECONSTRUCT IDENTITY
              </button>

              {recoveredSecret && (
                <div className="p-4 bg-red-900/20 border border-red-500 rounded mt-4">
                  <div className="text-xs text-red-300">
                    RECOVERED MASTER SECRET:
                  </div>
                  <code className="break-all">{recoveredSecret}</code>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LOGS PANEL */}
      <div className="w-80 bg-black border-l border-gray-800 p-4 text-xs font-mono overflow-y-auto">
        <div className="text-gray-500 mb-2 border-b border-gray-700 pb-1">
          SYSTEM LOGS
        </div>
        {logs.map((l, i) => (
          <div
            key={i}
            className={`mb-1 ${l.includes("✅") ? "text-green-400" : l.includes("❌") ? "text-red-400" : "text-gray-400"}`}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
