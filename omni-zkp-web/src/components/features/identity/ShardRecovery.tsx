"use client";

import { useState } from "react";
import { Split, Copy, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, cn } from "../../ui/index";

interface ShardRecoveryProps {
    shards: string[];
}

const SHARD_ACCENT = [
    "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
    "border-l-blue-500   bg-blue-50   dark:bg-blue-950/30",
    "border-l-violet-500 bg-violet-50 dark:bg-violet-950/30",
];

const SHARD_LABEL = [
    "text-emerald-700 dark:text-emerald-300",
    "text-blue-700    dark:text-blue-300",
    "text-violet-700  dark:text-violet-300",
];

export function ShardRecovery({ shards }: ShardRecoveryProps) {
    const [copied, setCopied] = useState<number | null>(null);

    const handleCopy = async (shard: string, i: number) => {
        await navigator.clipboard.writeText(shard);
        setCopied(i);
        setTimeout(() => setCopied(null), 1800);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-zinc-400" />
                    <CardTitle>Recovery Shards</CardTitle>
                </div>
                <CardDescription>
                    Your master secret was split into <strong>{shards.length} Shamir shards</strong> over
                    GF(2⁸). Any <strong>2 of {shards.length}</strong> shards can reconstruct it.
                    Store each shard in a separate, secure location.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
                {shards.map((shard, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-start gap-3 rounded-md border border-l-[3px] border-zinc-200 dark:border-zinc-800 px-3 py-2.5",
                            SHARD_ACCENT[i % 3]
                        )}
                    >
                        <div className="shrink-0 pt-0.5">
                            <span className={cn("text-[10px] font-mono font-bold uppercase", SHARD_LABEL[i % 3])}>
                                S{i + 1}
                            </span>
                        </div>
                        <code className="flex-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 break-all leading-relaxed">
                            {shard}
                        </code>
                        <button
                            onClick={() => handleCopy(shard, i)}
                            className="shrink-0 p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title="Copy shard"
                        >
                            {copied === i
                                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                                : <Copy className="w-3.5 h-3.5" />
                            }
                        </button>
                    </div>
                ))}

                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono pt-1">
                    ⚠ Never store all shards in the same location. A single shard reveals nothing.
                </p>
            </CardContent>
        </Card>
    );
}
