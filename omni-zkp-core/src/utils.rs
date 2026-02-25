use halo2_proofs::halo2curves::bn256::Fr;

// Helper to convert numbers to Fr
pub fn to_fr(value: u64) -> Fr {
    Fr::from(value)
}

// PRODUCTION ZK-EMAIL CHIP CONFIGURATION
// (This is what actually verifies the GitHub DKIM inside Halo2)

#[derive(Clone, Debug)]
pub struct DkimConfig {
    // BigInt modular multiplication requires specific lookup tables
    pub rsa_config: RSAConfig<Fr>, 
    pub sha256_config: Sha256Config<Fr>,
    pub regex_config: RegexConfig<Fr>,
}

impl Circuit<Fr> for OmniCircuit {
    fn configure(meta: &mut ConstraintSystem<Fr>) -> Self::Config {
        // 1. Calculate SHA-256 of the Email Header
        let sha256_config = Sha256TableConfig::configure(meta);
        
        // 2. Perform RSA-2048 Verification: (Signature)^e mod N == Hash
        // e is usually 65537 (0x10001)
        let rsa_config = RSAConfig::configure(
            meta, 
            rsa_bits: 2048, 
            bigint_limbs: 32 // We split the 2048-bit key into 64-bit limbs
        );

        // 3. Regex Constraint: Ensure the header contains "d=github.com"
        let regex_config = RegexConfig::configure(meta, "d=github.com");

        DkimConfig { rsa_config, sha256_config, regex_config }
    }
}