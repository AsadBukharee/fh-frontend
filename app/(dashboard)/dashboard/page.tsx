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
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import Link from 'next/link';

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
    available: { icon: <Car className="w-6 h-6" />, accentColor: 'bg-pink-50', iconColor: 'text-pink-600' },
    inUse: { icon: <Car className="w-6 h-6" />, accentColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    unavailable: { icon: <Wrench className="w-6 h-6" />, accentColor: 'bg-red-50', iconColor: 'text-red-600' },
    pmiDue: { icon: <AlertCircle className="w-6 h-6" />, accentColor: 'bg-orange-50', iconColor: 'text-orange-600' },
    motDue: { icon: <Calendar className="w-6 h-6" />, accentColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    driversOnsite: { icon: <Users className="w-6 h-6" />, accentColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    checkDue: { icon: <CheckCircle className="w-6 h-6" />, accentColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  };
  return configs[type] || configs.available;
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token=useCookies().get("access_token")

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard-new/`,{
        headers: {
          'Authorization': `Bearer ${token}`,
        },

      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
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
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">Warning</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  // Monthly Bar Chart - Highlight current month (Nov)
  const barData = {
    labels: dashboardData.monthlyData.map((d: any) => d.month),
    datasets: [{
      data: dashboardData.monthlyData.map((d: any) => d.value),
      backgroundColor: (ctx: any) => {
        const month = dashboardData.monthlyData[ctx.dataIndex].month;
        return month === 'Nov' ? '#FF6B6B' : '#F3F4F6';
      },
      borderRadius: 8,
      barThickness: 20,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 11 } }, border: { display: false } },
      y: { display: false },
    },
  };

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: dashboardData.fuelUsage.weeklyData,
      borderColor: '#FF6B6B',
      backgroundColor: 'rgba(255, 107, 107, 0.05)',
      tension: 0.4,
      pointBackgroundColor: '#FF6B6B',
      pointRadius: 4,
      borderWidth: 2.5,
      fill: true,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' }, border: { display: false } },
      y: { display: false },
    },
  };

  const donutData = {
    labels: ['Onsite', 'Offsite', 'On Road'],
    datasets: [{
      data: [
        dashboardData.vehicleDistribution.onsite,
        dashboardData.vehicleDistribution.offsite,
        dashboardData.vehicleDistribution.onRoad
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      cutout: '68%',
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const impressionData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      data: dashboardData.impressionData,
      backgroundColor: (ctx: any) => ctx.dataIndex === 1 ? '#FF6B6B' : '#FEE2E2',
      borderRadius: 8,
      barThickness: 32,
    }],
  };

  const impressionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { display: false } },
  };

  const getActivityColor = (color: string) => {
    const colors: any = {
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500',
    };
    return colors[color] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900"> Dashboard</h1>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
          >
            <Loader2 className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-5 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Total Numbers + Monthly Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Total Appointments</h3>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.totalNumbers.total}</p>
                </div>
                <div className="flex gap-8 text-sm">
                  <div>
                    <p className="text-gray-500">Appointment</p>
                    <p className={`text-xl font-bold ${dashboardData.totalNumbers.appointment.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.totalNumbers.appointment.value}
                      {dashboardData.totalNumbers.appointment.trend === 'up' ? ' ↑' : ' ↓'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Growth</p>
                    <p className={`text-xl font-bold ${dashboardData.totalNumbers.growth.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.totalNumbers.growth.value}%
                      {dashboardData.totalNumbers.growth.trend === 'up' ? ' ↑' : ' ↓'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            {/* Vehicle Distribution + Fuel Usage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Donut Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Vehicle Distribution</h3>
                <div className="h-56 flex items-center justify-center">
                  <div className="w-64 h-64">
                    <Doughnut data={donutData} options={donutOptions} />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {['Onsite', 'Offsite', 'On Road'].map((label, i) => (
                    <div key={label} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {i === 0 ? dashboardData.vehicleDistribution.onsite :
                         i === 1 ? dashboardData.vehicleDistribution.offsite :
                         dashboardData.vehicleDistribution.onRoad}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuel Usage */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Fuel Usage (This Week)</h3>
                <div className="h-48">
                  <Line data={lineData} options={lineOptions} />
                </div>
                <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
                  <div>
                    <p className="text-gray-500">This Week</p>
                    <p className={`text-lg font-bold ${dashboardData.fuelUsage.thisWeek.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.fuelUsage.thisWeek.trend === 'up' ? '+' : '-'}{dashboardData.fuelUsage.thisWeek.value}%
                      {dashboardData.fuelUsage.thisWeek.trend === 'up' ? ' ↑' : ' ↓'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Week</p>
                    <p className={`text-lg font-bold ${dashboardData.fuelUsage.lastWeek.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.fuelUsage.lastWeek.trend === 'up' ? '+' : '-'}{dashboardData.fuelUsage.lastWeek.value}%
                      {dashboardData.fuelUsage.lastWeek.trend === 'up' ? ' ↑' : ' ↓'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Year-over-Year</p>
                  <p className={`text-2xl font-bold ${dashboardData.fuelUsage.yearComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.fuelUsage.yearComparison >= 0 ? '+' : ''}{dashboardData.fuelUsage.yearComparison}%
                  </p>
                  <div className="h-20 mt-4">
                    <Bar data={impressionData} options={impressionOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity */}
          <div className="space-y-8">
            {/* Recent Drivers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-gray-800">Recent Drivers</h3>
                <a href="#" className="text-orange-500 text-sm font-medium hover:underline">View All</a>
              </div>
              {dashboardData.recentDrivers.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {dashboardData.recentDrivers.map((driver: any) => (
                    <div key={driver.id} className="text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                        {driver.name.charAt(0)}
                      </div>
                      <p className="text-xs text-gray-700 font-medium truncate">{driver.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 text-sm">No drivers recently active</p>
              )}
            </div>

            {/* Messages */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-gray-800">Messages</h3>
                <a href="#" className="text-orange-500 text-sm font-medium hover:underline">View All</a>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.messages.map((msg: any) => (
                  <div key={msg.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                      {msg.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-3">
                        <p className="font-medium text-gray-900 text-sm">{msg.name}</p>
                        {msg.unread && <span className="w-2 h-2 bg-orange-500 rounded-full mt-1"></span>}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-gray-800">Task Activity</h3>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Update
                </button>
              </div>
              <div className="space-y-5">
                {dashboardData.taskActivity.length > 0 ? (
                  dashboardData.taskActivity.map((task: any) => (
                    <Link href={`/dashboard/tasks/task-management/${task.id}`} key={task.id} className="flex gap-4">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getActivityColor(task.color)}`} />
                      <div>
                        <p className="text-xs text-gray-500">{task.time}</p>
                        <p className="font-medium text-gray-900 mt-1">{task.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8 text-sm">No pending tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}