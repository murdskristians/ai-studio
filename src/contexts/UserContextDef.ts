import { createContext } from 'react';
import type { HostUser } from '../types/host';

export interface UserContextValue {
  userId: string | null;
  user: HostUser | null;
}

export const UserContext = createContext<UserContextValue | null>(null);
