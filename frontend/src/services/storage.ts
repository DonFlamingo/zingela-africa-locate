/**
 * Local Storage Service
 * 
 * Handles client-side storage for:
 * - Traccar configuration
 * - Current user/organization context
 * - UI preferences
 * 
 * NOTE: In production, this data should be stored server-side
 * and retrieved via API calls. This is a temporary solution for
 * frontend-only operation.
 */

import type { TraccarConfig, User, Organization } from '../models/types';

const STORAGE_KEYS = {
  TRACCAR_CONFIG: 'traccar_config',
  CURRENT_USER: 'current_user',
  CURRENT_ORG: 'current_org',
  UI_PREFERENCES: 'ui_preferences',
} as const;

/**
 * Traccar Configuration Storage
 */
export const traccarConfigStorage = {
  get(): TraccarConfig | null {
    const stored = localStorage.getItem(STORAGE_KEYS.TRACCAR_CONFIG);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  set(config: TraccarConfig): void {
    localStorage.setItem(STORAGE_KEYS.TRACCAR_CONFIG, JSON.stringify(config));
  },

  remove(): void {
    localStorage.removeItem(STORAGE_KEYS.TRACCAR_CONFIG);
  },
};

/**
 * Current User Storage
 */
export const currentUserStorage = {
  get(): User | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  set(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  remove(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};

/**
 * Current Organization Storage
 */
export const currentOrgStorage = {
  get(): Organization | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  set(org: Organization): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, JSON.stringify(org));
  },

  remove(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ORG);
  },
};

/**
 * Clear all storage (for logout)
 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

