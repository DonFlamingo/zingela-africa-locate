import { Link } from 'react-router-dom';
import type { Device } from '../models/types';
import { getDeviceStatusColor, getDeviceStatusText } from '../utils/deviceStatus';

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const statusColor = getDeviceStatusColor(device.status);
  const statusText = getDeviceStatusText(device.status);

  return (
    <Link
      to={`/devices/${device.id}`}
      className="card hover:border-iot-accent transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{device.name}</h3>
          <p className="text-sm text-gray-400 mb-2">{device.uniqueId}</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
            <span className="text-sm text-gray-300">{statusText}</span>
          </div>
        </div>
        {device.lastUpdate && (
          <div className="text-xs text-gray-500">
            {new Date(device.lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>
    </Link>
  );
}

