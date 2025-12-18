import { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getEvents } from '../services/traccarApi';
import { format, subDays } from 'date-fns';
import { Bell, Filter, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Alert } from '../models/types';

export function Alerts() {
  const { organization } = useAuth();
  const organizationId = organization?.id || '';
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery<Alert[]>(
    ['alerts', organizationId],
    () => getEvents(undefined, format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")),
    {
      refetchInterval: 30000,
    }
  );

  const orgAlerts = alerts
    .filter(a => a.organizationId === organizationId)
    .filter(a => {
      if (readFilter === 'read' && !a.read) return false;
      if (readFilter === 'unread' && a.read) return false;
      return true;
    })
    .sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());

  const markAsRead = (alertId: number) => {
    // In production, this would update the alert via API
    // For now, we'll just note that this should be implemented
    console.log('Mark as read:', alertId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-iot-accent">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Alerts</h1>
          <p className="text-gray-400">Monitor fleet events and notifications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Filter:</span>
          </div>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="input text-sm"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {orgAlerts.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No alerts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgAlerts.map(alert => (
            <div
              key={alert.id}
              className={`card ${!alert.read ? 'border-l-4 border-iot-accent' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{alert.type}</h3>
                    {!alert.read && (
                      <span className="px-2 py-0.5 text-xs rounded bg-iot-accent/20 text-iot-accent">
                        New
                      </span>
                    )}
                  </div>
                  {alert.device && (
                    <Link
                      to={`/devices/${alert.deviceId}`}
                      className="text-iot-accent hover:underline text-sm"
                    >
                      {alert.device.name || `Device ${alert.deviceId}`}
                    </Link>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    {format(new Date(alert.eventTime), 'PPp')}
                  </p>
                  {alert.position && (
                    <p className="text-xs text-gray-500 mt-1">
                      Location: {alert.position.latitude.toFixed(6)}, {alert.position.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!alert.read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

