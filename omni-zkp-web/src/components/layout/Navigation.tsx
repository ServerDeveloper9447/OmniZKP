"use client";

import {
    Fingerprint, Building2, ShieldCheck, Bike, Key,
    Circle, ChevronRight, FlaskConical,
} from "lucide-react";
import { cn } from "../ui/index";
import type { ActiveView } from "../../lib/types";
import { NAV_ITEMS } from "../../lib/types";

const ICON_MAP: Record<string, React.ElementType> = {
    Fingerprint, Building2, ShieldCheck, Bike, Key,
};

interface NavigationProps {
    activeView: ActiveView;
    setView: (v: ActiveView) => void;
    isWasmReady: boolean;
    onRunTests?: () => void;
}

export function Navigation({ activeView, setView, isWasmReady, onRunTests }: NavigationProps) {
    // group items
    const groups: { label: string | null; items: typeof NAV_ITEMS }[] = [];
    let lastGroup: string | null | undefined = undefined;

    for (const item of NAV_ITEMS) {
        const g = item.group ?? null;
        if (g !== lastGroup) {
            groups.push({ label: g, items: [item] });
            lastGroup = g;
        } else {
            groups[groups.length - 1].items.push(item);
        }
    }

    return (
        <aside className="w-52 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
            {/* Logo / wordmark */}
            <div className="px-4 py-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center">
                        <span className="text-white dark:text-zinc-900 text-[10px] font-bold tracking-tight">ZK</span>
                    </div>
                    <span className="text-sm font-semibold tracking-tight">Omni-ZKP</span>
                </div>
                {/* WASM status */}
                <div className="flex items-center gap-1.5 mt-3">
                    <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isWasmReady ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
                    )} />
                    <span className={cn(
                        "text-[10px] font-mono",
                        isWasmReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                        {isWasmReady ? "Enclave ready" : "Loading WASM…"}
                    </span>
                </div>
            </div>

            {/* Navigation groups */}
            <nav className="flex-1 px-2 py-3 space-y-4">
                {groups.map((group) => (
                    <div key={group.label ?? "root"}>
                        {group.label && (
                            <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                {group.label}
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = ICON_MAP[item.icon] ?? Circle;
                                const isActive = activeView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        id={`nav-${item.id}`}
                                        onClick={() => setView(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left",
                                            isActive
                                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-medium"
                                                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {isActive && (
                                            <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* E2E Test Runner */}
            <div className="px-3 pb-3">
                <button
                    id="btn-run-e2e-tests"
                    onClick={onRunTests}
                    disabled={!isWasmReady || !onRunTests}
                    className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-mono font-semibold transition-colors border",
                        isWasmReady && onRunTests
                            ? "border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/60"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                    )}
                >
                    <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                    <span>Run E2E Tests</span>
                    {isWasmReady && (
                        <span className="ml-auto text-[9px] font-bold tracking-widest uppercase opacity-60">4 tests</span>
                    )}
                </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed">
                    Halo2 · KZG · Shamir SSS
                </p>
            </div>
        </aside>
    );
}
