import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/auth.api';
import type { SignInPayload, SignUpPayload } from '../api/auth.api';
import type { User } from '../types/user';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const signedInUser = await authApi.signIn(payload);
    setUser(signedInUser);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const signedUpUser = await authApi.signUp(payload);
    setUser(signedUpUser);
  }, []);

  const signOut = useCallback(async () => {
    await authApi.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
