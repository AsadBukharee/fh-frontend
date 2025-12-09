// ============================================
// FILE: app/dashboard/page.tsx
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import { Car, Users, Wrench, Calendar, AlertCircle, CheckCircle, Bell, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

// Types
interface Card {
  id: number;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

interface MonthlyData {
  month: string;
  value: number;
}

interface TotalAppointments {
  total: number;
  appointment: number;
  growth: number;
  monthlyData: MonthlyData[];
}

interface VehicleDistribution {
  onsite: number;
  offsite: number;
  onRoad: number;
}

interface FuelUsage {
  thisWeek: number;
  lastWeek: number;
  weeklyData: number[];
  impressionData: number[];
}

interface SickLeaves {
  thisWeek: number;
  lastWeek: number;
  impressionValue: number;
}

interface Driver {
  id: number;
  name: string;
}

interface Message {
  id: number;
  name: string;
  message: string;
  time: string;
  unread: boolean;
}

interface TaskActivity {
  id: number;
  title: string;
  description: string;
  time: string;
  color: string;
}

interface DashboardData {
  cards: Card[];
  totalAppointments: TotalAppointments;
  vehicleDistribution: VehicleDistribution;
  fuelUsage: FuelUsage;
  sickLeaves: SickLeaves;
  recentDrivers: Driver[];
  messages: Message[];
  taskActivity: TaskActivity[];
}

const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  index: number; // Add index prop
}> = ({ title, value, subtitle, iconBg, iconColor, index }) => {
  return (
    <div 
      className={`w-[300px] rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow ${
        index === 0 ? 'bg-gray-200' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] text-gray-600 mb-1.5">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-[10px] text-gray-400">{subtitle}</p>
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg`}>
          <Users className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between h-48 gap-1.5 px-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1">
          <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
            <div 
              className={`w-full rounded-t transition-all ${item.month === 'Jun' ? 'bg-orange-500' : 'bg-gray-200'}`}
              style={{ height: `${(item.value / maxValue) * 100}%`, maxWidth: '20px' }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2">{item.month}</p>
        </div>
      ))}
    </div>
  );
};

const DonutChart: React.FC<{ onsite: number; offsite: number; onRoad: number }> = ({ onsite, offsite, onRoad }) => {
  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="35" fill="none" stroke="#EF4444" strokeWidth="16" 
          strokeDasharray={`${onRoad * 2.2} 220`} 
          strokeDashoffset="0" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#F59E0B" strokeWidth="16" 
          strokeDasharray={`${offsite * 2.2} 220`} 
          strokeDashoffset={`-${onRoad * 2.2}`} />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#10B981" strokeWidth="16" 
          strokeDasharray={`${onsite * 2.2} 220`} 
          strokeDashoffset={`-${(onRoad + offsite) * 2.2}`} />
      </svg>
    </div>
  );
};

const LineChart: React.FC<{ data: number[]; color?: string }> = ({ data, color = "#F59E0B" }) => {
  const maxValue = Math.max(...data);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return (
    <div className="relative">
      <div className="h-28">
        <svg className="w-full h-full" viewBox="0 0 280 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M 0,${100 - (data[0] / maxValue) * 70} ${data.map((value, i) => `L ${i * 40},${100 - (value / maxValue) * 70}`).join(' ')} L 280,100 L 0,100 Z`}
            fill={`url(#gradient-${color})`}
          />
          <polyline
            points={data.map((value, i) => `${i * 40},${100 - (value / maxValue) * 70}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
          />
          {data.map((value, i) => (
            <circle
              key={i}
              cx={i * 40}
              cy={100 - (value / maxValue) * 70}
              r="3.5"
              fill={color}
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-2 px-1">
        {labels.map((label, i) => (
          <span key={i} className="text-[10px] text-gray-400">{label}</span>
        ))}
      </div>
    </div>
  );
};

const MiniBarChart: React.FC<{ data: number[] }> = ({ data }) => {
  const maxValue = Math.max(...data);
  
  return (
    <div className="flex items-end justify-between h-16 gap-1.5">
      {data.map((value, idx) => (
        <div 
          key={idx}
          className={`flex-1 rounded-t ${idx === 0 ? 'bg-orange-500' : 'bg-orange-200'}`}
          style={{ height: `${(value / maxValue) * 100}%` }}
        />
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cookies=useCookies().get("access_token")

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard-new/`,{
 headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies}`,
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center border border-gray-200">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
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

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Stats Cards Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
  {dashboardData.cards.map((card, index) => (
    <StatCard
      key={index}
      title={card.title}
      value={card.value}
      subtitle={card.subtitle}
      iconBg={card.iconBg}
      iconColor={card.iconColor}
      index={index}
    />
  ))}
</div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column - Main Charts */}
          <div className="lg:col-span-2 space-y-5">
            {/* Total Appointments */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total SU Numbers</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.totalAppointments.total.toLocaleString()}</p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Appointment</p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-xl font-bold text-emerald-500">{dashboardData.totalAppointments.appointment}</p>
                      <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Growth</p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-xl font-bold text-emerald-500">{dashboardData.totalAppointments.growth}</p>
                      <div className="w-4 h-4 bg-emerald-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Month</h3>
                <button className="text-sm text-gray-400">▼</button>
              </div>
              <BarChart data={dashboardData.totalAppointments.monthlyData} />
            </div>

            {/* Bottom Row Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Onsite/Offsite Vehicles */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Onsite/Offsite Vehicles</h3>
                <DonutChart 
                  onsite={dashboardData.vehicleDistribution.onsite}
                  offsite={dashboardData.vehicleDistribution.offsite}
                  onRoad={dashboardData.vehicleDistribution.onRoad}
                />
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-600">Onsite</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dashboardData.vehicleDistribution.onsite}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs text-gray-600">Offsite</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dashboardData.vehicleDistribution.offsite}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-gray-600">On Road</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dashboardData.vehicleDistribution.onRoad}%</span>
                  </div>
                </div>
              </div>

              {/* Fuel Usage */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Fuel Usage</h3>
                <LineChart data={dashboardData.fuelUsage.weeklyData} color="#F59E0B" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">This Week</p>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold text-emerald-500">+ {dashboardData.fuelUsage.thisWeek}%</span>
                      <div className="w-3.5 h-3.5 bg-emerald-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Week</p>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold text-emerald-500">+ {dashboardData.fuelUsage.lastWeek}%</span>
                      <div className="w-3.5 h-3.5 bg-emerald-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Impression</p>
                  <p className="text-xl font-bold text-gray-900 mb-3">{dashboardData.sickLeaves.impressionValue.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 mb-2">300k more than last week</p>
                  <MiniBarChart data={dashboardData.fuelUsage.impressionData} />
                </div>
              </div>

              {/* Sick Leaves */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Sick Leaves</h3>
                <LineChart data={[20, 35, 30, 45, 40, 50, 45]} color="#F59E0B" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">This Week</p>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold text-emerald-500">+ {dashboardData.sickLeaves.thisWeek}%</span>
                      <div className="w-3.5 h-3.5 bg-emerald-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Week</p>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold text-emerald-500">+ {dashboardData.sickLeaves.lastWeek}%</span>
                      <div className="w-3.5 h-3.5 bg-emerald-100 rounded flex items-center justify-center">
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Recent Drivers */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Recent Drivers</h3>
                <a href="#" className="text-xs text-orange-500 hover:underline">View All</a>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {dashboardData.recentDrivers.map((driver) => (
                  <div key={driver.id} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {driver.name.charAt(0)}
                    </div>
                    <p className="text-[10px] text-gray-700 truncate font-medium">{driver.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Messages</h3>
                <a href="#" className="text-xs text-orange-500 hover:underline">View All</a>
              </div>
              <div className="space-y-3">
                {dashboardData.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {msg.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{msg.name}</p>
                        {msg.unread && <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">{msg.message}</p>
                      <p className="text-[10px] text-gray-400">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Activity */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Task Activity</h3>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  Update
                </button>
              </div>
              <div className="space-y-4">
                {dashboardData.taskActivity.map((task) => (
                  <div key={task.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      task.color === 'orange' ? 'bg-orange-500' : 
                      task.color === 'yellow' ? 'bg-yellow-400' : 
                      'bg-gray-800'
                    }`} />
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">{task.time}</p>
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{task.title}</p>
                      <p className="text-xs text-gray-600">{task.description}</p>
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

