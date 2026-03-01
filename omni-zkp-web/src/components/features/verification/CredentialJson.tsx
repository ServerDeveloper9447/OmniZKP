"use client";

import { useState } from "react";
import { CheckCircle, Copy, Check, FileJson } from "lucide-react";
import { cn } from "../../ui/index";

interface CredentialJsonProps {
    credential: any;
}

function highlight(json: string): string {
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            if (/^"/.test(match) && /:$/.test(match)) return `<span class="tok-key">${match}</span>`;
            if (/^"/.test(match)) return `<span class="tok-str">${match}</span>`;
            if (/true|false/.test(match)) return `<span class="tok-bool">${match}</span>`;
            if (/null/.test(match)) return `<span class="tok-bool">${match}</span>`;
            return `<span class="tok-num">${match}</span>`;
        }
    );
}

export function CredentialJson({ credential }: CredentialJsonProps) {
    const [copied, setCopied] = useState(false);
    const raw = JSON.stringify(credential, null, 2);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(raw);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-3">
            {/* Success banner */}
            <div className="flex items-start gap-3 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                        W3C Verifiable Credential issued
                    </p>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Halo2 SNARK · {credential.credentialSubject.verifierScope} · unlinkable nullifier
                    </p>
                </div>
            </div>

            {/* JSON block */}
            <div className="rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {/* toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                    <FileJson className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="flex-1 text-[11px] font-mono text-zinc-400">credential.json</span>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                        {copied
                            ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                            : <><Copy className="w-3 h-3" /> Copy</>
                        }
                    </button>
                </div>

                {/* body */}
                <div className="max-h-72 overflow-y-auto px-4 py-3 bg-white dark:bg-zinc-950">
                    <pre
                        className="json-block"
                        dangerouslySetInnerHTML={{ __html: highlight(raw) }}
                    />
                </div>
            </div>

            {/* Unlinkability note */}
            <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed px-0.5">
                The nullifier above is{" "}
                <span className="text-zinc-600 dark:text-zinc-300">cryptographically scoped</span> to{" "}
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                    {credential.credentialSubject.verifierScope}
                </span>
                . No verifier can link it to proofs submitted to other verifiers.
            </p>
        </div>
    );
}
