import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  functionCall,
  refreshIdentity,
  renewSession,
  revokeSession,
  signIn,
  type Session,
} from '../infrastructure/accountApi';
import { shouldRevalidate, shouldRenew } from './sessionExpiry';

type IdentityContextValue = {
  session: Session | null;
  login: (username: string, password: string) => Promise<void>;
  updateSession: (session: Session) => void;
  authorizedCall: (
    name: 'account-admin' | 'change-password',
    payload?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  logout: () => void;
};
const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  // Access and rotated refresh tokens live only in memory; never localStorage/sessionStorage.
  // A page reload still requires new login, while an active tab can renew safely.
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const generation = useRef(0);
  const lastValidated = useRef(0);
  const inFlight = useRef<Promise<Session> | null>(null);

  const updateSession = useCallback((next: Session) => {
    generation.current++;
    sessionRef.current = next;
    lastValidated.current = Date.now();
    setSession(next);
  }, []);
  const clear = useCallback(() => {
    generation.current++;
    sessionRef.current = null;
    lastValidated.current = 0;
    setSession(null);
  }, []);
  const ensureSession = useCallback(async (): Promise<Session> => {
    if (inFlight.current) return inFlight.current;
    const current = sessionRef.current;
    if (!current) throw new Error('Sesi telah berakhir. Silakan masuk lagi.');
    if (!shouldRenew(current.expiresAt) && !shouldRevalidate(lastValidated.current)) {
      return current;
    }
    const snapshot = generation.current;
    const operation = (async () => {
      try {
        const updated = shouldRenew(current.expiresAt)
          ? await renewSession(current)
          : { ...current, identity: await refreshIdentity(current.accessToken) };
        if (snapshot !== generation.current || !sessionRef.current) {
          throw new Error('Sesi telah berubah.');
        }
        sessionRef.current = updated;
        lastValidated.current = Date.now();
        setSession(updated);
        return updated;
      } catch (cause) {
        // A failed refresh/status revalidation never leaves stale privileged state active.
        if (snapshot === generation.current) clear();
        throw cause;
      }
    })();
    inFlight.current = operation;
    try {
      return await operation;
    } finally {
      if (inFlight.current === operation) inFlight.current = null;
    }
  }, [clear]);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible' || !sessionRef.current) return;
      void ensureSession().catch(() => {
        // ensureSession clears the session on any failed renewal or revalidation.
      });
    };
    const handle = window.setInterval(check, 15_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(handle);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [ensureSession]);

  const authorizedCall = useCallback(
    async (name: 'account-admin' | 'change-password', payload?: Record<string, unknown>) => {
      const fresh = await ensureSession();
      return functionCall(fresh.accessToken, name, payload);
    },
    [ensureSession],
  );
  const login = useCallback(
    async (username: string, password: string) => {
      const epoch = generation.current;
      const next = await signIn(username, password);
      if (epoch !== generation.current) throw new Error('Sesi telah berubah.');
      updateSession(next);
    },
    [updateSession],
  );
  const logout = useCallback(() => {
    const token = sessionRef.current?.accessToken;
    clear();
    if (token)
      void revokeSession(token).catch(() => {
        // The local session has already been invalidated; never restore stale credentials.
      });
  }, [clear]);

  return (
    <IdentityContext.Provider value={{ session, login, updateSession, authorizedCall, logout }}>
      {children}
    </IdentityContext.Provider>
  );
}
export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) throw new Error('IdentityProvider is missing.');
  return context;
}
