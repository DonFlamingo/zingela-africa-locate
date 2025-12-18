/**
 * Device status utilities
 */

import type { Device, DeviceStatus } from '../models/types';

export function getDeviceStatusColor(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-red-500';
    case 'unknown':
      return 'bg-amber-500';
    default:
      return 'bg-gray-500';
  }
}

export function getDeviceStatusText(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'unknown':
      return 'Unknown';
    default:
      return 'Unknown';
  }
}

export function isDeviceActive(device: Device): boolean {
  if (device.status !== 'online') return false;
  
  // Check if device has recent update (within last 5 minutes)
  if (!device.lastUpdate) return false;
  
  const lastUpdate = new Date(device.lastUpdate);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  
  return diffMinutes < 5;
}

