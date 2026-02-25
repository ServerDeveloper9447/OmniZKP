mod circuit;
mod utils;

use halo2_proofs::{
    dev::MockProver,
    circuit::Value,
};
use halo2curves::bn256::Fr;
use circuit::OmniCircuit;

fn main() {
    println!("🚀 Starting Omni-ZKP Circuit Test...");

    // ============================================
    // 1. SETUP: DEFINE THE REAL-WORLD SCENARIO
    // ============================================

    // --- Scenario A: Location Check (Rule: Must be within 500m) ---
    // User is at coordinate 1000. Target is 1000. Diff = 0. (PASS)
    let user_lat = Fr::from(1000);
    let target_lat = Fr::from(1000); 

    // --- Scenario B: Time Check (Rule: Must be < 30s old) ---
    // User timestamp: 5000. Current Oracle time: 5000. Diff = 0. (PASS)
    let user_time = Fr::from(5000); 
    let current_time = Fr::from(5000);

    // --- Scenario C: DKIM Check (Rule: Must match Google or Uni) ---
    // 12345 is the hash for "@google.com" hardcoded in circuit.rs (PASS)
    let google_hash = Fr::from(12345); 

    // ============================================
    // 2. BUILD THE CIRCUIT (WITNESS GENERATION)
    // ============================================
    // We populate the private "Advice" columns with user secrets.
    let circuit = OmniCircuit {
        user_lat: Value::known(user_lat),
        user_long: Value::known(Fr::from(0)), // Unused in this simple test
        user_time: Value::known(user_time),
        secret: Value::known(Fr::from(999)),  // User's Secret Key
        salt: Value::known(Fr::from(888)),    // User's Random Salt
        email_domain_hash: Value::known(google_hash), 

        // These are effectively unused in the struct but required by definition
        target_lat: Value::known(target_lat),
        target_long: Value::known(Fr::from(0)),
        current_time: Value::known(current_time),
    };

    // ============================================
    // 3. DEFINE PUBLIC INPUTS (INSTANCE COLUMN)
    // ============================================
    // The Verifier (Bank/Judge) sees ONLY these values.
    // Row 0: Target Location (1000)
    // Row 1: Current Time (5000)
    // Row 2: Empty (DKIM check uses fixed constants in the gate)
    let public_inputs = vec![
        target_lat,   // Row 0 matches 'location_check'
        current_time, // Row 1 matches 'time_check'
        Fr::zero(),   // Row 2 (DKIM) has no public input
    ];

    // ============================================
    // 4. RUN THE MOCK PROVER
    // ============================================
    let k = 4; // Circuit size (2^4 rows)
    
    // Note: MockProver expects a vector of columns. We have 1 Instance column.
    let prover = MockProver::run(k, &circuit, vec![public_inputs]).unwrap();

    println!("🔎 Verifying Constraints...");
    match prover.verify() {
        Ok(_) => {
            println!("✅ SUCCESS: User is Valid!");
            println!("   - Location: Within Range");
            println!("   - Time: Fresh");
            println!("   - Email: Verified Google Employee");
        },
        Err(e) => {
            println!("❌ FAILURE: Constraints violated!");
            println!("   - Error Details: {:?}", e);
        }
    }
}