/**
 * Traccar REST API Client
 * 
 * This service handles all communication with the Traccar server.
 * All API calls use the configured Traccar connection from settings.
 * 
 * NOTE: In production, this should be proxied through a backend to:
 * - Avoid CORS issues
 * - Secure API tokens
 * - Add rate limiting
 * - Implement proper authentication
 */

import type { Device, Position, Geofence, Alert, Trip, TraccarConfig } from '../models/types';
import { currentOrgStorage } from './storage';

// Get the current Traccar configuration from localStorage
// In production, this would come from a backend API
function getTraccarConfig(): TraccarConfig | null {
  const stored = localStorage.getItem('traccar_config');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Helper to add organizationId to Traccar responses
// In production, this would be handled server-side
function addOrganizationScope<T extends { organizationId?: string }>(data: T | T[]): T | T[] {
  const org = currentOrgStorage.get();
  const orgId = org?.id || '';
  
  if (Array.isArray(data)) {
    return data.map(item => ({ ...item, organizationId: orgId }));
  }
  return { ...data, organizationId: orgId };
}

// Build authorization header from config
function getAuthHeaders(config: TraccarConfig): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (config.authMethod === 'token' && config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  } else if (config.authMethod === 'basic' && config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  return headers;
}

// Base API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getTraccarConfig();
  if (!config || !config.isValid) {
    throw new Error('Traccar connection not configured or invalid. Please configure in Settings.');
  }

  const url = `${config.serverUrl.replace(/\/$/, '')}${endpoint}`;
  const headers = getAuthHeaders(config);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your Traccar credentials.');
    }
    if (response.status === 404) {
      throw new Error('Resource not found.');
    }
    throw new Error(`Traccar API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Test Traccar connection
 * Uses GET /api/server to verify connectivity and authentication
 */
export async function testTraccarConnection(config: TraccarConfig): Promise<boolean> {
  try {
    const url = `${config.serverUrl.replace(/\/$/, '')}/api/server`;
    const headers = getAuthHeaders(config);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return false;
    }

    await response.json();
    return true;
  } catch (error) {
    console.error('Traccar connection test failed:', error);
    return false;
  }
}

/**
 * Get all devices
 * GET /api/devices
 */
export async function getDevices(): Promise<Device[]> {
  const devices = await apiRequest<Device[]>('/api/devices');
  return addOrganizationScope(devices) as Device[];
}

/**
 * Get device by ID
 * GET /api/devices/:id
 */
export async function getDevice(id: number): Promise<Device> {
  const device = await apiRequest<Device>(`/api/devices/${id}`);
  return addOrganizationScope(device) as Device;
}

/**
 * Create device
 * POST /api/devices
 */
export async function createDevice(device: Partial<Device>): Promise<Device> {
  return apiRequest<Device>('/api/devices', {
    method: 'POST',
    body: JSON.stringify(device),
  });
}

/**
 * Update device
 * PUT /api/devices/:id
 */
export async function updateDevice(id: number, device: Partial<Device>): Promise<Device> {
  return apiRequest<Device>(`/api/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(device),
  });
}

/**
 * Delete device
 * DELETE /api/devices/:id
 */
export async function deleteDevice(id: number): Promise<void> {
  return apiRequest<void>(`/api/devices/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get latest positions for devices
 * GET /api/positions
 */
export async function getPositions(deviceIds?: number[]): Promise<Position[]> {
  const params = deviceIds ? `?deviceId=${deviceIds.join(',')}` : '';
  return apiRequest<Position[]>(`/api/positions${params}`);
}

/**
 * Get positions for a specific device
 * GET /api/positions?deviceId=:id
 */
export async function getDevicePositions(deviceId: number, from?: string, to?: string): Promise<Position[]> {
  const params = new URLSearchParams({ deviceId: deviceId.toString() });
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiRequest<Position[]>(`/api/positions?${params.toString()}`);
}

/**
 * Get all geofences
 * GET /api/geofences
 */
export async function getGeofences(): Promise<Geofence[]> {
  const geofences = await apiRequest<Geofence[]>('/api/geofences');
  return addOrganizationScope(geofences) as Geofence[];
}

/**
 * Get geofence by ID
 * GET /api/geofences/:id
 */
export async function getGeofence(id: number): Promise<Geofence> {
  return apiRequest<Geofence>(`/api/geofences/${id}`);
}

/**
 * Create geofence
 * POST /api/geofences
 */
export async function createGeofence(geofence: Partial<Geofence>): Promise<Geofence> {
  return apiRequest<Geofence>('/api/geofences', {
    method: 'POST',
    body: JSON.stringify(geofence),
  });
}

/**
 * Update geofence
 * PUT /api/geofences/:id
 */
export async function updateGeofence(id: number, geofence: Partial<Geofence>): Promise<Geofence> {
  return apiRequest<Geofence>(`/api/geofences/${id}`, {
    method: 'PUT',
    body: JSON.stringify(geofence),
  });
}

/**
 * Delete geofence
 * DELETE /api/geofences/:id
 */
export async function deleteGeofence(id: number): Promise<void> {
  return apiRequest<void>(`/api/geofences/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get events/alerts
 * GET /api/events
 */
export async function getEvents(deviceIds?: number[], from?: string, to?: string): Promise<Alert[]> {
  const params = new URLSearchParams();
  if (deviceIds) params.append('deviceId', deviceIds.join(','));
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const query = params.toString();
  const events = await apiRequest<Alert[]>(`/api/events${query ? `?${query}` : ''}`);
  return addOrganizationScope(events) as Alert[];
}

/**
 * Get trip reports
 * GET /api/reports/trips
 */
export async function getTrips(
  deviceIds?: number[],
  from?: string,
  to?: string
): Promise<Trip[]> {
  const params = new URLSearchParams();
  if (deviceIds) params.append('deviceId', deviceIds.join(','));
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const query = params.toString();
  const trips = await apiRequest<Trip[]>(`/api/reports/trips${query ? `?${query}` : ''}`);
  return addOrganizationScope(trips) as Trip[];
}

/**
 * Get summary report
 * GET /api/reports/summary
 */
export async function getSummary(
  deviceIds?: number[],
  from?: string,
  to?: string
): Promise<any> {
  const params = new URLSearchParams();
  if (deviceIds) params.append('deviceId', deviceIds.join(','));
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const query = params.toString();
  return apiRequest<any>(`/api/reports/summary${query ? `?${query}` : ''}`);
}

/**
 * Send command (for future backend use)
 * POST /api/commands
 * 
 * NOTE: This endpoint should be called through a backend proxy in production
 * to ensure proper authorization and audit logging
 */
export async function sendCommand(deviceId: number, type: string, attributes?: Record<string, any>): Promise<any> {
  return apiRequest<any>('/api/commands', {
    method: 'POST',
    body: JSON.stringify({
      deviceId,
      type,
      attributes: attributes || {},
    }),
  });
}

