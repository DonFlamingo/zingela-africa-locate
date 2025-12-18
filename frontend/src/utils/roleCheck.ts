/**
 * Role-based access control utilities
 */

import type { UserRole } from '../models/types';

export function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canConfigure(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

export function canView(role: UserRole): boolean {
  return true; // All roles can view
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isManager(role: UserRole): boolean {
  return role === 'manager' || role === 'admin';
}

