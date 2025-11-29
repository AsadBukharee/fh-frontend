// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network

    const dashboardData = {
      cards: [
        {
          id: 1,
          title: 'Total Tasks Due Today',
          value: '68',
          subtitle: 'All tasks including all in dashboard metrics shown here so total count of all',
          icon: 'check-circle',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
        },
        {
          id: 2,
          title: 'PMIs Due Today',
          value: '12',
          subtitle: 'Preventive Maintenance Inspections due today',
          icon: 'wrench',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
        },
        {
          id: 3,
          title: 'MOTs Due Today',
          value: '5',
          subtitle: 'MOT tests due today',
          icon: 'file-text',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
        },
        {
          id: 4,
          title: 'Audit Checks Due Today',
          value: '51',
          subtitle: 'Valet check, Tyre check, Equipment check, Maintenance provider audit, OCRS checks',
          icon: 'shield',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
        },
        {
          id: 5,
          title: 'Available Vehicles',
          value: '156',
          subtitle: 'Total vehicles ready for use',
          icon: 'truck',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        {
          id: 6,
          title: 'Vehicles VOR\'d',
          value: '19',
          subtitle: 'Vehicles Off Road / Under Repair',
          icon: 'alert-triangle',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
        },
        {
          id: 7,
          title: 'PMIs Due Next 7 Days',
          value: '38',
          subtitle: 'Upcoming PMI schedule',
          icon: 'calendar',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
        {
          id: 8,
          title: 'MOTs Due Next 7 Days',
          value: '14',
          subtitle: 'MOTs scheduled in next 7 days',
          icon: 'calendar',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
        },
        {
          id: 9,
          title: 'Daily Passed Walkarounds',
          value: '142',
          subtitle: 'Successful vehicle checks today',
          icon: 'check-square',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        {
          id: 10,
          title: 'Daily Failed Walkarounds',
          value: '8',
          subtitle: 'Failed vehicle inspections',
          icon: 'x-circle',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
        },
        {
          id: 11,
          title: 'Daily SUs Out Count',
          value: '89',
          subtitle: 'Service Units currently out',
          icon: 'arrow-up-right',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
        },
        {
          id: 12,
          title: 'Daily SUs In Count',
          value: '87',
          subtitle: 'Service Units returned today',
          icon: 'arrow-down-left',
          iconBg: 'bg-teal-100',
          iconColor: 'text-teal-600',
        },
        {
          id: 13,
          title: 'Daily Staff Count',
          value: '94',
          subtitle: 'Total staff on duty today',
          icon: 'users',
          iconBg: 'bg-pink-100',
          iconColor: 'text-pink-600',
        },
        {
          id: 14,
          title: 'Drivers Onsite',
          value: '67',
          subtitle: 'Drivers currently at base',
          icon: 'user-check',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
        },
        {
          id: 15,
          title: 'Drivers Offsite',
          value: '27',
          subtitle: 'Drivers on jobs or away',
          icon: 'user-x',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
        },
        {
          id: 16,
          title: 'Mechanic Jobs Due Today',
          value: '23',
          subtitle: 'Workshop jobs scheduled for today',
          icon: 'tool',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
        },
      ],
      
      totalAppointments: {
        total: 345678,
        appointment: 49,
        growth: 49,
        monthlyData: [
          { month: 'Jan', value: 30 },
          { month: 'Feb', value: 45 },
          { month: 'Mar', value: 35 },
          { month: 'Apr', value: 50 },
          { month: 'May', value: 20 },
          { month: 'Jun', value: 85 },
          { month: 'Jul', value: 40 },
          { month: 'Aug', value: 30 },
          { month: 'Sep', value: 45 },
          { month: 'Oct', value: 50 },
          { month: 'Nov', value: 60 },
          { month: 'Dec', value: 35 },
        ]
      },
      vehicleDistribution: {
        onsite: 35,
        offsite: 45,
        onRoad: 53
      },
      fuelUsage: {
        thisWeek: 20,
        lastWeek: 13,
        weeklyData: [20, 40, 30, 50, 35, 60, 45],
        impressionData: [60, 85, 50, 70]
      },
      sickLeaves: {
        thisWeek: 20,
        lastWeek: 13,
        impressionValue: 12365
      },
      recentDrivers: [
        { id: 1, name: 'Tanya' },
        { id: 2, name: 'Haresh' },
        { id: 3, name: 'Jordan' },
        { id: 4, name: 'Jack' },
        { id: 5, name: 'Emma' },
        { id: 6, name: 'Liam' },
        { id: 7, name: 'Olivia' },
        { id: 8, name: 'Noah' },
      ],
      messages: [
        { id: 1, name: 'Samantha William', message: 'Lorem ipsum dolor sit amet...', time: '12:45', unread: true },
        { id: 2, name: 'Tony Soap', message: 'Lorem ipsum dolor sit amet...', time: '10:25', unread: false },
        { id: 3, name: 'Jordan Nico', message: 'Lorem ipsum dolor sit amet...', time: '08:54', unread: false },
        { id: 4, name: 'Nadila Adja', message: 'Lorem ipsum dolor sit amet...', time: 'Yesterday', unread: false },
      ],
      taskActivity: [
        { id: 1, title: 'Transaction Failed', description: 'Payment from #12345 failed', time: '2 Hour Ago', color: 'orange' },
        { id: 2, title: 'New User Registered', description: 'New user registered', time: '2 Hour Ago', color: 'black' },
        { id: 3, title: 'Transaction Failed', description: 'Payment from #12345 failed', time: '2 Hour Ago', color: 'yellow' },
        { id: 4, title: 'New User Registered', description: 'New user registered', time: '2 Hour Ago', color: 'orange' },
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}