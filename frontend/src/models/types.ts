/**
 * Core data models for donflamingo I.O.T
 * These models represent the frontend data structure and align with Traccar API responses
 */

// User roles for multi-tenant access control
export type UserRole = 'admin' | 'manager' | 'viewer';

// Organization model - represents a tenant in the multi-tenant system
export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// User model
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
}

// OrganizationMember - links users to organizations with roles
export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  user?: User;
}

// Device status from Traccar
export type DeviceStatus = 'online' | 'offline' | 'unknown';

// Device model - maps to Traccar device
export interface Device {
  id: number; // Traccar device ID
  name: string;
  uniqueId: string;
  status: DeviceStatus;
  lastUpdate?: string;
  positionId?: number;
  groupId?: number;
  phone?: string;
  model?: string;
  contact?: string;
  category?: string;
  disabled?: boolean;
  organizationId: string; // Frontend-only: scopes device to organization
}

// Position/Telemetry from Traccar
export interface Position {
  id: number;
  deviceId: number;
  protocol?: string;
  deviceTime: string;
  fixTime: string;
  serverTime: string;
  outdated: boolean;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number; // km/h
  course: number; // degrees
  address?: string;
  accuracy?: number;
  network?: any;
  attributes?: Record<string, any>; // Additional telemetry (fuel, engine hours, etc.)
}

// Geofence model - maps to Traccar geofence
export interface Geofence {
  id: number; // Traccar geofence ID
  name: string;
  description?: string;
  area: string; // WKT format polygon
  calendarId?: number;
  attributes?: Record<string, any>;
  organizationId: string; // Frontend-only: scopes geofence to organization
}

// Alert/Event from Traccar
export interface Alert {
  id: number;
  type: string; // e.g., 'geofenceEnter', 'overspeed', 'deviceOffline'
  eventTime: string;
  deviceId: number;
  positionId?: number;
  geofenceId?: number;
  maintenanceId?: number;
  attributes?: Record<string, any>;
  device?: Device;
  position?: Position;
  read: boolean; // Frontend-only: tracks if alert has been read
  organizationId: string; // Frontend-only: scopes alert to organization
}

// Trip report from Traccar
export interface Trip {
  deviceId: number;
  deviceName: string;
  distance: number; // meters
  duration: number; // milliseconds
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  startOdometer?: number;
  endOdometer?: number;
  startTime: string;
  endTime: string;
  startPosition?: Position;
  endPosition?: Position;
  organizationId: string; // Frontend-only: scopes trip to organization
}

// Command model - for immobilisation requests (frontend-only initially)
export interface Command {
  id: string; // Frontend-generated UUID
  type: 'IMMOBILISE' | 'RESTORE_POWER';
  status: 'requested' | 'pending' | 'executed' | 'failed' | 'cancelled';
  deviceId: number;
  organizationId: string;
  userId: string;
  reason: string;
  timestamp: string;
  executedAt?: string;
  notes?: string;
}

// Traccar configuration - stored client-side (can be moved to backend later)
export interface TraccarConfig {
  serverUrl: string; // e.g., "https://track.example.com"
  authMethod: 'token' | 'basic';
  apiToken?: string; // For token auth
  username?: string; // For basic auth
  password?: string; // For basic auth (should be encrypted in production)
  organizationId: string; // Which organization this config belongs to
  lastTested?: string; // Last successful connection test timestamp
  isValid: boolean; // Whether the connection is currently valid
}

// Summary statistics
export interface SummaryStats {
  deviceCount: number;
  onlineCount: number;
  offlineCount: number;
  alertsToday: number;
  totalDistance: number; // meters
  totalDuration: number; // milliseconds
}

// Activity feed item
export interface ActivityItem {
  id: string;
  type: 'device_online' | 'device_offline' | 'alert' | 'geofence_enter' | 'geofence_exit' | 'command';
  timestamp: string;
  deviceId?: number;
  deviceName?: string;
  message: string;
  organizationId: string;
}

