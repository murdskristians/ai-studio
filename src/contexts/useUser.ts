import { useContext } from 'react';
import { UserContext, type UserContextValue } from './UserContextDef';

/**
 * Hook to access user context
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

/**
 * Hook to get just the userId (convenience)
 */
export function useUserId(): string | null {
  const { userId } = useUser();
  return userId;
}
