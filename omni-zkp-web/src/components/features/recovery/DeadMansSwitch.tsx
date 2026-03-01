import { useState } from "react";
import { decryptShard, pingGuardianNetwork } from "../../../../utils/guardian";
import { Server, Key, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";

interface GuardianSwitchProps {
    encryptedShards: string[]; // Pass these from page.tsx (after user registers and encrypts them)
    onRecover: (rawShards: string[]) => void;
    recoveredSecret: string;
}

export const DeadMansSwitch = ({ encryptedShards, onRecover, recoveredSecret }: GuardianSwitchProps) => {
    const [networkState, setNetworkState] = useState<"idle" | "fetching" | "locked" | "decrypting" | "success">("idle");
    const [fetchedBlobs, setFetchedBlobs] = useState<string[]>([]);
    const [humanPin, setHumanPin] = useState("");
    const [error, setError] = useState("");

    const handlePingNetwork = async () => {
        setNetworkState("fetching");
        setError("");
        setFetchedBlobs([]);

        // Simulate concurrent requests to decentralized nodes
        const blobs = await Promise.all([
            pingGuardianNetwork(1, encryptedShards[0] || "dummy_data_1"),
            pingGuardianNetwork(2, encryptedShards[1] || "dummy_data_2")
        ]);

        setFetchedBlobs(blobs);
        setNetworkState("locked");
    };

    const handleCognitiveDecryption = async () => {
        setNetworkState("decrypting");
        setError("");

        // Decrypt the network blobs using the Human Input
        const raw1 = await decryptShard(fetchedBlobs[0], humanPin);
        const raw2 = await decryptShard(fetchedBlobs[1], humanPin);

        if (!raw1 || !raw2) {
            setError("Cognitive Decryption Failed: Invalid Recovery PIN.");
            setNetworkState("locked");
            return;
        }

        setNetworkState("success");
        onRecover([raw1, raw2]); // Pass raw shards to the WASM GF(2^8) engine
    };

    return (
        <div className="space-y-6">
            <div className="border border-red-900/50 bg-red-950/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4 text-red-400">
                    <ShieldAlert className="w-6 h-6" />
                    <h2 className="text-xl font-bold text-white">Automated Guardian Recovery</h2>
                </div>
                <p className="text-sm text-zinc-400 mb-6">
                    Ping decentralized Guardian nodes to retrieve AES-encrypted identity shards.
                    Cognitive human input is required to decrypt payloads before WASM synthesis.
                </p>

                {networkState === "idle" && (
                    <button onClick={handlePingNetwork} disabled={!encryptedShards.length} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
                        <Server className="w-4 h-4" /> Broadcast Recovery Signal
                    </button>
                )}

                {networkState === "fetching" && (
                    <div className="flex flex-col items-center py-8 space-y-4">
                        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-sm text-zinc-400 animate-pulse">Establishing secure MPC connections to Guardian Nodes...</div>
                    </div>
                )}

                {(networkState === "locked" || networkState === "decrypting" || networkState === "success") && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            {fetchedBlobs.map((blob, i) => (
                                <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded flex flex-col gap-2">
                                    <div className="text-xs text-zinc-500 flex items-center gap-1"><Server className="w-3 h-3" /> Node 0{i + 1} Response</div>
                                    <div className="text-[10px] text-emerald-500 font-mono break-all">{blob.substring(0, 40)}...</div>
                                    <div className="text-xs text-red-400 font-bold">LOCKED (AES-256-GCM)</div>
                                </div>
                            ))}
                        </div>

                        {networkState !== "success" && (
                            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg space-y-4 mt-6">
                                <label className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Key className="w-4 h-4 text-amber-500" /> Cognitive Gating (Recovery PIN)
                                </label>
                                <input
                                    type="password"
                                    value={humanPin}
                                    onChange={(e) => setHumanPin(e.target.value)}
                                    placeholder="Enter decryption PIN..."
                                    className="w-full bg-black border border-zinc-800 rounded p-3 text-white font-mono"
                                />
                                {error && <div className="text-xs text-red-500">{error}</div>}
                                <button onClick={handleCognitiveDecryption} disabled={networkState === "decrypting" || !humanPin} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded flex items-center justify-center gap-2">
                                    {networkState === "decrypting" ? "Decrypting..." : "Decrypt & Synthesize"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {recoveredSecret && (
                    <div className="mt-6 p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-lg animate-in zoom-in duration-300">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold">
                            <Cpu className="w-5 h-5" /> Master Secret Reconstructed (GF 2^8)
                        </div>
                        <code className="text-xs text-zinc-300 break-all">{recoveredSecret}</code>
                    </div>
                )}
            </div>
        </div>
    );
};