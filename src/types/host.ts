/**
 * Host application user interface
 * Follows the same pattern as CommunicationModule
 */
export interface HostUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  permissions?: string[];
}

/**
 * Props for the AIStudioModule component
 * Similar to CommunicationModuleProps
 */
export interface AIStudioModuleProps {
  /** User ID for standalone development */
  userId?: string;
  /** Host application context */
  host?: {
    user?: HostUser;
  };
  /** Base path for routing (if needed in future) */
  basePath?: string;
}
