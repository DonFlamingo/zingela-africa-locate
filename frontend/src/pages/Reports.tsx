import { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import { getTrips, getSummary } from '../services/traccarApi';
import { format, subDays } from 'date-fns';
import { FileText, Download, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { Trip } from '../models/types';

export function Reports() {
  const { organization } = useAuth();
  const organizationId = organization?.id || '';
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Fetch trips
  const { data: trips = [], isLoading: tripsLoading } = useQuery<Trip[]>(
    ['trips', organizationId, dateFrom, dateTo],
    () => getTrips(undefined, `${dateFrom}T00:00:00.000Z`, `${dateTo}T23:59:59.999Z`),
    {
      enabled: !!dateFrom && !!dateTo,
    }
  );

  const orgTrips = trips.filter(t => t.organizationId === organizationId);

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery(
    ['summary', organizationId, dateFrom, dateTo],
    () => getSummary(undefined, `${dateFrom}T00:00:00.000Z`, `${dateTo}T23:59:59.999Z`),
    {
      enabled: !!dateFrom && !!dateTo,
    }
  );

  const handleExport = () => {
    // Convert trips to CSV
    const headers = ['Device', 'Start Time', 'End Time', 'Distance (km)', 'Duration (h)', 'Avg Speed (km/h)', 'Max Speed (km/h)'];
    const rows = orgTrips.map(trip => [
      trip.deviceName,
      trip.startTime,
      trip.endTime,
      (trip.distance / 1000).toFixed(2),
      (trip.duration / 3600000).toFixed(2),
      trip.averageSpeed.toFixed(2),
      trip.maxSpeed.toFixed(2),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trips-report-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const chartData = orgTrips.map(trip => ({
    device: trip.deviceName,
    distance: (trip.distance / 1000).toFixed(2),
    duration: (trip.duration / 3600000).toFixed(2),
    avgSpeed: trip.averageSpeed.toFixed(2),
  }));

  if (tripsLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-iot-accent">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
          <p className="text-gray-400">Fleet analytics and trip summaries</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Date Range */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-sm text-gray-400 mb-1">Total Distance</p>
            <p className="text-2xl font-bold text-white">
              {((summary.distance || 0) / 1000).toFixed(2)} <span className="text-sm text-gray-400">km</span>
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400 mb-1">Total Duration</p>
            <p className="text-2xl font-bold text-white">
              {((summary.duration || 0) / 3600000).toFixed(2)} <span className="text-sm text-gray-400">hours</span>
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400 mb-1">Total Trips</p>
            <p className="text-2xl font-bold text-white">{orgTrips.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-400 mb-1">Avg Speed</p>
            <p className="text-2xl font-bold text-white">
              {summary.averageSpeed?.toFixed(1) || '0'} <span className="text-sm text-gray-400">km/h</span>
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Distance by Device</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="device" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="distance" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Duration by Device</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="device" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #374151', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="duration" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trips Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Trip Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Start Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">End Time</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Distance (km)</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Duration (h)</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Avg Speed (km/h)</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Max Speed (km/h)</th>
              </tr>
            </thead>
            <tbody>
              {orgTrips.map((trip, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white">{trip.deviceName}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">
                    {format(new Date(trip.startTime), 'PPp')}
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-sm">
                    {format(new Date(trip.endTime), 'PPp')}
                  </td>
                  <td className="py-3 px-4 text-white text-right">
                    {(trip.distance / 1000).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-white text-right">
                    {(trip.duration / 3600000).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-white text-right">
                    {trip.averageSpeed.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-white text-right">
                    {trip.maxSpeed.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orgTrips.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No trips found for the selected date range</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

