import { useMemo, type ReactNode } from 'react';
import type { HostUser } from '../types/host';
import { UserContext } from './UserContextDef';

const CURRENT_USER_ID_STORAGE_KEY = 'current_user_id';

interface UserProviderProps {
  children: ReactNode;
  /** User from host application */
  hostUser?: HostUser;
  /** User ID for standalone development */
  userId?: string;
}

/**
 * UserProvider - Manages user context following CommunicationModule pattern
 *
 * User ID resolution order:
 * 1. hostUser.uid - From host application
 * 2. userId prop - For standalone development
 * 3. localStorage 'current_user_id' - Fallback
 */
export function UserProvider({ children, hostUser, userId: propUserId }: UserProviderProps) {
  const user = useMemo<HostUser | null>(() => {
    // Priority 1: Host application user
    if (hostUser) {
      return hostUser;
    }

    // Priority 2: userId prop (standalone dev)
    if (propUserId) {
      return {
        uid: propUserId,
        email: `${propUserId}@example.com`,
        displayName: propUserId,
        photoURL: null,
        permissions: [],
      };
    }

    // Priority 3: localStorage fallback
    const storedUserId = localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY);
    if (storedUserId) {
      return {
        uid: storedUserId,
        email: `${storedUserId}@example.com`,
        displayName: storedUserId,
        photoURL: null,
        permissions: [],
      };
    }

    return null;
  }, [hostUser, propUserId]);

  const value = useMemo(() => ({
    userId: user?.uid || null,
    user,
  }), [user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
