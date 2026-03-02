// ============================================
// FILE: app/dashboard/page.tsx
// ============================================
'use client';

import React, { useState, useEffect } from 'react';
import {
  Car, Users, Wrench, Calendar, AlertCircle, CheckCircle,
  Bell, TrendingUp, TrendingDown, Loader2, X, AlertTriangle,
  FileText, Shield, Truck, CheckSquare, XCircle, ArrowUpRight,
  ArrowDownLeft, UserCheck, UserX, Info, ChevronRight,
  FileWarning, CarFront, Settings, Activity,
  ToolCase, RefreshCw
} from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';
import { useRouter } from 'next/navigation';

// Import ShadCN Tooltip Components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
type HoverDetailItem = {
  id?: number | string;
  title?: string;
  deadline?: string;
  registration_number?: string;
  vehicle__id?: number | string;
  vehicle__registration_number?: string;
  user__id?: number | string;
  user__full_name?: string;
  mechanic__id?: number | string;
  mechanic__full_name?: string;
} | string;

interface IsoWeekData {
  date: string;
  iso_year: number;
  iso_week: number;
  iso_weekday: number;
  display: string;
}

interface Card {
  id: number;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  hoverDetails: HoverDetailItem[];
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
  yearComparison: number;
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

// Tooltip Content Component
const HoverDetailsContent: React.FC<{
  details: HoverDetailItem[];
  title: string;
}> = ({ details, title }) => {
  const router = useRouter();

  if (!details || details.length === 0) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">No additional details available</p>
      </div>
    );
  }

  const handleItemClick = (item: HoverDetailItem) => {
    if (typeof item === 'string') return;

    const id = item.id || item.vehicle__id || item.user__id || item.mechanic__id;
    if (!id) return;

    const lowerTitle = title.toLowerCase();

    // Navigation logic based on title or item properties
    if (lowerTitle.includes('vehicle') || lowerTitle.includes('pmi') || lowerTitle.includes('mot') || item.vehicle__id || item.registration_number) {
      router.push(`/dashboard/compliance-management/vehicle-management/${id}`);
    } else if (lowerTitle.includes('staff') || lowerTitle.includes('driver') || item.user__id) {
      router.push(`/dashboard/users/driver-profiles/${id}`);
    } else if (lowerTitle.includes('mechanic') || item.mechanic__id) {
      router.push(`/dashboard/users/all-other-staff/${id}`);
    } else if (lowerTitle.includes('task')) {
      // Default tasks to vehicle management if they have IDs that match the dashboard items
      router.push(`/dashboard/tasks/task-management/${id}`);
    }
  };

  // Check if the first item is an object or a string
  const hasObjectDetails = details.length > 0 && typeof details[0] === 'object';

  const renderContent = () => {
    if (hasObjectDetails) {
      return (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide border-b pb-1">
            Items ({details.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {(details as any[]).map((item, index) => {
              const itemTitle = item.title || item.registration_number || item.vehicle__registration_number || item.user__full_name || item.mechanic__full_name || "Detail item";

              return (
                <div
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col gap-1 p-2 rounded hover:bg-orange-50 cursor-pointer transition-colors group active:scale-[0.98]"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0 group-hover:bg-orange-500 transition-colors" />
                    <span className="text-sm text-gray-700 truncate group-hover:text-orange-700 font-medium">{itemTitle}</span>
                  </div>
                  {item.deadline && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-3">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {formatToDDMMYYYY(item.deadline)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide border-b pb-1">
            Items ({details.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {(details as string[]).map((item, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors group">
                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0 group-hover:bg-blue-500 transition-colors" />
                <span className="text-sm text-gray-700 truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
            Details
          </span>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {renderContent()}
      </div>
      <div className="mt-3 pt-2 border-t text-xs text-gray-400">
        Click items to view details
      </div>
    </div>
  );
};

// Icon mapping component
const IconComponent: React.FC<{ iconName: string; className?: string }> = ({ iconName, className }) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    'check-circle': <CheckCircle className={className} />,
    'wrench': <Wrench className={className} />,
    'file-text': <FileText className={className} />,
    'shield': <Shield className={className} />,
    'truck': <Truck className={className} />,
    'alert-triangle': <AlertTriangle className={className} />,
    'calendar': <Calendar className={className} />,
    'check-square': <CheckSquare className={className} />,
    'x-circle': <XCircle className={className} />,
    'arrow-up-right': <ArrowUpRight className={className} />,
    'arrow-down-left': <ArrowDownLeft className={className} />,
    'users': <Users className={className} />,
    'user-check': <UserCheck className={className} />,
    'user-x': <UserX className={className} />,
    'tool': <ToolCase className={className} />,
    'car': <Car className={className} />,
    'bell': <Bell className={className} />,
  };

  return iconMap[iconName] || <CheckCircle className={className} />;
};

const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  icon: string;
  hoverDetails: HoverDetailItem[];
  index: number;
}> = ({ title, value, subtitle, iconBg, iconColor, icon, hoverDetails, index }) => {
  const hasHoverDetails = hoverDetails && hoverDetails.length > 0;

  const getTooltipDelay = () => {
    if (Array.isArray(hoverDetails) && hoverDetails.length > 10) return 100;
    if (Array.isArray(hoverDetails) && hoverDetails.length > 5) return 50;
    return 0;
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={getTooltipDelay()}>
        <TooltipTrigger asChild>
          <div
            className={`relative w-[300px] rounded-xl p-4 border border-gray-200 transition-all duration-200 ${index === 0
              ? 'bg-white border-orange-300 shadow-orange-300 shadow hover:shadow-lg'
              : 'bg-white hover:shadow-md'
              } ${hasHoverDetails ? 'cursor-pointer hover:border-blue-300 active:scale-[0.98]' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-[11px] text-gray-600 mb-1.5`}>{title}</p>
                  {hasHoverDetails && (
                    <div className="relative group">
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Info className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        View details
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-3xl font-bold text-gray-900 mb-1 ${index === 0 ? "text-red-600" : ""}`}>
                  {value}
                </p>
                <p className="text-[10px] text-gray-400">{subtitle}</p>
              </div>
              <div className={`${iconBg} p-2.5 rounded-lg`}>
                <IconComponent iconName={icon} className={`w-5 h-5 ${iconColor}`} />
              </div>
            </div>

            {/* Hover Indicator */}
            {hasHoverDetails && (
              <div className="absolute inset-0 border-2 border-transparent rounded-xl group-hover:border-blue-300 transition-colors pointer-events-none" />
            )}
          </div>
        </TooltipTrigger>
        {hasHoverDetails && (
          <TooltipContent
            side="top"
            align="center"
            sideOffset={5}
            className="p-0 bg-white border border-gray-200 shadow-xl rounded-lg max-w-xs"
          >
            <HoverDetailsContent
              details={hoverDetails}
              title={title}
            />
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

// Add custom styles for scrollbar
const customStyles = `
@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
`;

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [isoWeekData, setIsoWeekData] = useState<IsoWeekData | null>(null);
  const cookies = useCookies().get("access_token");

  useEffect(() => {
    fetchDashboardData(false);
    fetchIsoWeekData();

    // Set up a single interval for both countdown and auto-refresh
    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData(true); // Trigger refresh when countdown hits 0
          return 30; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000); // Run every 1 second

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchIsoWeekData = async () => {
    try {
      const response = await fetch(`${API_URL}/globals/globals/iso-week/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies}`,
        },
      });
      if (!response.ok) return;
      const result = await response.json();
      setIsoWeekData(result);
    } catch (err) {
      console.error('Error fetching ISO week data:', err);
    }
  };

  const fetchDashboardData = async (isAutoRefresh: boolean = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch(`${API_URL}/dashboard-new/`, {
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
      if (isAutoRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
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
            onClick={() => fetchDashboardData(false)}
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
    <>
      <style jsx global>{customStyles}</style>
      <TooltipProvider>
        <div className="min-h-screen bg-white p-5">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <div className="flex items-center gap-3">
                {/* ISO Week Badge */}
                {isoWeekData && (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-default">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">{isoWeekData.display}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="center" sideOffset={6} className="p-0 bg-white border border-gray-200 shadow-lg rounded-lg">
                      <div className="p-3 min-w-[170px]">
                        <p className="text-xs font-semibold text-gray-700 mb-2 border-b pb-1.5">ISO Week Details</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">Date</span>
                            <span className="text-xs font-medium text-gray-800">{isoWeekData.date}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">ISO Year</span>
                            <span className="text-xs font-medium text-gray-800">{isoWeekData.iso_year}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">ISO Week</span>
                            <span className="text-xs font-medium text-gray-800">{isoWeekData.iso_week}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">Weekday</span>
                            <span className="text-xs font-medium text-gray-800">{isoWeekData.iso_weekday}</span>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Countdown Timer */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Next refresh in:</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 min-w-[3ch] text-center">
                    {countdown}s
                  </span>
                </div>

                {isRefreshing && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Refreshing...</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    fetchDashboardData(true);
                    setCountdown(30); // Reset countdown on manual refresh
                  }}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  title="Refresh dashboard data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
              {dashboardData.cards.map((card, index) => (
                <StatCard
                  key={card.id}
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  iconBg={card.iconBg}
                  iconColor={card.iconColor}
                  icon={card.icon}
                  hoverDetails={card.hoverDetails}
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
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${task.color === 'orange' ? 'bg-orange-500' :
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
      </TooltipProvider>
    </>
  );
}