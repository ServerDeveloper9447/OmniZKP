# Omni-ZKP: Hardware-Attested Zero-Knowledge Identity Enclave

Omni-ZKP is a client-side Zero-Knowledge proof (ZKP) generation engine compiled to WebAssembly (WASM). Designed for the FortyTwo Labs hackathon, it solves the "Garbage In, Garbage Out" problem of client-side ZK by strictly binding OS-level Trusted Execution Environment (TEE) hardware signatures to Halo2 cryptographic circuits natively in the browser.

## Website link: [https://omnizkp.vercel.app](https://omnizkp.vercel.app/)

## The Omni-ZKP Advantage
Standard client-side ZK implementations allow malicious users to feed spoofed data (fake GPS coordinates, manipulated timestamps) into the prover. 

Omni-ZKP introduces **Hardware-Attested Circuits**:
1. **Sensor Data Generation:** The user's device requests location and time.
2. **TEE Signing:** The OS Keychain (WebCrypto API) signs the raw sensor payload, proving it originated from physical hardware.
3. **WASM Enclave:** The Rust-based Halo2 circuit receives the payload and the signature. **The arithmetic gates strictly refuse to evaluate unless the TEE signature is cryptographically valid.**
4. **ZK Proof:** A valid proof is generated, asserting the user meets the verifier's policy (e.g., within 500m) without revealing their actual location.

## System Architecture
* **Frontend:** Next.js 15, React, TailwindCSS.
* **Proving Enclave:** Rust, `wasm-bindgen`, Halo2 (`halo2_proofs`), BN254 Elliptic Curve.
* **Cryptography:** Shamir's Secret Sharing (over $\text{GF}(2^8)$), AES-256-GCM, SHA-256 (Poseidon analog for nullifiers).
* **Anchoring:** Solidity (Polygon state-root anchor).

## Quick Start (Local Development)

### 1. Build the Rust WASM Enclave
```bash
cd omni-zkp-core
wasm-pack build --target web --out-dir ./pkg
```

### 2. Install dependencies
```bash
cd ../omni-zkp-web
npm install
```

### 3. Run integration tests
```bash
cd omni-zkp-core
cargo test
```

### 4. Run the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
npm run start
```