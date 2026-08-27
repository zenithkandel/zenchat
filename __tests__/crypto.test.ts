import { cryptoService, sha256, toHex } from '../src/crypto/cryptoService';

describe('Cryptographic Identity & Hash Engine', () => {
  test('computes deterministic SHA-256 hash', () => {
    const hash1 = sha256('ZenChat-offline-p2p');
    const hash2 = sha256('ZenChat-offline-p2p');
    expect(toHex(hash1)).toBe(toHex(hash2));
    expect(toHex(hash1).length).toBe(64);
  });

  test('generates unique cryptographic keypairs', async () => {
    const kp1 = await cryptoService.generateIdentity();
    const kp2 = await cryptoService.generateIdentity();

    expect(kp1.publicKey).toBeDefined();
    expect(kp1.privateKey).toBeDefined();
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
  });

  test('signs and verifies payload signatures', async () => {
    const keyPair = await cryptoService.generateIdentity();
    const message = 'Authenticated offline message';

    const signature = await cryptoService.sign(message, keyPair.privateKey);
    expect(signature).toBeDefined();
    expect(signature.length).toBe(64);

    const isValid = await cryptoService.verify(message, signature, keyPair.publicKey);
    expect(isValid).toBe(true);
  });
});
