use halo2_proofs::{
    plonk::{keygen_pk, keygen_vk},
    poly::kzg::commitment::ParamsKZG,
    SerdeFormat,
    halo2curves::bn256::{Bn256},
};
use omni_zkp_core::circuit::OmniCircuit; 
use rand::rngs::OsRng;
use std::fs::File;

fn main() {
    println!("🔑 Starting Production Key Generation...");

    // 1. SETUP: Initialize KZG
    let k = 5; 
    println!("   -> Generating SRS Params (k={})...", k);
    let params = ParamsKZG::<Bn256>::setup(k, OsRng);

    // 2. BUILD EMPTY CIRCUIT
    let circuit = OmniCircuit::default();

    // 3. GENERATE VERIFICATION KEY (VK)
    println!("   -> Generating Verification Key (VK)...");
    let vk = keygen_vk(&params, &circuit).expect("Failed to generate VK");
    
    let mut vk_file = File::create("omni_verifier.vk").expect("Failed to create VK file");
    vk.write(&mut vk_file, SerdeFormat::RawBytes).expect("Failed to write VK");
    println!("      💾 Saved: omni_verifier.vk");

    // 4. GENERATE PROVING KEY (PK)
    println!("   -> Generating Proving Key (PK)...");
    let pk = keygen_pk(&params, vk, &circuit).expect("Failed to generate PK");

    let mut pk_file = File::create("omni_prover.pk").expect("Failed to create PK file");
    pk.write(&mut pk_file, SerdeFormat::RawBytes).expect("Failed to write PK");
    println!("      💾 Saved: omni_prover.pk");

    println!("✅ ARTIFACTS GENERATED SUCCESSFULLY!");
}