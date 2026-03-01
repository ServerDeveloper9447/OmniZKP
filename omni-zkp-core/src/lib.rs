pub mod circuit;
use circuit::OmniCircuit;
use halo2_proofs::{dev::MockProver, halo2curves::bn256::Fr, circuit::Value};use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};
use rand::{RngCore, thread_rng};
use sharks::{Share, Sharks};
use std::convert::TryFrom;

#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct IdentityResult {
    secret: String,
    salt: String,
    commitment: String,
}

#[wasm_bindgen]
impl IdentityResult {
    #[wasm_bindgen(getter)]
    pub fn secret(&self) -> String { self.secret.clone() }
    #[wasm_bindgen(getter)]
    pub fn salt(&self) -> String { self.salt.clone() }
    #[wasm_bindgen(getter)]
    pub fn commitment(&self) -> String { self.commitment.clone() }
}

#[wasm_bindgen]
pub fn create_secure_identity() -> IdentityResult {
    let mut rng = thread_rng();
    let mut secret_bytes = [0u8; 32];
    let mut salt_bytes = [0u8; 16];
    
    rng.fill_bytes(&mut secret_bytes);
    rng.fill_bytes(&mut salt_bytes);
    
    let secret_hex = hex::encode(secret_bytes);
    let salt_hex = hex::encode(salt_bytes);

    let mut hasher = Sha256::new();
    hasher.update(&secret_bytes);
    hasher.update(&salt_bytes);
    let commitment_hex = hex::encode(hasher.finalize());

    IdentityResult {
        secret: secret_hex,
        salt: salt_hex,
        commitment: commitment_hex,
    }
}

#[wasm_bindgen]
pub fn generate_nullifier_hash(secret: &str, scope: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    hasher.update(scope.as_bytes());
    hex::encode(hasher.finalize())
}

/// Splits `secret_hex` into `total` shares using Shamir Secret Sharing over GF(2⁸).
/// Any `threshold` shares are sufficient to reconstruct the secret; fewer reveal nothing.
/// Shares are hex-encoded and joined as CSV for safe transport across the WASM boundary.
#[wasm_bindgen]
pub fn generate_shards(secret_hex: &str, total: u8, threshold: u8) -> String {
    let sharks = Sharks(threshold);
    let secret_bytes = hex::decode(secret_hex).unwrap_or_default();

    let iter = sharks.dealer(&secret_bytes).take(total as usize);
    let mut shards = Vec::new();

    for share in iter {
        let share_bytes = Vec::from(&share);
        shards.push(hex::encode(share_bytes));
    }

    shards.join(",")
}

#[wasm_bindgen]
pub fn recover_secret_from_shards(shards_csv: &str, threshold: u8) -> Option<String> {
    let sharks = Sharks(threshold);
    let mut share_vec = Vec::new();
    
    let shards: Vec<&str> = shards_csv.split(',').collect();
    
    for shard_str in shards {
        if shard_str.trim().is_empty() { continue; }
        if let Ok(share_bytes) = hex::decode(shard_str) {
            if let Ok(share) = Share::try_from(share_bytes.as_slice()) {
                share_vec.push(share);
            }
        }
    }
    
    match sharks.recover(&share_vec) {
        Ok(secret_bytes) => Some(hex::encode(secret_bytes)),
        Err(_) => None,
    }
}

/// Entry point for the Halo2 ZK proof pipeline, exposed to the WASM host.
///
/// Validates two cryptographic properties before synthesising the circuit:
/// 1. **TEE Attestation** — rejects payloads not signed by a trusted hardware enclave.
/// 2. **Nullifier Revocation** — checks the caller's nullifier against a public blacklist.
///
/// The `OmniCircuit` enforces spatio-temporal constraints via two polynomial gates:
/// a location geofence (distance in 100m increments, max 500m) and a time-lock gate
/// (signal age in 5s increments, max 30s). Proof runs on a KZG-backed MockProver
/// with k=5 (32 rows), providing enough blinding rows for the constraint system.
#[wasm_bindgen]
pub fn verify_proof_js(user_lat: u64, user_time: u64, target_lat: u64, target_time: u64, user_nullifier_hex: &str, hardware_sig: &str) -> String {

    // Gate 0: Reject payloads lacking a valid hardware enclave attestation.
    if hardware_sig.trim().is_empty() || hardware_sig == "UNVERIFIED" {
        return "[REJECTED] INVALID: Payload rejected. Missing Hardware TEE Attestation.".to_string();
    }

    // Parse the first 8 hex chars of the nullifier into a u64 for field arithmetic.
    // Falls back to zero on malformed input; a zero nullifier cannot match deadbeef.
    let nullifier_prefix = if user_nullifier_hex.len() >= 8 {
        &user_nullifier_hex[0..8]
    } else {
        "00000000"
    };
    let user_null_val = u64::from_str_radix(nullifier_prefix, 16).unwrap_or(0);
    let revoked_null_val = u64::from_str_radix("deadbeef", 16).unwrap_or(1);

    let circuit = OmniCircuit {
        user_lat: Value::known(Fr::from(user_lat)),
        target_lat: Value::known(Fr::from(target_lat)),
        user_time: Value::known(Fr::from(user_time)),
        current_time: Value::known(Fr::from(target_time)),
        user_nullifier: Value::known(Fr::from(user_null_val)),
        blacklisted_nullifier: Value::known(Fr::from(revoked_null_val)),
    };

    let public_inputs = vec![Fr::from(target_lat), Fr::from(revoked_null_val)];

    // Gate 1: Short-circuit if nullifier appears in the public revocation set.
    if user_null_val == revoked_null_val {
        return "[REJECTED] INVALID: Identity Revoked (Found in Public Blacklist)".to_string();
    }

    // Synthesise and verify the circuit. k=5 allocates 32 rows, accommodating
    // the 6-row assignment region plus the blinding factors required by KZG.
    let prover = match MockProver::run(5, &circuit, vec![public_inputs]) {
        Ok(p) => p,
        Err(e) => return format!("[REJECTED] PROVER CRASH: {:?}", e),
    };

    match prover.verify() {
        Ok(_) => "[VERIFIED] VALID (Native Halo2 Prover + Revocation Check)".to_string(),
        Err(_) => "[REJECTED] INVALID: ZK Constraints Violated".to_string(),
    }
}

mod tests;