// @ts-ignore
import { 
  create_secure_identity, 
  generate_nullifier_hash,
  generate_shards,
  recover_secret_from_shards
} from "omni-zkp-core";

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

export const generateNullifier = (secret: string, scope: string) => generate_nullifier_hash(secret, scope);

export const createShards = (secret: string, total: number, threshold: number): string[] => {
  try {
    // Calls the Rust WASM array bridging directly
    const shardsArray = generate_shards(secret, total, threshold);
    return Array.from(shardsArray);
  } catch (e) {
    console.error("WASM Sharding Error:", e);
    return [];
  }
};

export const recoverSecret = (shards: string[]): string | null => {
  try {
    const validShards = shards.filter(s => s && s.trim().length > 0);
    if (validShards.length < 2) return null;
    
    // Pass back to Rust for Lagrange interpolation
    return recover_secret_from_shards(validShards, 2) || null;
  } catch (e) {
    console.error("WASM Recovery Error:", e);
    return null;
  }
};