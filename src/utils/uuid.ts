/**
 * ZenChat — UUID Generation Utility
 *
 * Generates UUID v4 identifiers without external dependencies.
 * Works completely offline.
 */

/**
 * Generate a RFC4122 v4 UUID using crypto.getRandomValues when available,
 * falling back to Math.random for environments without crypto.
 */
export function generateUUID(): string {
  // Use crypto.getRandomValues if available (React Native/modern JS)
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);

    // Set version 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant 10xx
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }

  // Fallback for environments without crypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short display-friendly ID suffix.
 * Example: "A91F"
 */
export function shortId(uuid: string): string {
  return uuid.slice(-4).toUpperCase();
}
