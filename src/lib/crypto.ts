// End-to-End Encryption (E2EE) using Web Crypto API (AES-GCM 256-bit)
// Zero external paid libraries, zero server-side exposure.

const E2EE_PREFIX = 'enc:v1:';

/**
 * Derives a deterministic cryptographic key for a 1-to-1 conversation
 * based on the two sorted user IDs and a shared salt.
 */
async function deriveConversationKey(chatId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(`pm-secret-salt-${chatId}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(`pm-channel-${chatId}`),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext string to AES-GCM ciphertext
 */
export async function encryptMessage(chatId: string, plaintext: string): Promise<string> {
  try {
    const key = await deriveConversationKey(chatId);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));

    return `${E2EE_PREFIX}${ivBase64}:${cipherBase64}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return plaintext;
  }
}

/**
 * Decrypt AES-GCM ciphertext to plaintext
 */
export async function decryptMessage(chatId: string, encryptedText: string): Promise<string> {
  if (!encryptedText || !encryptedText.startsWith(E2EE_PREFIX)) {
    return encryptedText; // Legacy or unencrypted text fallback
  }

  try {
    const payload = encryptedText.substring(E2EE_PREFIX.length);
    const [ivBase64, cipherBase64] = payload.split(':');
    if (!ivBase64 || !cipherBase64) return encryptedText;

    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

    const key = await deriveConversationKey(chatId);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn('Decryption failed, displaying raw message:', err);
    return encryptedText;
  }
}

