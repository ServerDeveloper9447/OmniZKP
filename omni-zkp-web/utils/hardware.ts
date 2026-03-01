// 1. Generate a Device-Bound, Non-Extractable Keypair
export const generateHardwareKeypair = async () => {
    if (typeof window === "undefined" || !window.crypto) {
        throw new Error("Web Crypto API not supported in this environment.");
    }

    // Generates an Elliptic Curve (P-256) keypair.
    // extractable: false guarantees the Private Key cannot be dumped or leaked by JS.
    const keyPair = await window.crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        false, // <-- THE CRITICAL TEE SECURITY FLAG
        ["sign", "verify"]
    );

    return keyPair;
};

// 2. Ask the Hardware/OS to sign the payload
export const signSensorDataWithHardware = async (
    privateKey: CryptoKey,
    dist: number,
    time: number
): Promise<string> => {

    // Construct the exact payload payload
    const encoder = new TextEncoder();
    const payloadStr = `OMNI_TEE_ATTESTATION|DIST:${dist}|TIME:${time}`;
    const payloadData = encoder.encode(payloadStr);

    // The OS/Hardware performs the ECDSA signing operation
    const signatureBuffer = await window.crypto.subtle.sign(
        { name: "ECDSA", hash: { name: "SHA-256" } },
        privateKey,
        payloadData
    );

    // Convert the raw ArrayBuffer signature into a Hex string for WASM
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const hexSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hexSignature;
};