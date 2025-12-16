// Cryptographic utilities for I-AM-SYSTEMS
// Uses Web Crypto API for key generation and signing

export function generateId(): string {
  return crypto.randomUUID();
}

export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
  address: string;
}> {
  // Generate ECDSA key pair using secp256k1-like curve (P-256 for Web Crypto compatibility)
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const publicKey = bufferToHex(publicKeyBuffer);
  const privateKey = bufferToHex(privateKeyBuffer);
  
  // Generate Ethereum-like address from public key
  const address = await generateAddressFromPublicKey(publicKeyBuffer);

  return { publicKey, privateKey, address };
}

export async function generateAddressFromPublicKey(publicKeyBuffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", publicKeyBuffer);
  const hashHex = bufferToHex(hash);
  // Take last 40 characters (20 bytes) for Ethereum-like address
  return "0x" + hashHex.slice(-40);
}

export function generateFingerprint(publicKey: string): string {
  // Generate a short fingerprint for display
  const hash = publicKey.slice(2, 18);
  return hash.match(/.{1,4}/g)?.join(":").toUpperCase() || publicKey.slice(0, 16);
}

export async function computeCID(data: unknown): Promise<string> {
  const jsonString = JSON.stringify(data, Object.keys(data as object).sort());
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonString);
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return "baf" + bufferToHex(hash).slice(0, 56);
}

export async function signData(
  data: unknown,
  privateKeyHex: string
): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const buffer = encoder.encode(jsonString);
  
  // For now, return a mock signature (real implementation would use the private key)
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return "0x" + bufferToHex(hash);
}

export async function encryptPrivateKey(
  privateKey: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(privateKey)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return bufferToHex(combined);
}

export async function decryptPrivateKey(
  encryptedData: string,
  password: string
): Promise<string> {
  const data = hexToBuffer(encryptedData);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(bytes.map((b) => parseInt(b, 16)));
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatCID(cid: string, chars = 8): string {
  if (!cid) return "";
  return `${cid.slice(0, chars)}...${cid.slice(-chars)}`;
}
