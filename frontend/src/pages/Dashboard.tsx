import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getDevices, getEvents } from '../services/traccarApi';
import { format, subDays } from 'date-fns';
import { Radio, AlertCircle, MapPin, TrendingUp, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Device, Alert } from '../models/types';

export function Dashboard() {
  const { organization } = useAuth();
  const organizationId = organization?.id || '';

  // Fetch devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery<Device[]>(
    ['devices', organizationId],
    () => getDevices(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Filter devices by organization (in production, this would be server-side)
  const orgDevices = devices.filter(d => d.organizationId === organizationId);

  // Fetch recent alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>(
    ['alerts', organizationId],
    () => getEvents(undefined, format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")),
    {
      refetchInterval: 30000,
    }
  );

  const orgAlerts = alerts.filter(a => a.organizationId === organizationId);
  const alertsToday = orgAlerts.filter(a => {
    const alertDate = new Date(a.eventTime);
    const today = new Date();
    return alertDate.toDateString() === today.toDateString();
  });

  // Calculate KPIs
  const totalDevices = orgDevices.length;
  const onlineDevices = orgDevices.filter(d => d.status === 'online').length;
  const offlineDevices = orgDevices.filter(d => d.status === 'offline').length;

  const kpis = [
    {
      name: 'Total Devices',
      value: totalDevices,
      icon: Radio,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      name: 'Online',
      value: onlineDevices,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      name: 'Offline',
      value: offlineDevices,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      name: 'Alerts Today',
      value: alertsToday.length,
      icon: Bell,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
  ];

  const recentAlerts = orgAlerts.slice(0, 5);

  if (devicesLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-iot-accent">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Fleet overview and activity</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{kpi.name}</p>
                  <p className="text-3xl font-bold text-white">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Alerts</h2>
            <Link to="/alerts" className="text-sm text-iot-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent alerts</p>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{alert.type}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {alert.device?.name || `Device ${alert.deviceId}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(alert.eventTime), 'PPp')}
                      </p>
                    </div>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-iot-accent"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/map"
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-iot-accent transition-colors"
            >
              <MapPin className="w-5 h-5 text-iot-accent" />
              <span className="text-white">View Live Map</span>
            </Link>
            <Link
              to="/devices"
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-iot-accent transition-colors"
            >
              <Radio className="w-5 h-5 text-iot-accent" />
              <span className="text-white">Manage Devices</span>
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-iot-accent transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-iot-accent" />
              <span className="text-white">View Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

