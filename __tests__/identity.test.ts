import { identityService, IdentityService } from '../src/identity/identityService';

describe('Identity & QR System', () => {
  beforeEach(() => {
    identityService.resetIdentity();
  });

  test('creates a valid local identity with display name', () => {
    const identity = identityService.createIdentity('Zenith');
    expect(identity).toBeDefined();
    expect(identity.displayName).toBe('Zenith');
    expect(identity.userId).toBeDefined();
    expect(identity.userId.length).toBeGreaterThan(10);
    expect(identity.protocolVersion).toBe(1);
    expect(identityService.hasIdentity()).toBe(true);
  });

  test('updates display name while preserving user ID', () => {
    const original = identityService.createIdentity('Zenith');
    const updated = identityService.updateDisplayName('Zenith Master');
    expect(updated).not.toBeNull();
    expect(updated?.displayName).toBe('Zenith Master');
    expect(updated?.userId).toBe(original.userId);
  });

  test('encodes and decodes valid QR identity payload', () => {
    identityService.createIdentity('Alex');
    const qrString = identityService.encodeQRString();
    expect(qrString).not.toBeNull();

    const parsed = IdentityService.parseQRString(qrString!);
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('USER_IDENTITY');
    expect(parsed?.displayName).toBe('Alex');
    expect(parsed?.version).toBe(1);
  });

  test('rejects malformed or invalid QR payloads', () => {
    expect(IdentityService.parseQRString('not-json')).toBeNull();
    expect(IdentityService.parseQRString('{}')).toBeNull();
    expect(IdentityService.parseQRString(JSON.stringify({ type: 'WRONG_TYPE' }))).toBeNull();
    expect(IdentityService.parseQRString(JSON.stringify({ type: 'USER_IDENTITY', displayName: '' }))).toBeNull();
  });
});
