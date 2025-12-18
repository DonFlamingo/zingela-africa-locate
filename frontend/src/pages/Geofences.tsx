import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getGeofences, createGeofence, updateGeofence, deleteGeofence } from '../services/traccarApi';
import { MapPin, Plus, Trash2, Edit } from 'lucide-react';
import type { Geofence } from '../models/types';

export function Geofences() {
  const { organization, canEdit } = useAuth();
  const organizationId = organization?.id || '';
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);

  // Fetch geofences
  const { data: geofences = [], isLoading } = useQuery<Geofence[]>(
    ['geofences', organizationId],
    () => getGeofences(),
    {
      refetchInterval: 60000,
    }
  );

  const orgGeofences = geofences.filter(g => g.organizationId === organizationId);

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => deleteGeofence(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['geofences', organizationId]);
      },
    }
  );

  const handleDelete = (geofence: Geofence) => {
    if (window.confirm(`Are you sure you want to delete ${geofence.name}?`)) {
      deleteMutation.mutate(geofence.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-iot-accent">Loading geofences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Geofences</h1>
          <p className="text-gray-400">Define geographic boundaries for your fleet</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Geofence
          </button>
        )}
      </div>

      {orgGeofences.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No geofences configured</p>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              Create Your First Geofence
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgGeofences.map(geofence => (
            <div key={geofence.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{geofence.name}</h3>
                  {geofence.description && (
                    <p className="text-sm text-gray-400">{geofence.description}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingGeofence(geofence)}
                      className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(geofence)}
                      className="p-2 hover:bg-red-600/20 rounded-lg text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Area: {geofence.area.substring(0, 50)}...
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingGeofence) && (
        <GeofenceModal
          geofence={editingGeofence}
          onClose={() => {
            setShowAddModal(false);
            setEditingGeofence(null);
          }}
          onSave={(data) => {
            // In a real implementation, this would use the Traccar API
            // For now, we'll just show a message
            alert('Geofence creation/editing requires map-based polygon drawing. This feature will be implemented with react-leaflet-draw.');
            setShowAddModal(false);
            setEditingGeofence(null);
          }}
        />
      )}
    </div>
  );
}

function GeofenceModal({
  geofence,
  onClose,
  onSave,
}: {
  geofence: Geofence | null;
  onSave: (data: Partial<Geofence>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Geofence>>({
    name: geofence?.name || '',
    description: geofence?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would include polygon drawing on a map
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-iot-surface rounded-lg border border-gray-800 max-w-2xl w-full">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {geofence ? 'Edit Geofence' : 'Create Geofence'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Note: Polygon drawing will be implemented with react-leaflet-draw
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
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
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full h-24 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {geofence ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

