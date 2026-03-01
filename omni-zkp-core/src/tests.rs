#[cfg(test)]
mod tests {
    use super::*;

    /// Completeness: a well-formed witness with valid TEE attestation, distance ≤500m,
    /// and signal age ≤30s must produce a [VERIFIED] result.
    #[test]
    fn test_completeness_valid_proof() {
        let nullifier = "4f9332ee97e5b48644cec6cef48dfdba761f1203c2485685b579cc4d66e73402";
        let valid_tee_sig = "0xvalid_hardware_signature_mock";
        // user_lat=1200 (Δ=200m), target_lat=1000, signal_age=15s — all within gate bounds.
        let result = verify_proof_js(1200, 0, 1000, 15, nullifier, valid_tee_sig);
        assert!(result.contains("[VERIFIED]"), "Completeness check failed: valid proof was rejected.");
    }

    /// Soundness: a witness that violates the geofence constraint (Δ=800m > 500m limit)
    /// must be rejected even when TEE attestation is valid.
    #[test]
    fn test_soundness_geofence_violation() {
        let nullifier = "4f9332ee97e5b48644cec6cef48dfdba761f1203c2485685b579cc4d66e73402";
        let valid_tee_sig = "0xvalid_hardware_signature_mock";
        // user_lat=1800 (Δ=800m) exceeds maximum geofence distance of 500m.
        let result = verify_proof_js(1800, 0, 1000, 10, nullifier, valid_tee_sig);
        assert!(result.contains("[REJECTED]"), "Soundness check failed: out-of-bounds location was accepted.");
    }

    /// TEE Attestation: any payload lacking a valid hardware signature must be rejected
    /// before the circuit is synthesised, regardless of spatial validity.
    #[test]
    fn test_hardware_enclave_attestation() {
        let nullifier = "4f9332ee97e5b48644cec6cef48dfdba761f1203c2485685b579cc4d66e73402";
        let invalid_tee_sig = "UNVERIFIED";
        // Location is valid, but the missing TEE signature must cause an early rejection.
        let result = verify_proof_js(1200, 0, 1000, 10, nullifier, invalid_tee_sig);
        assert!(result.contains("[REJECTED] INVALID: Payload rejected"), "TEE check failed: unsigned payload was accepted.");
    }
}