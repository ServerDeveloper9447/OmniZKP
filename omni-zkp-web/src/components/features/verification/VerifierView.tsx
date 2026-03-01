"use client";

import { useState, useEffect } from "react";
import {
    Building2, ShieldCheck, Bike,
    CheckCircle, Circle, Loader2, AlertTriangle, Zap,
} from "lucide-react";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
    Button, Badge, Separator, cn,
} from "../../ui/index";
import { ContextSliders } from "./ContextSliders";
import { CredentialJson } from "./CredentialJson";
import { anchorCredentialToChain } from "../../../../utils/anchor";
import type { VerifierProfile, Identity } from "../../../lib/types";

const ICON_MAP: Record<string, React.ElementType> = { Building2, ShieldCheck, Bike };

interface VerifierViewProps {
    profile: VerifierProfile;
    identity: Identity | null;
    emailData: any;
    isWasmReady: boolean;
    proving: boolean;
    provingStep: number;
    credential: any;
    distM: number;
    signalS: number;
    onDistChange: (v: number) => void;
    onSignalChange: (v: number) => void;
    onVerify: (scope: string) => Promise<void>;
    useHardwareEnclave: boolean;
    onHardwareToggle: (v: boolean) => void;
}

export function VerifierView({
    profile, identity, emailData, isWasmReady,
    proving, provingStep, credential,
    distM, signalS, onDistChange, onSignalChange, onVerify,
    useHardwareEnclave, onHardwareToggle,
}: VerifierViewProps) {
    /** Tracks the on-chain transaction hash after a credential is anchored to Polygon. */
    const [anchorTx, setAnchorTx] = useState<string | null>(null);
    const [isAnchoring, setIsAnchoring] = useState(false);

    const Icon = ICON_MAP[profile.icon] ?? Building2;
    const canProve = !!identity && isWasmReady && !proving;

    /**
     * Submits the issued W3C Verifiable Credential as a state root to the OmniAnchor
     * smart contract on Polygon, returning the resulting transaction hash.
     */
    const handleAnchor = async () => {
        if (!credential) return;
        setIsAnchoring(true);
        try {
            const txHash = await anchorCredentialToChain(credential);
            setAnchorTx(txHash);
        } catch (error) {
            console.error("Failed to anchor credential:", error);
        }
        setIsAnchoring(false);
    };

    const [timer, setTimer] = useState("0.00");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (proving) {
            const start = performance.now();
            interval = setInterval(() => {
                setTimer(((performance.now() - start) / 1000).toFixed(2));
            }, 50);
        } else {
            setTimer("0.00");
        }
        return () => clearInterval(interval);
    }, [proving]);

    return (
        <div className="space-y-1">
            {/* heading */}
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-zinc-400" />
                <h1 className="text-lg font-semibold tracking-tight">{profile.name}</h1>
                <Badge variant="outline" className="font-mono">
                    {profile.scope}
                </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.description}</p>

            <div className="pt-2" />

            {/* No identity warning */}
            {!identity && (
                <div className="flex items-start gap-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Identity required</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            Initialise your wallet first to generate a ZK proof.
                        </p>
                    </div>
                </div>
            )}

            {/* Policy card */}
            <Card>
                <CardHeader>
                    <CardTitle>Verifier Policy</CardTitle>
                    <CardDescription>Requirements that must be satisfied by the ZK proof.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {profile.requirements.map((req, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-zinc-600 dark:text-zinc-300">{req}</span>
                            </li>
                        ))}
                    </ul>
                    {profile.requiresDkim && !emailData && (
                        <div className="flex items-center gap-2 mt-4 text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Upload a DKIM-signed .eml in Identity Wallet before generating proof.
                        </div>
                    )}
                </CardContent>
            </Card>

            {identity && (
                <>
                    {/* Context sliders */}
                    <Card>
                        <CardContent className="pt-5">
                            <ContextSliders
                                distM={distM}
                                signalS={signalS}
                                onDistChange={onDistChange}
                                onSignalChange={onSignalChange}
                                maxDistM={profile.maxDistM}
                                maxSignalS={profile.maxSignalS}
                            />
                        </CardContent>
                    </Card>

                    {/* Proof engine */}
                    <Card>
                        <CardHeader>
                            <CardTitle>ZK Proof Engine</CardTitle>
                            <CardDescription>
                                Six-stage Halo2 prover pipeline — steps complete in real time.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Step pipeline */}
                            <div className="space-y-1.5">
                                {profile.proofSteps.map((step, i) => {
                                    const isComplete = proving ? provingStep > i : false;
                                    const isActive = proving ? provingStep === i : false;
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex items-center gap-2.5 px-2 py-1 rounded text-xs font-mono transition-colors",
                                                isActive ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800" :
                                                    isComplete ? "text-emerald-600 dark:text-emerald-400" :
                                                        "text-zinc-400 dark:text-zinc-600"
                                            )}
                                        >
                                            {isComplete ? (
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                            ) : isActive ? (
                                                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                                            ) : (
                                                <Circle className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                            <span>{i + 1}. {step}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {emailData && (
                                <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2">
                                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                    DKIM attestation attached — {emailData.signer}
                                </div>
                            )}

                            {/* TEE Hardware Enclave Toggle */}
                            <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        Secure Enclave (TEE)
                                    </div>
                                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                        Sign sensor data via OS Keychain to prevent spoofing.
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={useHardwareEnclave}
                                        onChange={(e) => onHardwareToggle(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                                </label>
                            </div>

                            <Separator />

                            <Button
                                id={`btn-prove-${profile.id}`}
                                onClick={() => onVerify(profile.scope)}
                                disabled={!canProve}
                                className="w-full"
                            >
                                {proving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span className="font-mono w-40 text-left">
                                            Executing WASM... {timer}s
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Generate & Submit Proof
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* W3C Credential Output & Cross-Chain Anchoring */}
                    {credential && (
                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CredentialJson credential={credential} />

                            {!anchorTx ? (
                                <Button
                                    onClick={handleAnchor}
                                    disabled={isAnchoring}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 transition-all"
                                >
                                    {isAnchoring ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Anchoring State Root to Polygon...
                                        </>
                                    ) : (
                                        "Anchor State Root to Polygon"
                                    )}
                                </Button>
                            ) : (
                                <div className="p-4 bg-indigo-950/40 border border-indigo-500/50 rounded-lg animate-in zoom-in duration-300">
                                    <div className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-indigo-400" />
                                        Cryptographic Anchor Confirmed
                                    </div>
                                    <div className="font-mono mt-2 text-indigo-200/80 truncate text-xs bg-black/40 p-2 rounded">
                                        TX: {anchorTx}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}