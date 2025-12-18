import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTraccarConfig } from '../hooks/useTraccarConfig';
import { Settings as SettingsIcon, Server, Users, Building2, CheckCircle, XCircle } from 'lucide-react';

export function Settings() {
  const { user, organization, updateUser, updateOrganization } = useAuth();
  const { config, isLoading: configLoading, isTesting, saveConfig, testConnection } = useTraccarConfig(
    organization?.id || ''
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your organization and integrations</p>
      </div>

      <div className="space-y-6">
        {/* Traccar Connection */}
        <TraccarConnectionSection
          config={config}
          isLoading={configLoading}
          isTesting={isTesting}
          onSave={saveConfig}
          onTest={testConnection}
          organizationId={organization?.id || ''}
        />

        {/* Organization Settings */}
        <OrganizationSection
          organization={organization}
          onUpdate={updateOrganization}
        />

        {/* User Settings */}
        <UserSection
          user={user}
          onUpdate={updateUser}
        />
      </div>
    </div>
  );
}

function TraccarConnectionSection({
  config,
  isLoading,
  isTesting,
  onSave,
  onTest,
  organizationId,
}: {
  config: any;
  isLoading: boolean;
  isTesting: boolean;
  onSave: (config: any) => Promise<{ success: boolean; error?: string }>;
  onTest: () => Promise<boolean>;
  organizationId: string;
}) {
  const [isEditing, setIsEditing] = useState(!config);
  const [formData, setFormData] = useState({
    serverUrl: config?.serverUrl || '',
    authMethod: config?.authMethod || 'token',
    apiToken: config?.apiToken || '',
    username: config?.username || '',
    password: config?.password || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (!formData.serverUrl) {
      setError('Server URL is required');
      return;
    }

    if (formData.authMethod === 'token' && !formData.apiToken) {
      setError('API Token is required');
      return;
    }

    if (formData.authMethod === 'basic' && (!formData.username || !formData.password)) {
      setError('Username and password are required');
      return;
    }

    const result = await onSave({
      ...formData,
      organizationId,
    });

    if (result.success) {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to save configuration');
    }
  };

  const handleTest = async () => {
    setError(null);
    const isValid = await onTest();
    if (isValid) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError('Connection test failed. Please check your configuration.');
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-iot-accent">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-6 h-6 text-iot-accent" />
        <h2 className="text-2xl font-semibold text-white">Traccar Connection</h2>
        {config?.isValid && (
          <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Connected
          </span>
        )}
        {config && !config.isValid && (
          <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Disconnected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          Configuration saved successfully!
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Traccar Server URL *
            </label>
            <input
              type="url"
              value={formData.serverUrl}
              onChange={(e) => setFormData({ ...formData, serverUrl: e.target.value })}
              placeholder="https://track.example.com"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your Traccar server URL (e.g., https://track.example.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Authentication Method *
            </label>
            <select
              value={formData.authMethod}
              onChange={(e) => setFormData({ ...formData, authMethod: e.target.value as 'token' | 'basic' })}
              className="input w-full"
            >
              <option value="token">API Token (Recommended)</option>
              <option value="basic">Username & Password</option>
            </select>
          </div>

          {formData.authMethod === 'token' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                API Token *
              </label>
              <input
                type="password"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                placeholder="Enter your Traccar API token"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate an API token in Traccar: Settings → Users → Your User → Generate Token
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter your Traccar username"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your Traccar password"
                  className="input w-full"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isTesting}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Save & Test Connection'}
            </button>
            {config && (
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
                disabled={isTesting}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Server URL</p>
              <p className="text-white">{config?.serverUrl || 'Not configured'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Authentication</p>
              <p className="text-white capitalize">{config?.authMethod || 'Not configured'}</p>
            </div>
            {config?.lastTested && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Last Tested</p>
                <p className="text-white text-sm">
                  {new Date(config.lastTested).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
            >
              Edit Configuration
            </button>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="btn-primary disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-sm text-amber-400">
          <strong>Security Note:</strong> In production, Traccar credentials should be stored
          server-side and accessed through a secure API. This frontend-only storage is for
          development purposes only.
        </p>
      </div>
    </div>
  );
}

function OrganizationSection({
  organization,
  onUpdate,
}: {
  organization: any;
  onUpdate: (org: any) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(organization?.name || '');

  const handleSave = () => {
    if (name.trim()) {
      onUpdate({ ...organization, name: name.trim() });
      setIsEditing(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-iot-accent" />
        <h2 className="text-2xl font-semibold text-white">Organization</h2>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-white text-lg mb-4">{organization?.name}</p>
          <button onClick={() => setIsEditing(true)} className="btn-secondary">
            Edit Organization
          </button>
        </div>
      )}
    </div>
  );
}

function UserSection({
  user,
  onUpdate,
}: {
  user: any;
  onUpdate: (user: any) => void;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-iot-accent" />
        <h2 className="text-2xl font-semibold text-white">User Profile</h2>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">Name</p>
          <p className="text-white">{user?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">Email</p>
          <p className="text-white">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">Role</p>
          <span className="inline-block px-3 py-1 text-sm rounded bg-iot-accent/20 text-iot-accent capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-400">
          User management and role assignment will be handled through a backend API in production.
        </p>
      </div>
    </div>
  );
}

