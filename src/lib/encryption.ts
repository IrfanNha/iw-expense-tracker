/**
 * Encryption Utilities for Backup Files
 * Uses AES-256-GCM, PBKDF2, and HMAC-SHA256
 */

import { prisma } from "./prisma";

export interface BackupFile {
  version: string;
  timestamp: string;
  data: {
    accounts: any[];
    categories: any[];
    transactions: any[];
    transfers: any[];
  };
  signature: string;
}

/**
 * Derive encryption key from PIN using PBKDF2
 * key = PBKDF2(pin, userId + createdAt, 310000, 32, SHA-256)
 */
async function deriveKey(
  pin: string,
  userId: string
): Promise<CryptoKey> {
  // Get user's createdAt for salt
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Combine userId + createdAt as salt
  const saltData = `${userId}${user.createdAt.toISOString()}`;
  const saltBuffer = new TextEncoder().encode(saltData);

  // Import PIN as key material
  const pinKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 310000,
      hash: "SHA-256",
    },
    pinKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Generate HMAC key from encryption key
 */
async function deriveHMACKey(encryptionKey: CryptoKey): Promise<CryptoKey> {
  // Use a different derivation for HMAC
  const hmacKeyMaterial = await crypto.subtle.exportKey("raw", encryptionKey);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    hmacKeyMaterial,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  return hmacKey;
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptBackup(
  data: BackupFile["data"],
  pin: string,
  userId: string
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array; signature: string }> {
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM

  // Derive encryption key
  const encryptionKey = await deriveKey(pin, userId);

  // Serialize data
  const jsonData = JSON.stringify({
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    data,
  });

  const dataBuffer = new TextEncoder().encode(jsonData);

  // Encrypt using AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    encryptionKey,
    dataBuffer
  );

  // Generate HMAC signature
  const hmacKey = await deriveHMACKey(encryptionKey);
  const signatureBuffer = new Uint8Array([
    ...new Uint8Array(iv),
    ...new Uint8Array(encrypted),
  ]);
  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    signatureBuffer
  );

  // Convert signature to hex string
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    encrypted,
    iv,
    signature: signatureHex,
  };
}

/**
 * Decrypt backup file
 */
export async function decryptBackup(
  encryptedData: ArrayBuffer,
  iv: Uint8Array,
  signature: string,
  pin: string,
  userId: string
): Promise<BackupFile> {
  // Derive encryption key
  const encryptionKey = await deriveKey(pin, userId);

  // Verify HMAC signature
  const hmacKey = await deriveHMACKey(encryptionKey);
  const signatureBuffer = new Uint8Array([
    ...new Uint8Array(iv),
    ...new Uint8Array(encryptedData),
  ]);

  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    signatureBuffer
  );

  const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedSignatureHex !== signature) {
    throw new Error("Invalid signature: File may have been tampered with");
  }

  // Decrypt data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(iv),
      tagLength: 128,
    },
    encryptionKey,
    encryptedData
  );

  // Parse JSON
  const jsonString = new TextDecoder().decode(decrypted);
  const backupFile: BackupFile = JSON.parse(jsonString);

  return backupFile;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Uint8Array to base64
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  // Create a new ArrayBuffer to avoid SharedArrayBuffer issues
  const buffer = new ArrayBuffer(array.length);
  new Uint8Array(buffer).set(array);
  return arrayBufferToBase64(buffer);
}

/**
 * Convert base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64));
}

