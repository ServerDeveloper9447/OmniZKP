declare module 'omni-zkp-core' {
  /**
   * Initialize the WASM module.
   */
  export default function init(): Promise<void>;

  /**
   * Verify the ZKP proof using the Rust engine.
   */
  export function verify_proof_js(
    user_lat: bigint,
    user_time: bigint,
    target_lat: bigint,
    target_time: bigint,
    user_nullifier_hex: string,
    hardware_sig: string
  ): string;
}