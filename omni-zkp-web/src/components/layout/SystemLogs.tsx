"use client";

import { useRef, useEffect } from "react";
import { Terminal } from "lucide-react";
import { cn } from "../ui/index";
import type { LogEntry } from "../../lib/types";

interface SystemLogsProps {
    logs: LogEntry[];
    isWasmReady: boolean;
}

const LEVEL_META: Record<LogEntry["level"], { tag: string; cls: string }> = {
    info: { tag: "INFO", cls: "log-info" },
    success: { tag: "OK", cls: "log-success" },
    error: { tag: "ERR", cls: "log-error" },
    warn: { tag: "WARN", cls: "log-warn" },
    wasm: { tag: "WASM", cls: "log-wasm" },
};

export function SystemLogs({ logs, isWasmReady }: SystemLogsProps) {
    const topRef = useRef<HTMLDivElement>(null);

    // newest entries scroll into view (they're prepended)
    useEffect(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs.length]);

    return (
        <aside className="w-72 xl:w-80 shrink-0 flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 flex-1">
                    System Logs
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isWasmReady ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                    )} />
                    <span className="text-[10px] font-mono text-zinc-400">
                        {logs.length}
                    </span>
                </div>
            </div>

            {/* Log stream */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                <div ref={topRef} />

                {logs.length === 0 && (
                    <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 text-center pt-8">
                        No events yet.
                    </p>
                )}

                <div className="space-y-1">
                    {logs.map((log) => {
                        const meta = LEVEL_META[log.level];
                        return (
                            <div key={log.id} className="flex gap-2 text-[11px] leading-5">
                                {/* timestamp */}
                                <span className="shrink-0 font-mono text-zinc-400 dark:text-zinc-600 tabular-nums w-14">
                                    {log.timestamp}
                                </span>
                                {/* level tag */}
                                <span className={cn("shrink-0 font-mono font-semibold w-10", meta.cls)}>
                                    {meta.tag}
                                </span>
                                {/* message */}
                                <span className={cn("font-mono break-all", meta.cls)}>
                                    {log.message}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400">WASM Enclave</span>
                <span className={cn(
                    "text-[10px] font-mono font-semibold",
                    isWasmReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
                )}>
                    {isWasmReady ? "ONLINE" : "INIT"}
                </span>
            </div>
        </aside>
    );
}
