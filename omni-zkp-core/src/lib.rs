use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};
use rand::{RngCore, thread_rng};
use sharks::{Share, Sharks};
use std::convert::TryFrom;

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

// ---------------------------------------------------------
// PRODUCTION SHAMIR'S SECRET SHARING (GALOIS FIELD 256)
// ---------------------------------------------------------

#[wasm_bindgen]
pub fn generate_shards(secret_hex: &str, total: u8, threshold: u8) -> js_sys::Array {
    let sharks = Sharks(threshold);
    let secret_bytes = hex::decode(secret_hex).expect("Invalid Hex");
    
    // Generate mathematical polynomial shares
    let iter = sharks.dealer(&secret_bytes).take(total as usize);
    let result = js_sys::Array::new();
    
    for share in iter {
        let share_bytes = Vec::from(&share);
        let share_hex = hex::encode(share_bytes);
        result.push(&JsValue::from_str(&share_hex));
    }
    result
}

#[wasm_bindgen]
pub fn recover_secret_from_shards(shards: js_sys::Array, threshold: u8) -> Option<String> {
    let sharks = Sharks(threshold);
    let mut share_vec = Vec::new();
    
    // Extract and parse shares from WebAssembly boundary
    for i in 0..shards.length() {
        if let Some(shard_str) = shards.get(i).as_string() {
            if let Ok(share_bytes) = hex::decode(&shard_str) {
                if let Ok(share) = Share::try_from(share_bytes.as_slice()) {
                    share_vec.push(share);
                }
            }
        }
    }
    
    // Attempt mathematical Lagrange interpolation to recover secret
    match sharks.recover(&share_vec) {
        Ok(secret_bytes) => Some(hex::encode(secret_bytes)),
        Err(_) => None,
    }
}