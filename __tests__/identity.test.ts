import { generateUserId, IdentityService } from '../src/identity/IdentityService';
import { validateDisplayName, validateMessageText } from '../src/utils/validation';

// Mock AsyncStorage
const storageMock: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => storageMock[key] || null),
  setItem: jest.fn(async (key: string, value: string) => {
    storageMock[key] = value;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete storageMock[key];
  }),
}));

describe('Identity Service & Validation', () => {
  beforeEach(() => {
    for (const key in storageMock) {
      delete storageMock[key];
    }
  });

  it('generates a 6-character uppercase hex user ID', () => {
    const id1 = generateUserId();
    const id2 = generateUserId();

    expect(id1).toMatch(/^[0-9A-F]{6}$/);
    expect(id2).toMatch(/^[0-9A-F]{6}$/);
    expect(id1).not.toBe(id2);
  });

  it('saves and retrieves identity using AsyncStorage', async () => {
    const saved = await IdentityService.saveIdentity('  Alex  ');
    expect(saved.displayName).toBe('Alex');
    expect(saved.userId).toMatch(/^[0-9A-F]{6}$/);

    const loaded = await IdentityService.getIdentity();
    expect(loaded).not.toBeNull();
    expect(loaded?.displayName).toBe('Alex');
    expect(loaded?.userId).toBe(saved.userId);
  });

  it('clears identity correctly', async () => {
    await IdentityService.saveIdentity('Jordan');
    await IdentityService.clearIdentity();

    const loaded = await IdentityService.getIdentity();
    expect(loaded).toBeNull();
  });

  it('validates display name properly', () => {
    expect(validateDisplayName('Alex').isValid).toBe(true);
    expect(validateDisplayName('').isValid).toBe(false);
    expect(validateDisplayName('   ').isValid).toBe(false);
    expect(validateDisplayName('A'.repeat(25)).isValid).toBe(false);
  });

  it('validates message text properly', () => {
    expect(validateMessageText('Hello!').isValid).toBe(true);
    expect(validateMessageText('').isValid).toBe(false);
    expect(validateMessageText('   ').isValid).toBe(false);
    expect(validateMessageText('A'.repeat(501)).isValid).toBe(false);
  });
});
