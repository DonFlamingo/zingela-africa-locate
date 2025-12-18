/**
 * Command Service
 * 
 * Manages immobilisation and restore power commands.
 * 
 * IMPORTANT: This is a frontend-only implementation that creates
 * command records but does NOT execute them directly. Actual execution
 * should be handled by a backend service that:
 * - Validates authorization
 * - Audits the action
 * - Sends the command to Traccar
 * - Updates command status
 * 
 * Commands are stored in localStorage for now, but should be stored
 * server-side in production.
 */

import type { Command } from '../models/types';

const COMMANDS_STORAGE_KEY = 'commands';

/**
 * Get all commands for an organization
 */
export function getCommands(organizationId: string): Command[] {
  const stored = localStorage.getItem(COMMANDS_STORAGE_KEY);
  if (!stored) return [];
  try {
    const allCommands: Command[] = JSON.parse(stored);
    return allCommands.filter(cmd => cmd.organizationId === organizationId);
  } catch {
    return [];
  }
}

/**
 * Get commands for a specific device
 */
export function getDeviceCommands(deviceId: number, organizationId: string): Command[] {
  return getCommands(organizationId).filter(
    cmd => cmd.deviceId === deviceId
  );
}

/**
 * Get command by ID
 */
export function getCommand(id: string): Command | null {
  const stored = localStorage.getItem(COMMANDS_STORAGE_KEY);
  if (!stored) return null;
  try {
    const allCommands: Command[] = JSON.parse(stored);
    return allCommands.find(cmd => cmd.id === id) || null;
  } catch {
    return null;
  }
}

/**
 * Create a new command (immobilisation request)
 */
export function createCommand(command: Omit<Command, 'id' | 'timestamp'>): Command {
  const newCommand: Command = {
    ...command,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  const stored = localStorage.getItem(COMMANDS_STORAGE_KEY);
  const allCommands: Command[] = stored ? JSON.parse(stored) : [];
  allCommands.push(newCommand);
  localStorage.setItem(COMMANDS_STORAGE_KEY, JSON.stringify(allCommands));

  return newCommand;
}

/**
 * Update command status
 */
export function updateCommand(id: string, updates: Partial<Command>): Command | null {
  const stored = localStorage.getItem(COMMANDS_STORAGE_KEY);
  if (!stored) return null;

  try {
    const allCommands: Command[] = JSON.parse(stored);
    const index = allCommands.findIndex(cmd => cmd.id === id);
    if (index === -1) return null;

    allCommands[index] = { ...allCommands[index], ...updates };
    localStorage.setItem(COMMANDS_STORAGE_KEY, JSON.stringify(allCommands));
    return allCommands[index];
  } catch {
    return null;
  }
}

/**
 * Get pending commands (requested but not executed)
 */
export function getPendingCommands(organizationId: string): Command[] {
  return getCommands(organizationId).filter(
    cmd => cmd.status === 'requested' || cmd.status === 'pending'
  );
}

