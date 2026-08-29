import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserIdentity = {
  displayName: string;
  userId: string;
};

const STORAGE_KEY = '@zenchat_identity';

/**
 * Generates a 6-character uppercase alphanumeric ID (e.g. A7F29C).
 * Machine-facing identifier to distinguish nearby peers.
 */
export function generateUserId(): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const IdentityService = {
  async getIdentity(): Promise<UserIdentity | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (
        parsed &&
        typeof parsed.displayName === 'string' &&
        parsed.displayName.trim().length > 0 &&
        typeof parsed.userId === 'string' &&
        parsed.userId.trim().length > 0
      ) {
        return {
          displayName: parsed.displayName.trim(),
          userId: parsed.userId.trim().toUpperCase(),
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async saveIdentity(displayName: string, userId?: string): Promise<UserIdentity> {
    const cleanName = displayName.trim();
    const cleanId = (userId || generateUserId()).trim().toUpperCase();

    const identity: UserIdentity = {
      displayName: cleanName,
      userId: cleanId,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    return identity;
  },

  async clearIdentity(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  },
};
