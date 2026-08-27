/**
 * ZenChat State — Identity Store
 */

import { create } from 'zustand';
import { identityService, type LocalIdentity } from '../../identity/identityService';
import { logger } from '../../utils/logger';

interface IdentityState {
  identity: LocalIdentity | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;

  loadIdentity: () => void;
  createIdentity: (displayName: string) => LocalIdentity;
  updateDisplayName: (name: string) => void;
  resetIdentity: () => void;
  setOnboardingComplete: () => void;
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  identity: null,
  isLoading: true,
  hasCompletedOnboarding: false,

  loadIdentity: () => {
    const identity = identityService.getIdentity();
    set({
      identity,
      isLoading: false,
      hasCompletedOnboarding: identity !== null,
    });
    if (identity) {
      logger.info('IDENTITY', `Loaded identity: ${identity.displayName}`);
    }
  },

  createIdentity: (displayName: string) => {
    const identity = identityService.createIdentity(displayName);
    set({ identity, hasCompletedOnboarding: true });
    return identity;
  },

  updateDisplayName: (name: string) => {
    const updated = identityService.updateDisplayName(name);
    if (updated) {
      set({ identity: updated });
    }
  },

  resetIdentity: () => {
    identityService.resetIdentity();
    set({ identity: null, hasCompletedOnboarding: false });
  },

  setOnboardingComplete: () => {
    set({ hasCompletedOnboarding: true });
  },
}));
