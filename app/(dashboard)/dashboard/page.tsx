'use client';

import React from 'react';
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
import { Car, Users, Wrench, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

// Register Chart.js components
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

// Dashboard Card Component
const DashboardCard = ({ title, value, subtitle, icon, accentColor }: any) => (
  <div className="bg-white rounded-2xl min-w-[200px] w-[220px] p-5 flex justify-between items-center shadow-sm ">
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>

      <p className={`text-4xl font-bold  leading-tight`}>
        {value}
      </p>

      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>

    <div className={`${accentColor} p-3 rounded-full`}>
      <span className="text-red-500 text-xl">{icon}</span>
    </div>
  </div>
);


export default function Dashboard() {
  // Bar Chart Data
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [65, 45, 70, 55, 80, 90, 60, 50, 75, 65, 85, 95],
        backgroundColor: (ctx: any) => (ctx.dataIndex === 5 ? '#FF6B6B' : '#E5E7EB'),
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
      y: { display: false },
    },
  };

  // Line Chart Data
  const lineData = {
    labels: ['', '', '', '', '', '', ''],
    datasets: [
      {
        data: [30, 50, 20, 70, 40, 80, 60],
        borderColor: '#FBBF24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#FBBF24',
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { display: false } },
      y: { display: false },
    },
  };

  // Donut Chart Data
  const donutData = {
    datasets: [
      {
        data: [55, 45, 45],
        backgroundColor: ['#FF6B6B', '#FBBF24', '#EF4444'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const donutOptions = {
    plugins: { legend: { display: false } },
  };

  return (
    <div className="min-h-screen bg-gray-50 text-white p-6">
      <div className="max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-300">Dashboard</h1>

        {/* Top Cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <DashboardCard
            title="Available Vehicles"
            value="12"
            subtitle="Roadworthy and onsite"
            icon={<Car className="w-5 h-5" />}
            accentColor="bg-green-500"
          />
          <DashboardCard
            title="Vehicles in Use"
            value="8"
            subtitle="Currently on journey"
            icon={<Car className="w-5 h-5" />}
            accentColor="bg-blue-500"
          />
          <DashboardCard
            title="Unavailable Vehicles"
            value="3"
            subtitle="Mechanic or Unroadworthy"
            icon={<Wrench className="w-5 h-5" />}
            accentColor="bg-red-500"
          />
          <DashboardCard
            title="PMI's Due"
            value="5"
            subtitle="Next 5 Days"
            icon={<AlertCircle className="w-5 h-5" />}
            accentColor="bg-orange-500"
          />
          <DashboardCard
            title="MOT's Due"
            value="12"
            subtitle="Next 3 Months"
            icon={<Calendar className="w-5 h-5" />}
            accentColor="bg-purple-500"
          />
          <DashboardCard
            title="Drivers Onsite"
            value="15"
            subtitle="Clocked in not in journey"
            icon={<Users className="w-5 h-5" />}
            accentColor="bg-pink-500"
          />
          <DashboardCard
            title="Check Due"
            value="9"
            subtitle="Next 7 Days"
            icon={<CheckCircle className="w-5 h-5" />}
            accentColor="bg-yellow-500"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Stats */}
            <div className="bg-gray-100 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Total Customers</h3>
                  <p className="text-3xl font-bold">345,678</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">New User</p>
                  <p className="text-lg font-semibold text-green-400">49 ↑</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Growth</p>
                  <p className="text-lg font-semibold text-green-400">+10%</p>
                </div>
                <select className="bg-gray-700 text-white rounded px-3 py-1 text-sm">
                  <option>Month</option>
                </select>
              </div>
              <div className="h-48">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Profile */}
              <div className="bg-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">User Profile</h3>
                <div className="h-48">
                  <Doughnut data={donutData} options={donutOptions} />
                </div>
                <div className="flex justify-around mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Male 55%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Female 45%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Other 45%</span>
                  </div>
                </div>
              </div>

              {/* Statistic */}
              <div className="bg-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Statistic</h3>
                <div className="h-40">
                  <Line data={lineData} options={lineOptions} />
                </div>
                <div className="flex justify-between mt-4 text-sm">
                  <p className="text-green-400 font-semibold">This Week +20%</p>
                  <p className="text-yellow-400 font-semibold">Last Week +13%</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-orange-500">12,345</p>
                    <p className="text-xs text-gray-400">Impression</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400">5.4% than last year</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Server Status */}
            <div className="bg-gradient-to-b from-purple-900 to-gray-900 rounded-xl p-4 text-white">
              <h3 className="font-semibold mb-4">Server Status</h3>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm">Country</span>
                <span className="text-sm font-medium">Indonesia</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm">Domain</span>
                <span className="text-sm font-medium">website.com</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm">Speed</span>
                <span className="text-sm font-medium">2.0 mbps</span>
              </div>
              <div className="h-20 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-lg opacity-50"></div>
            </div>

            {/* Contacts */}
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Contacts</h3>
                <a href="#" className="text-orange-500 text-xs">View All</a>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['Tony', 'Karen', 'Jordan', 'Jack', 'Nadila', 'Johnny', 'Mantha', 'John'].map((name) => (
                  <div key={name} className="text-center">
                    <div className="w-10 h-10 bg-gray-600 rounded-full mx-auto mb-1"></div>
                    <p className="text-xs">{name}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex justify-between">
                  Messages <a href="#" className="text-orange-500 text-xs">View All</a>
                </h3>
                {[
                  { name: 'Samantha William', msg: 'Lorem ipsum dolor sit amet...' },
                  { name: 'Tony Soap', msg: 'Lorem ipsum dolor sit amet...' },
                  { name: 'Jordan Nico', msg: 'Lorem ipsum dolor sit amet...' },
                  { name: 'Nadila Adja', msg: 'Lorem ipsum dolor sit amet...' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">Recent Activity</h3>
                <button className="bg-orange-500 text-white px-3 py-1 rounded text-xs">Update</button>
              </div>
              {[
                { color: 'bg-orange-500', time: '2 Hour Ago', title: 'Transaction Assets', desc: 'Ab architecto provident ex accusantium deserunt.' },
                { color: 'bg-gray-600', time: '2 Hour Ago', title: 'New Email Register', desc: 'Ab architecto provident ex accusantium deserunt.' },
                { color: 'bg-yellow-500', time: '2 Hour Ago', title: 'Transaction Assets', desc: 'Ab architecto provident ex accusantium deserunt.' },
                { color: 'bg-orange-400', time: '2 Hour Ago', title: 'New Email Register', desc: 'Ab architecto provident ex accusantium deserunt.' },
              ].map((act, i) => (
                <div key={i} className="flex gap-3 mb-3 last:mb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${act.color}`}></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">{act.time}</p>
                    <p className="font-medium text-sm">{act.title}</p>
                    <p className="text-xs text-gray-500">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}