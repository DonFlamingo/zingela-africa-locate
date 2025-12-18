import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getDevices, getPositions } from '../services/traccarApi';
import { traccarWebSocket } from '../services/traccarWebSocket';
import { traccarConfigStorage } from '../services/storage';
import { getDeviceStatusColor } from '../utils/deviceStatus';
import type { Device, Position } from '../models/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons based on device status
function createDeviceIcon(status: string): L.Icon {
  const color = status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : '#f59e0b';
  return L.divIcon({
    className: 'device-marker',
    html: `<div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MapEvents({ onDeviceClick }: { onDeviceClick: (deviceId: number) => void }) {
  useMapEvents({});
  return null;
}

export function LiveMap() {
  const { organization } = useAuth();
  const organizationId = organization?.id || '';
  const [positions, setPositions] = useState<Map<number, Position>>(new Map());
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Fetch devices
  const { data: devices = [] } = useQuery<Device[]>(
    ['devices', organizationId],
    () => getDevices(),
    {
      refetchInterval: 30000,
    }
  );

  const orgDevices = devices.filter(d => d.organizationId === organizationId);

  // Fetch initial positions
  const { data: initialPositions = [] } = useQuery<Position[]>(
    ['positions', organizationId],
    () => getPositions(orgDevices.map(d => d.id)),
    {
      refetchInterval: 30000,
    }
  );

  // Update positions from initial fetch
  useEffect(() => {
    const positionsMap = new Map<number, Position>();
    initialPositions.forEach(pos => {
      positionsMap.set(pos.deviceId, pos);
    });
    setPositions(positionsMap);
  }, [initialPositions]);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const config = traccarConfigStorage.get();
    if (!config || !config.isValid) {
      return;
    }

    traccarWebSocket.connect(config);

    const unsubscribePositions = traccarWebSocket.onPositions((newPositions: Position[]) => {
      setPositions(prev => {
        const updated = new Map(prev);
        newPositions.forEach(pos => {
          updated.set(pos.deviceId, pos);
        });
        return updated;
      });
    });

    return () => {
      unsubscribePositions();
    };
  }, []);

  const handleDeviceClick = (deviceId: number) => {
    setSelectedDevice(deviceId);
    // Navigate to device detail (would use useNavigate in real implementation)
    window.location.href = `/devices/${deviceId}`;
  };

  // Get center from first device position, or default to a location
  const center: [number, number] = positions.size > 0
    ? (() => {
        const firstPos = Array.from(positions.values())[0];
        return [firstPos.latitude, firstPos.longitude];
      })()
    : [-25.7479, 28.2293]; // Default: Johannesburg, South Africa

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Live Map</h1>
        <p className="text-gray-400">Real-time device tracking</p>
      </div>

      <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onDeviceClick={handleDeviceClick} />
          {orgDevices.map(device => {
            const position = positions.get(device.id);
            if (!position || !position.valid) return null;

            return (
              <Marker
                key={device.id}
                position={[position.latitude, position.longitude]}
                icon={createDeviceIcon(device.status)}
                eventHandlers={{
                  click: () => handleDeviceClick(device.id),
                }}
              >
                <Popup>
                  <div className="text-black">
                    <h3 className="font-semibold mb-1">{device.name}</h3>
                    <p className="text-sm text-gray-600">{device.uniqueId}</p>
                    <p className="text-sm text-gray-600">Status: {device.status}</p>
                    {position.speed !== undefined && (
                      <p className="text-sm text-gray-600">Speed: {position.speed.toFixed(1)} km/h</p>
                    )}
                    <button
                      onClick={() => handleDeviceClick(device.id)}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Device Legend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Legend</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-300">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-sm text-gray-300">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-300">Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

