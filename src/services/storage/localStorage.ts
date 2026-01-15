const STORAGE_PREFIX = 'ai-studio-';

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    console.error(`Error reading ${key} from localStorage`);
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

export function getAllKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key.replace(STORAGE_PREFIX, ''));
    }
  }
  return keys;
}

export function clearAll(): void {
  const keys = getAllKeys();
  keys.forEach(key => removeItem(key));
}

// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  BOTS: 'bots',
  CONVERSATIONS: 'conversations',
  CURRENT_BOT: 'current-bot',
  CURRENT_CONVERSATION: 'current-conversation',
  COMPARISON_MODE: 'comparison-mode',
  COMPARING_BOTS: 'comparing-bots',
} as const;
