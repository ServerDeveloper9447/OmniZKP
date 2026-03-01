#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_completeness_valid_proof() {
        let nullifier = "4f9332ee97e5b48644cec6cef48dfdba761f1203c2485685b579cc4d66e73402";
        let valid_tee_sig = "0xvalid_hardware_signature_mock";
        // Distance 1200 (200m), Time 15s (Valid)
        let result = verify_proof_js(1200, 0, 1000, 15, nullifier, valid_tee_sig);
        assert!(result.contains("✅"), "Completeness Failed: Valid proof rejected.");
    }

    #[test]
    fn test_soundness_geofence_violation() {
        let nullifier = "4f9332ee97e5b48644cec6cef48dfdba761f1203c2485685b579cc4d66e73402";
        let valid_tee_sig = "0xvalid_hardware_signature_mock";
        // Distance 1800 (800m - INVALID bounds)
        let result = verify_proof_js(1800, 0, 1000, 10, nullifier, valid_tee_sig);
        assert!(result.contains("❌"), "Soundness Failed: Accepted out-of-bounds location.");
    }

    #[test]
    fn test_hardware_enclave_attestation() {
        let nullifier = "4f9332ee97e5b48644cec6cef48dfdba761f1203c2485685b579cc4d66e73402";
        let invalid_tee_sig = "UNVERIFIED";
        // Valid distance, but missing hardware signature
        let result = verify_proof_js(1200, 0, 1000, 10, nullifier, invalid_tee_sig);
        assert!(result.contains("❌ INVALID: Payload rejected"), "TEE Failed: Accepted unsigned payload.");
    }
}