"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Utility — zero external deps version of clsx + tailwind-merge
// ─────────────────────────────────────────────────────────────────────────────

type ClassValue = string | undefined | null | false | 0 | ClassValue[];

function clsx(...inputs: ClassValue[]): string {
    return inputs
        .flat(Infinity as 0)
        .filter(Boolean)
        .join(" ") as string;
}

/**
 * Minimal tailwind-merge: when two classes share the same utility prefix
 * (e.g. "px-2" vs "px-4"), keep only the last one.
 */
function twMerge(cls: string): string {
    const parts = cls.split(/\s+/).filter(Boolean);
    const seen = new Map<string, string>();
    for (const p of parts) {
        // prefix = everything before the last "-" followed by a value
        const key = p.replace(/-[^-]+$/, "");
        seen.set(key, p);
    }
    return Array.from(seen.values()).join(" ");
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(...inputs));
}


// ─────────────────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────────────────
import * as React from "react";

export type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "secondary";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonBase =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none whitespace-nowrap";

const buttonVariants: Record<ButtonVariant, string> = {
    default:
        "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
    outline:
        "border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-100",
    ghost:
        "bg-transparent hover:bg-zinc-100 text-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-300",
    destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    secondary:
        "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
};

const buttonSizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4",
    lg: "h-10 px-6 text-base",
    icon: "h-8 w-8 p-0",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "md", ...props }, ref) => (
        <button
            ref={ref}
            className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
            {...props}
        />
    )
);
Button.displayName = "Button";

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────
export type BadgeVariant = "default" | "success" | "warning" | "error" | "secondary" | "outline";

const badgeBase =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";

const badgeVariants: Record<BadgeVariant, string> = {
    default:
        "bg-zinc-900 text-zinc-100 ring-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-200",
    success:
        "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
    warning:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
    error:
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
    secondary:
        "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    outline:
        "bg-transparent text-zinc-600 ring-zinc-300 dark:text-zinc-400 dark:ring-zinc-600",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <span className={cn(badgeBase, badgeVariants[variant], className)} {...props} />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card family
// ─────────────────────────────────────────────────────────────────────────────
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("flex flex-col gap-1.5 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn("text-sm font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn("text-xs text-zinc-500 dark:text-zinc-400", className)} {...props} />
    );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Separator
// ─────────────────────────────────────────────────────────────────────────────
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical";
}
export function Separator({ className, orientation = "horizontal", ...props }: SeparatorProps) {
    return (
        <div
            role="separator"
            className={cn(
                "shrink-0 bg-zinc-200 dark:bg-zinc-800",
                orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                className
            )}
            {...props}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Slider (native range — no Radix needed for basic usage)
// ─────────────────────────────────────────────────────────────────────────────
interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    value: number;
    onValueChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className, ...props }: SliderProps) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className={cn("relative flex items-center w-full h-5", className)}>
            {/* Track */}
            <div className="absolute w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
                {/* Fill */}
                <div
                    className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onValueChange(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
                {...props}
            />
            {/* Thumb */}
            <div
                className="absolute w-4 h-4 rounded-full border-2 border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-900 shadow pointer-events-none transition-all"
                style={{ left: `calc(${pct}% - 8px)` }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScrollArea (simple overflow wrapper)
// ─────────────────────────────────────────────────────────────────────────────
interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    maxHeight?: string;
}
export function ScrollArea({ className, maxHeight = "100%", style, ...props }: ScrollAreaProps) {
    return (
        <div
            className={cn("overflow-y-auto", className)}
            style={{ maxHeight, ...style }}
            {...props}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label
// ─────────────────────────────────────────────────────────────────────────────
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={cn(
                "text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-none",
                className
            )}
            {...props}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => (
        <input
            ref={ref}
            className={cn(
                "flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100/20",
                className
            )}
            {...props}
        />
    )
);
Input.displayName = "Input";

// ─────────────────────────────────────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(
                "flex min-h-[72px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100/20",
                className
            )}
            {...props}
        />
    )
);
Textarea.displayName = "Textarea";
