// 1. Derive an AES-256-GCM key from a Custom Human Input (PIN/Password)
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();

    // Explicitly assert BufferSource to resolve the Node vs DOM type clash
    const pinBuffer = enc.encode(pin) as BufferSource;
    const saltBuffer = salt as BufferSource;

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", pinBuffer, { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: saltBuffer, iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

// 2. Encrypt a raw Shamir Shard using the Cognitive Input
export async function encryptShard(shard: string, pin: string): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pin, salt);

    const enc = new TextEncoder();
    const dataBuffer = enc.encode(shard) as BufferSource;
    const ivBuffer = iv as BufferSource;

    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: ivBuffer }, key, dataBuffer
    );

    // Combine salt + iv + ciphertext into a single hex string for storage
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 3. Decrypt the blob back into a raw Shard
export async function decryptShard(encryptedHex: string, pin: string): Promise<string | null> {
    try {
        const bytes = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        const salt = bytes.slice(0, 16);
        const iv = bytes.slice(16, 28);
        const data = bytes.slice(28);

        const key = await deriveKey(pin, salt);
        const ivBuffer = iv as BufferSource;
        const dataBuffer = data as BufferSource;

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer }, key, dataBuffer
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        return null; // Decryption failed (wrong PIN)
    }
}

// 4. Simulate a Decentralized Guardian Network
export async function pingGuardianNetwork(guardianId: number, encryptedShard: string): Promise<string> {
    // Simulating network latency to IPFS or a Guardian Node
    const latency = 800 + Math.random() * 1200;
    await new Promise(r => setTimeout(r, latency));
    return encryptedShard;
}