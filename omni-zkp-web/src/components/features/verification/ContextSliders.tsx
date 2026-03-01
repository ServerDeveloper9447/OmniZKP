"use client";

import { MapPin, Clock } from "lucide-react";
import { Slider, Label, cn } from "../../ui/index";

interface ContextSlidersProps {
    distM: number;
    signalS: number;
    onDistChange: (v: number) => void;
    onSignalChange: (v: number) => void;
    maxDistM: number;
    maxSignalS: number;
}

function ConstraintBadge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ring-1 ring-inset",
            ok
                ? "text-emerald-700 dark:text-emerald-300 ring-emerald-300 dark:ring-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                : "text-red-700 dark:text-red-300 ring-red-300 dark:ring-red-700 bg-red-50 dark:bg-red-950/40"
        )}>
            {ok ? `≤ ${label} ✓` : `> ${label} ✗`}
        </span>
    );
}

export function ContextSliders({
    distM, signalS, onDistChange, onSignalChange, maxDistM, maxSignalS,
}: ContextSlidersProps) {
    const distOk = distM <= maxDistM;
    const signalOk = signalS <= maxSignalS;
    const hasDistConstraint = maxDistM < 999999;
    const hasSignalConstraint = maxSignalS < 999999;

    return (
        <div className="space-y-5">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Oracle Context
                <span className="ml-1.5 font-normal normal-case text-zinc-400 dark:text-zinc-500">
                    — simulated private witnesses
                </span>
            </div>

            {/* Distance */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        Distance from target
                    </Label>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-mono text-xs font-semibold tabular-nums",
                            distOk ? "text-zinc-900 dark:text-zinc-50" : "text-red-600 dark:text-red-400"
                        )}>
                            {distM} m
                        </span>
                        {hasDistConstraint && (
                            <ConstraintBadge ok={distOk} label={`${maxDistM} m`} />
                        )}
                    </div>
                </div>
                <Slider
                    id="slider-distance"
                    value={distM}
                    min={0}
                    max={1000}
                    step={10}
                    onValueChange={onDistChange}
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                    <span>0 m</span>
                    {hasDistConstraint && (
                        <span className="text-zinc-500">Geofence: {maxDistM} m</span>
                    )}
                    <span>1 000 m</span>
                </div>
            </div>

            {/* Signal age */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        Signal age
                    </Label>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-mono text-xs font-semibold tabular-nums",
                            signalOk ? "text-zinc-900 dark:text-zinc-50" : "text-red-600 dark:text-red-400"
                        )}>
                            {signalS} s
                        </span>
                        {hasSignalConstraint && (
                            <ConstraintBadge ok={signalOk} label={`${maxSignalS} s`} />
                        )}
                    </div>
                </div>
                <Slider
                    id="slider-signal"
                    value={signalS}
                    min={0}
                    max={60}
                    step={1}
                    onValueChange={onSignalChange}
                />
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                    <span>0 s</span>
                    {hasSignalConstraint && (
                        <span className="text-zinc-500">Time-lock: {maxSignalS} s</span>
                    )}
                    <span>60 s</span>
                </div>
            </div>

            <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 leading-relaxed">
                These values are fed to the Halo2 circuit as{" "}
                <span className="text-zinc-600 dark:text-zinc-300">private witnesses</span>.
                The proof asserts their validity without revealing them.
            </p>
        </div>
    );
}
