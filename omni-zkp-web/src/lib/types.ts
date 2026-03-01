// ─────────────────────────────────────────────────────────────────────────────
// Core domain types
// ─────────────────────────────────────────────────────────────────────────────

export interface Identity {
    masterSecret: string;
    salt: string;
    commitment: string;
}

export type LogLevel = "info" | "success" | "error" | "warn" | "wasm";

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    message: string;
}

export type ActiveView =
    | "identity"
    | "chase"
    | "acko"
    | "zomato"
    | "recovery";

// ─────────────────────────────────────────────────────────────────────────────
// Verifier profiles (single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifierProfile {
    id: string;
    scope: string;
    name: string;
    description: string;
    icon: string; // lucide icon name
    requirements: string[];
    proofSteps: string[];
    maxDistM: number;   // 999999 = no constraint
    maxSignalS: number; // 999999 = no constraint
    requiresDkim: boolean;
}

export const VERIFIERS: Record<string, VerifierProfile> = {
    chase: {
        id: "chase",
        scope: "CHASE_BANK",
        name: "Chase Bank",
        description: "Identity verification for onboarding",
        icon: "Building2",
        requirements: [
            "Valid ZK identity proof",
            "Location within 500 m of branch",
            "Signal freshness < 30 s",
        ],
        proofSteps: [
            "Deriving scoped nullifier",
            "Loading constraint system",
            "Running Halo2 polynomial constraints",
            "Executing KZG inner-product argument",
            "Verifying location range proof",
            "Formatting W3C credential",
        ],
        maxDistM: 500,
        maxSignalS: 30,
        requiresDkim: false,
    },
    acko: {
        id: "acko",
        scope: "ACKO_INSURANCE",
        name: "Acko Insurance",
        description: "DKIM-attested identity for policy issuance",
        icon: "ShieldCheck",
        requirements: [
            "Valid ZK identity proof",
            "DKIM-signed email attestation",
            "Verifier-scoped nullifier (unlinkable)",
        ],
        proofSteps: [
            "Deriving scoped nullifier",
            "Parsing DKIM attestation header",
            "Loading constraint system",
            "Running Halo2 polynomial constraints",
            "Executing KZG inner-product argument",
            "Formatting W3C credential",
        ],
        maxDistM: 999999,
        maxSignalS: 999999,
        requiresDkim: true,
    },
    zomato: {
        id: "zomato",
        scope: "ZOMATO_APP",
        name: "Zomato Delivery",
        description: "Real-time proximity proof for delivery confirmation",
        icon: "Bike",
        requirements: [
            "Location within 200 m of delivery point",
            "Signal freshness < 15 s",
            "Humanity proof (bot exclusion)",
        ],
        proofSteps: [
            "Deriving scoped nullifier",
            "Sampling oracle signal",
            "Loading constraint system",
            "Running Halo2 polynomial constraints",
            "Verifying geofence range proof",
            "Formatting W3C credential",
        ],
        maxDistM: 200,
        maxSignalS: 15,
        requiresDkim: false,
    },
};

export const NAV_ITEMS: { id: ActiveView; label: string; icon: string; group?: string }[] = [
    { id: "identity", label: "Identity Wallet", icon: "Fingerprint" },
    { id: "chase", label: "Chase Bank", icon: "Building2", group: "Verifiers" },
    { id: "acko", label: "Acko Insurance", icon: "ShieldCheck", group: "Verifiers" },
    { id: "zomato", label: "Zomato Delivery", icon: "Bike", group: "Verifiers" },
    { id: "recovery", label: "Recovery", icon: "Key", group: "Emergency" },
];
