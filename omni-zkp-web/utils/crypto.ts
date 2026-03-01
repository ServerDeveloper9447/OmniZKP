// @ts-nocheck
import {
    create_secure_identity,
    generate_nullifier_hash,
    generate_shards,
    recover_secret_from_shards
} from "omni-zkp-core";

/**
 * Generates a fresh cryptographic identity via CSPRNG.
 * Returns a 256-bit master secret, a 128-bit random salt, and a
 * SHA-256 Pedersen-style commitment over (secret ‖ salt).
 */
export const generateIdentity = () => {
    try {
        const id = create_secure_identity();
        if (!id) return null;
        return {
            masterSecret: id.secret,
            salt: id.salt,
            commitment: id.commitment
        };
    } catch (e) {
        console.error("WASM Error:", e);
        return null;
    }
};

/**
 * Derives a scope-bound nullifier as SHA-256(secret ‖ scope).
 * The nullifier is unlinkable across different scopes, satisfying
 * the selective-disclosure requirement of the W3C VC data model.
 */
export const generateNullifier = (secret: string, scope: string) => {
    try { return generate_nullifier_hash(secret, scope); }
    catch (e) { return ""; }
};

/**
 * Splits `secret` into `total` hex-encoded Shamir shares over GF(2⁸).
 * Any `threshold` shares reconstruct the secret; strictly fewer reveal nothing.
 * Shares are returned as an array; the WASM layer transports them as CSV.
 */
export const createShards = (secret: string, total: number, threshold: number): string[] => {
    try {
        const csv = generate_shards(secret, total, threshold);
        return csv.split(",");
    } catch (e) {
        console.error("WASM Sharding Error:", e);
        return [];
    }
};

/**
 * Reconstructs the master secret from an array of hex-encoded Shamir shares
 * via Lagrange interpolation over GF(2⁸). Requires at least 2 valid shares;
 * returns null if reconstruction fails or insufficient shares are provided.
 */
export const recoverSecret = (shards: string[]): string | null => {
    try {
        const validShards = shards.filter(s => s && s.trim().length > 0);
        if (validShards.length < 2) return null;

        const csv = validShards.join(",");
        const recovered = recover_secret_from_shards(csv, 2);
        return recovered || null;
    } catch (e) {
        console.error("WASM Recovery Error:", e);
        return null;
    }
};