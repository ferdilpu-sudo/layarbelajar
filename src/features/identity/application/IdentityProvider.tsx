import { createContext, useContext, useState, type ReactNode } from 'react';
import { revokeSession, signIn, type Session } from '../infrastructure/accountApi';

type IdentityContextValue = {
  session: Session | null;
  login: (username: string, password: string) => Promise<void>;
  updateSession: (value: Session) => void;
  logout: () => void;
};
const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  // Fail closed by design: session never persists in localStorage or sessionStorage.
  // Browser reload requires sign-in again until production session refresh is designed and tested.
  const [session, setSession] = useState<Session | null>(null);
  return (
    <IdentityContext.Provider
      value={{
        session,
        login: async (username, password) => setSession(await signIn(username, password)),
        updateSession: setSession,
        logout: () => {
          const token = session?.accessToken;
          setSession(null);
          if (token) void revokeSession(token).catch(() => { /* no token remains in client state */ });
        },
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}
export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) throw new Error('IdentityProvider is missing.');
  return context;
}
