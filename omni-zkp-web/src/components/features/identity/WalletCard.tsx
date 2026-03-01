"use client";

import { Fingerprint, Upload, CheckCircle, AlertCircle, Lock } from "lucide-react";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
    Button, Badge, Separator, cn,
} from "../../ui/index";
import type { Identity } from "../../../lib/types";

interface WalletCardProps {
    identity: Identity | null;
    emailData: any;
    isWasmReady: boolean;
    onRegister: () => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    usePQCVariant: boolean;
    onPQCToggle: (enabled: boolean) => void;
}

export function WalletCard({
    identity, emailData, isWasmReady, onRegister, onFileUpload,
    usePQCVariant, onPQCToggle,
}: WalletCardProps) {
    return (
        <div className="space-y-1">
            {/* Page heading */}
            <h1 className="text-lg font-semibold tracking-tight">Identity Wallet</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Generate a ZK identity anchored by a Pedersen commitment.
            </p>

            <div className="pt-2" />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Master Identity</CardTitle>
                        {identity ? (
                            <Badge variant="success">
                                <CheckCircle className="w-3 h-3" />
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Not initialised</Badge>
                        )}
                    </div>
                    <CardDescription>
                        {identity
                            ? "Your identity is active. The commitment below is safe to share publicly."
                            : "Click the button below to generate a secure master secret via the WASM enclave."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {identity ? (
                        <>
                            {/* Commitment */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span className="font-medium">Identity Commitment</span>
                                    <span className="text-zinc-400 dark:text-zinc-500">· public</span>
                                </div>
                                <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 overflow-x-auto">
                                    <code className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 break-all">
                                        {identity.commitment}
                                    </code>
                                </div>
                                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                                    Reveals zero information about your master secret.
                                </p>
                            </div>

                            <Separator />

                            {/* PQC Variant Toggle */}
                            <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        Post-Quantum (PQC) Mode
                                    </div>
                                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                        Route proof through quantum-resistant STARK architecture.
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-info"
                                    checked={usePQCVariant}
                                    onChange={(e) => onPQCToggle(e.target.checked)}
                                />
                            </div>

                            <Separator />

                            {/* DKIM upload */}
                            <div className="space-y-1.5">
                                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                    DKIM Email Attestation
                                    <span className="ml-1 font-normal text-zinc-400">· optional</span>
                                </div>

                                <label
                                    htmlFor="dkim-upload"
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors",
                                        emailData
                                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                    )}
                                >
                                    {emailData ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <Upload className="w-4 h-4 text-zinc-400 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        {emailData ? (
                                            <>
                                                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                                    DKIM verified
                                                </div>
                                                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                                                    {emailData.signer}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                                                    Upload .eml file
                                                </div>
                                                <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                                    Binds an RSA-2048 DKIM signature to your commitment
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        id="dkim-upload"
                                        type="file"
                                        accept=".eml"
                                        onChange={onFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                                <Fingerprint className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    No identity found
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs">
                                    Initialise your enclave to generate a CSPRNG master secret and
                                    Pedersen commitment.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-0">
                    {!identity && (
                        <Button
                            id="btn-init-enclave"
                            onClick={onRegister}
                            disabled={!isWasmReady}
                            className="w-full"
                        >
                            <Fingerprint className="w-4 h-4" />
                            {isWasmReady ? "Initialise Enclave" : "Loading WASM…"}
                        </Button>
                    )}
                    {identity && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Your master secret exists only in browser memory. It is never transmitted.
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
