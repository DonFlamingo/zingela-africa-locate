/**
 * Authentication Hook
 * 
 * Manages current user and organization context.
 * In production, this would integrate with a backend auth service.
 */

import { useState, useEffect } from 'react';
import type { User, Organization } from '../models/types';
import { currentUserStorage, currentOrgStorage } from '../services/storage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user and org from storage
    const storedUser = currentUserStorage.get();
    const storedOrg = currentOrgStorage.get();

    // For demo purposes, create default user/org if none exist
    if (!storedUser || !storedOrg) {
      const defaultUser: User = {
        id: '1',
        email: 'admin@donflamingo.io',
        name: 'Admin User',
        role: 'admin',
        organizationId: '1',
        createdAt: new Date().toISOString(),
      };

      const defaultOrg: Organization = {
        id: '1',
        name: 'Donflamingo Fleet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      currentUserStorage.set(defaultUser);
      currentOrgStorage.set(defaultOrg);
      setUser(defaultUser);
      setOrganization(defaultOrg);
    } else {
      setUser(storedUser);
      setOrganization(storedOrg);
    }

    setIsLoading(false);
  }, []);

  const updateUser = (updatedUser: User) => {
    currentUserStorage.set(updatedUser);
    setUser(updatedUser);
  };

  const updateOrganization = (updatedOrg: Organization) => {
    currentOrgStorage.set(updatedOrg);
    setOrganization(updatedOrg);
  };

  const logout = () => {
    currentUserStorage.remove();
    currentOrgStorage.remove();
    setUser(null);
    setOrganization(null);
  };

  return {
    user,
    organization,
    isLoading,
    updateUser,
    updateOrganization,
    logout,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    canEdit: user?.role === 'admin' || user?.role === 'manager',
  };
}

