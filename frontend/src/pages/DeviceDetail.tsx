import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getDevice, getDevicePositions, getEvents } from '../services/traccarApi';
import { getDeviceCommands } from '../services/commands';
import { ImmobilisationModal } from '../components/ImmobilisationModal';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getDeviceStatusColor, getDeviceStatusText } from '../utils/deviceStatus';
import { ArrowLeft, Shield, Power, Clock, MapPin } from 'lucide-react';
import type { Command } from '../models/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceId = id ? parseInt(id) : 0;
  const { user, organization, canEdit } = useAuth();
  const [showImmobiliseModal, setShowImmobiliseModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [commandType, setCommandType] = useState<'IMMOBILISE' | 'RESTORE_POWER'>('IMMOBILISE');

  // Fetch device
  const { data: device, isLoading: deviceLoading } = useQuery(
    ['device', deviceId],
    () => getDevice(deviceId),
    {
      enabled: !!deviceId,
      refetchInterval: 30000,
    }
  );

  // Fetch latest position
  const { data: positions = [] } = useQuery(
    ['device-positions', deviceId],
    () => getDevicePositions(deviceId),
    {
      enabled: !!deviceId,
      refetchInterval: 30000,
    }
  );

  const latestPosition = positions[0];

  // Fetch recent alerts for this device
  const { data: alerts = [] } = useQuery(
    ['device-alerts', deviceId],
    () => getEvents([deviceId]),
    {
      enabled: !!deviceId,
      refetchInterval: 30000,
    }
  );

  // Fetch commands for this device
  const commands = device && organization
    ? getDeviceCommands(deviceId, organization.id)
    : [];

  const pendingImmobilise = commands.find(
    cmd => cmd.type === 'IMMOBILISE' && (cmd.status === 'requested' || cmd.status === 'pending')
  );

  const pendingRestore = commands.find(
    cmd => cmd.type === 'RESTORE_POWER' && (cmd.status === 'requested' || cmd.status === 'pending')
  );

  const handleCommandSuccess = (command: Command) => {
    // In production, this would trigger a refetch of commands
    window.location.reload(); // Temporary: reload to show new command
  };

  if (deviceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-iot-accent">Loading device...</div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-400 mb-4">Device not found</p>
        <Link to="/devices" className="btn-primary">
          Back to Devices
        </Link>
      </div>
    );
  }

  const statusColor = getDeviceStatusColor(device.status);
  const statusText = getDeviceStatusText(device.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/devices" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{device.name}</h1>
            <p className="text-gray-400">{device.uniqueId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
          <span className="text-gray-300">{statusText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Telemetry */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Latest Telemetry</h2>
            {latestPosition ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Speed</p>
                  <p className="text-2xl font-bold text-white">
                    {latestPosition.speed?.toFixed(1) || '0'} <span className="text-sm text-gray-400">km/h</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Course</p>
                  <p className="text-2xl font-bold text-white">
                    {latestPosition.course?.toFixed(0) || '0'}° <span className="text-sm text-gray-400"></span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Altitude</p>
                  <p className="text-2xl font-bold text-white">
                    {latestPosition.altitude?.toFixed(0) || '0'} <span className="text-sm text-gray-400">m</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Last Update</p>
                  <p className="text-sm font-medium text-white">
                    {new Date(latestPosition.fixTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No position data available</p>
            )}
          </div>

          {/* Mini Map */}
          {latestPosition && latestPosition.valid && (
            <div className="card p-0 overflow-hidden" style={{ height: '400px' }}>
              <MapContainer
                center={[latestPosition.latitude, latestPosition.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latestPosition.latitude, latestPosition.longitude]}>
                  <Popup>
                    <div className="text-black">
                      <h3 className="font-semibold">{device.name}</h3>
                      <p className="text-sm text-gray-600">{device.uniqueId}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          {/* Recent Alerts */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Alerts</h2>
            <div className="space-y-2">
              {alerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{alert.type}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.eventTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-gray-400 text-sm">No recent alerts</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Device Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Device Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Model</p>
                <p className="text-white">{device.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-white">{device.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Contact</p>
                <p className="text-white">{device.contact || 'N/A'}</p>
              </div>
              {device.lastUpdate && (
                <div>
                  <p className="text-sm text-gray-400">Last Update</p>
                  <p className="text-white">{new Date(device.lastUpdate).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Safety Controls */}
          {canEdit && (
            <div className="card border-2 border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-semibold text-white">Safety Controls</h2>
              </div>
              <div className="space-y-3">
                {pendingImmobilise ? (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                    <p className="text-sm font-medium text-amber-400 mb-1">
                      Immobilisation Requested
                    </p>
                    <p className="text-xs text-gray-400">
                      Status: {pendingImmobilise.status}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCommandType('IMMOBILISE');
                      setShowImmobiliseModal(true);
                    }}
                    className="w-full btn-danger flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Request Immobilisation
                  </button>
                )}

                {pendingRestore ? (
                  <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-sm font-medium text-green-400 mb-1">
                      Power Restoration Requested
                    </p>
                    <p className="text-xs text-gray-400">
                      Status: {pendingRestore.status}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCommandType('RESTORE_POWER');
                      setShowRestoreModal(true);
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Power className="w-5 h-5" />
                    Request Power Restoration
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Command History */}
          {commands.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Command History</h2>
              <div className="space-y-2">
                {commands.slice(0, 5).map(command => (
                  <div
                    key={command.id}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-white">{command.type}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        command.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                        command.status === 'requested' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {command.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{command.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(command.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Immobilisation Modals */}
      {device && user && organization && (
        <>
          <ImmobilisationModal
            device={device}
            organizationId={organization.id}
            userId={user.id}
            type="IMMOBILISE"
            isOpen={showImmobiliseModal}
            onClose={() => setShowImmobiliseModal(false)}
            onSuccess={handleCommandSuccess}
          />
          <ImmobilisationModal
            device={device}
            organizationId={organization.id}
            userId={user.id}
            type="RESTORE_POWER"
            isOpen={showRestoreModal}
            onClose={() => setShowRestoreModal(false)}
            onSuccess={handleCommandSuccess}
          />
        </>
      )}
    </div>
  );
}

