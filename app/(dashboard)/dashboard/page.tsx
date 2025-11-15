'use client';

import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Car, Users, Wrench, Calendar, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardCard = ({ title, value, subtitle, icon, accentColor, iconColor }: any) => (
  <div className="bg-white rounded-2xl min-w-[200px] w-[220px] p-5 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
    <div>
      <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
    <div className={`${accentColor} p-3 rounded-xl`}>
      <span className={`${iconColor}`}>{icon}</span>
    </div>
  </div>
);

const getCardConfig = (type: string) => {
  const configs: any = {
    available: { icon: <Car className="w-5 h-5" />, accentColor: 'bg-pink-50', iconColor: 'text-pink-500' },
    inUse: { icon: <Car className="w-5 h-5" />, accentColor: 'bg-pink-50', iconColor: 'text-pink-500' },
    unavailable: { icon: <Wrench className="w-5 h-5" />, accentColor: 'bg-pink-50', iconColor: 'text-pink-500' },
    pmiDue: { icon: <AlertCircle className="w-5 h-5" />, accentColor: 'bg-orange-50', iconColor: 'text-orange-500' },
    motDue: { icon: <Calendar className="w-5 h-5" />, accentColor: 'bg-purple-50', iconColor: 'text-purple-500' },
    driversOnsite: { icon: <Users className="w-5 h-5" />, accentColor: 'bg-blue-50', iconColor: 'text-blue-500' },
    checkDue: { icon: <CheckCircle className="w-5 h-5" />, accentColor: 'bg-yellow-50', iconColor: 'text-yellow-500' },
  };
  return configs[type] || configs.available;
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const result = await response.json();
      setDashboardData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const barData = {
    labels: dashboardData.monthlyData.map((d: any) => d.month),
    datasets: [
      {
        data: dashboardData.monthlyData.map((d: any) => d.value),
        backgroundColor: (ctx: any) => (ctx.dataIndex === 5 ? '#FF6B6B' : '#F3F4F6'),
        borderRadius: 8,
        barThickness: 20,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#9CA3AF', font: { size: 11 } },
        border: { display: false }
      },
      y: { display: false },
    },
  };

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: dashboardData.fuelUsage.weeklyData,
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.05)',
        tension: 0.4,
        pointBackgroundColor: '#FF6B6B',
        pointRadius: 3,
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 10 } }, border: { display: false } },
      y: { display: false },
    },
  };

  const donutData = {
    labels: ['Onsite', 'Offsite', 'On Road'],
    datasets: [
      {
        data: [
          dashboardData.vehicleDistribution.onsite,
          dashboardData.vehicleDistribution.offsite,
          dashboardData.vehicleDistribution.onRoad
        ],
        backgroundColor: ['#FF6B6B', '#FBBF24', '#F97316'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { enabled: true }
    },
  };

  const impressionData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        data: dashboardData.impressionData,
        backgroundColor: (ctx: any) => (ctx.dataIndex === 1 ? '#FF6B6B' : '#FFE4E4'),
        borderRadius: 6,
        barThickness: 40,
      },
    ],
  };

  const impressionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  const getActivityColor = (color: string) => {
    const colors: any = {
      orange: 'bg-orange-500',
      gray: 'bg-gray-800',
      yellow: 'bg-yellow-500',
    };
    return colors[color] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button 
            onClick={fetchDashboardData}
            className="text-sm text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {dashboardData.cards.map((card: any) => {
            const config = getCardConfig(card.type);
            return (
              <DashboardCard
                key={card.id}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={config.icon}
                accentColor={config.accentColor}
                iconColor={config.iconColor}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">Total Numbers</h3>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.totalNumbers.total}</p>
                </div>
                <div className="flex gap-8 items-center">
                  <div>
                    <p className="text-sm text-gray-500">Appointment</p>
                    <p className="text-lg font-semibold text-green-500">
                      {dashboardData.totalNumbers.appointment.value} ↑
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Period</p>
                    <select className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mt-1">
                      <option>Month</option>
                      <option>Week</option>
                      <option>Year</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="h-56">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Onsite/Offsite Vehicles</h3>
                <div className="h-48 flex items-center justify-center">
                  <div className="w-48 h-48">
                    <Doughnut data={donutData} options={donutOptions} />
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm text-gray-700">Onsite</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {dashboardData.vehicleDistribution.onsite}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span className="text-sm text-gray-700">Offsite</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {dashboardData.vehicleDistribution.offsite}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-gray-700">On Road</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {dashboardData.vehicleDistribution.onRoad}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Fuel Usage</h3>
                <div className="h-40">
                  <Line data={lineData} options={lineOptions} />
                </div>
                <div className="flex justify-between mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">This Week </span>
                    <span className="text-green-500 font-semibold">
                      +{dashboardData.fuelUsage.thisWeek.value}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Week </span>
                    <span className="text-green-500 font-semibold">
                      +{dashboardData.fuelUsage.lastWeek.value}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Impression</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData.fuelUsage.impression.toLocaleString()}
                      </p>
                      <p className="text-sm text-orange-500 font-medium">
                        {dashboardData.fuelUsage.yearComparison}% than last year
                      </p>
                    </div>
                  </div>
                  <div className="h-16 mt-4">
                    <Bar data={impressionData} options={impressionOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 text-base">Recent Drivers</h3>
                <a href="#" className="text-orange-500 text-xs font-medium hover:text-orange-600">View All</a>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {dashboardData.recentDrivers.map((driver: any) => (
                  <div key={driver.id} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {driver.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium">{driver.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 text-base">Messages</h3>
                <a href="#" className="text-orange-500 text-xs font-medium hover:text-orange-600">View All</a>
              </div>
              <div className="space-y-3">
                {dashboardData.messages.map((msg: any) => (
                  <div key={msg.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {msg.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900">{msg.name}</p>
                        {msg.unread && (
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 text-base">Task Activity</h3>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Update
                </button>
              </div>
              <div className="space-y-4">
                {dashboardData.taskActivity.map((task: any) => (
                  <div key={task.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityColor(task.color)}`}></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">{task.time}</p>
                      <p className="font-medium text-sm text-gray-900 mb-1">{task.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}