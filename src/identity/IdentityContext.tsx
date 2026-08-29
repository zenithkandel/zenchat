import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IdentityService, UserIdentity } from './IdentityService';

type IdentityContextType = {
  identity: UserIdentity | null;
  isLoading: boolean;
  setIdentity: (name: string) => Promise<UserIdentity>;
  clearIdentity: () => Promise<void>;
};

const IdentityContext = createContext<IdentityContextType>({
  identity: null,
  isLoading: true,
  setIdentity: async () => ({ displayName: '', userId: '' }),
  clearIdentity: async () => {},
});

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identity, setIdentityState] = useState<UserIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIdentity = useCallback(async () => {
    try {
      const stored = await IdentityService.getIdentity();
      setIdentityState(stored);
    } catch {
      setIdentityState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdentity();
  }, [loadIdentity]);

  const setIdentity = async (name: string): Promise<UserIdentity> => {
    const saved = await IdentityService.saveIdentity(name);
    setIdentityState(saved);
    return saved;
  };

  const clearIdentity = async () => {
    await IdentityService.clearIdentity();
    setIdentityState(null);
  };

  return (
    <IdentityContext.Provider
      value={{
        identity,
        isLoading,
        setIdentity,
        clearIdentity,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
};

export const useIdentity = () => useContext(IdentityContext);
