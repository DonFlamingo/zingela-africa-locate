import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../services/traccarApi';
import { DeviceCard } from '../components/DeviceCard';
import { Plus, Search, Filter } from 'lucide-react';
import type { Device } from '../models/types';

export function Devices() {
  const { organization, canEdit } = useAuth();
  const organizationId = organization?.id || '';
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Fetch devices
  const { data: devices = [], isLoading } = useQuery<Device[]>(
    ['devices', organizationId],
    () => getDevices(),
    {
      refetchInterval: 30000,
    }
  );

  // Filter devices by organization and search
  const orgDevices = devices
    .filter(d => d.organizationId === organizationId)
    .filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Create device mutation
  const createMutation = useMutation(
    (device: Partial<Device>) => createDevice({ ...device, organizationId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['devices', organizationId]);
        setShowAddModal(false);
      },
    }
  );

  // Update device mutation
  const updateMutation = useMutation(
    ({ id, device }: { id: number; device: Partial<Device> }) => updateDevice(id, device),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['devices', organizationId]);
        setEditingDevice(null);
      },
    }
  );

  // Delete device mutation
  const deleteMutation = useMutation(
    (id: number) => deleteDevice(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['devices', organizationId]);
      },
    }
  );

  const handleDelete = (device: Device) => {
    if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
      deleteMutation.mutate(device.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-iot-accent">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Devices</h1>
          <p className="text-gray-400">Manage your fleet devices</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Device
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      {orgDevices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No devices found</p>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Add Your First Device
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgDevices.map(device => (
            <div key={device.id} className="relative">
              <DeviceCard device={device} />
              {canEdit && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => setEditingDevice(device)}
                    className="p-2 bg-iot-surface hover:bg-gray-800 rounded-lg border border-gray-700 text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(device)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Device Modal */}
      {(showAddModal || editingDevice) && (
        <DeviceModal
          device={editingDevice}
          onClose={() => {
            setShowAddModal(false);
            setEditingDevice(null);
          }}
          onSave={(deviceData) => {
            if (editingDevice) {
              updateMutation.mutate({ id: editingDevice.id, device: deviceData });
            } else {
              createMutation.mutate(deviceData);
            }
          }}
        />
      )}
    </div>
  );
}

// Device Modal Component
function DeviceModal({
  device,
  onClose,
  onSave,
}: {
  device: Device | null;
  onSave: (data: Partial<Device>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Device>>({
    name: device?.name || '',
    uniqueId: device?.uniqueId || '',
    phone: device?.phone || '',
    model: device?.model || '',
    contact: device?.contact || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-iot-surface rounded-lg border border-gray-800 max-w-md w-full">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {device ? 'Edit Device' : 'Add Device'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Device Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Unique ID *
            </label>
            <input
              type="text"
              required
              value={formData.uniqueId}
              onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <input
              type="text"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="input w-full"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {device ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

