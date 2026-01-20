import { useMemo, type FC } from 'react';
import { AppProvider } from './contexts';
import { UserProvider } from './contexts/UserContext';
import { AppContent } from './AppContent';
import type { AIStudioModuleProps, HostUser } from './types/host';
import './index.css';

/**
 * AIStudioModule - Main entry point for the AI Studio module
 *
 * Following the same pattern as CommunicationModule:
 * - Receives user from host application via host.user
 * - Or receives userId prop for standalone development
 * - Falls back to localStorage 'current_user_id'
 */
const AIStudioModule: FC<AIStudioModuleProps> = ({
  userId,
  host,
}) => {
  // Get user from host props or create default for standalone mode
  const user: HostUser | null = useMemo(() => {
    if (host?.user) {
      return host.user;
    }
    // Fallback for standalone development
    if (userId) {
      return {
        uid: userId,
        email: `${userId}@example.com`,
        displayName: userId,
        photoURL: null,
        permissions: [],
      };
    }
    return null;
  }, [host?.user, userId]);

  // If no user, try localStorage fallback (handled in UserProvider)
  // For now, we still render the app - UserProvider will handle the fallback

  return (
    <div className="ai-studio-root">
      <UserProvider hostUser={user || undefined} userId={userId}>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </UserProvider>
    </div>
  );
};

export default AIStudioModule;
