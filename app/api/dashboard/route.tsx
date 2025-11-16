// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Dummy dashboard data
  const dashboardData = {
    cards: [
      {
        id: 1,
        title: "Available Vehicles",
        value: "12",
        subtitle: "Roadworthy and onsite",
        type: "available"
      },
      {
        id: 2,
        title: "Vehicles in Use",
        value: "8",
        subtitle: "Currently on journey",
        type: "inUse"
      },
      {
        id: 3,
        title: "Unavailable Vehicles",
        value: "3",
        subtitle: "Mechanic or Unroadworthy",
        type: "unavailable"
      },
      {
        id: 4,
        title: "PMI's Due",
        value: "5",
        subtitle: "Next 5 Days",
        type: "pmiDue"
      },
      {
        id: 5,
        title: "MOT's Due",
        value: "12",
        subtitle: "Next 3 Months",
        type: "motDue"
      },
      {
        id: 6,
        title: "Drivers Onsite",
        value: "15",
        subtitle: "Clocked in not in journey",
        type: "driversOnsite"
      },
      {
        id: 7,
        title: "Check Due",
        value: "9",
        subtitle: "Next 7 Days",
        type: "checkDue"
      }
    ],
    totalNumbers: {
      total: "345,678",
      appointment: {
        value: 49,
        trend: "up"
      },
      growth: {
        value: 10,
        trend: "up"
      }
    },
    monthlyData: [
      { month: 'Jan', value: 65 },
      { month: 'Feb', value: 45 },
      { month: 'Mar', value: 70 },
      { month: 'Apr', value: 55 },
      { month: 'May', value: 80 },
      { month: 'Jun', value: 90 },
      { month: 'Jul', value: 60 },
      { month: 'Aug', value: 50 },
      { month: 'Sep', value: 75 },
      { month: 'Oct', value: 65 },
      { month: 'Nov', value: 85 },
      { month: 'Dec', value: 95 }
    ],
    vehicleDistribution: {
      onsite: 55,
      offsite: 45,
      onRoad: 45
    },
    fuelUsage: {
      weeklyData: [30, 50, 20, 70, 40, 80, 60],
      thisWeek: { value: 20, trend: "up" },
      lastWeek: { value: 13, trend: "up" },
      impression: 12345,
      yearComparison: 5.4
    },
    impressionData: [8000, 12345, 10000, 9000],
    recentDrivers: [
      { id: 1, name: 'Harris', avatar: '/avatars/harris.jpg' },
      { id: 2, name: 'Nadila', avatar: '/avatars/nadila.jpg' },
      { id: 3, name: 'George', avatar: '/avatars/george.jpg' },
      { id: 4, name: 'John', avatar: '/avatars/john.jpg' },
      { id: 5, name: 'Tony', avatar: '/avatars/tony.jpg' },
      { id: 6, name: 'Karen', avatar: '/avatars/karen.jpg' },
      { id: 7, name: 'Jordan', avatar: '/avatars/jordan.jpg' },
      { id: 8, name: 'Jack', avatar: '/avatars/jack.jpg' }
    ],
    messages: [
      {
        id: 1,
        name: 'Samantha William',
        message: 'Vehicle inspection completed for Fleet #234',
        time: '5 min ago',
        unread: true
      },
      {
        id: 2,
        name: 'Tony Soap',
        message: 'Requesting maintenance approval for repairs',
        time: '1 hour ago',
        unread: true
      },
      {
        id: 3,
        name: 'Jordan Nico',
        message: 'Route optimization report is ready for review',
        time: '2 hours ago',
        unread: false
      },
      {
        id: 4,
        name: 'Nadila Adja',
        message: 'Fuel efficiency metrics updated successfully',
        time: '3 hours ago',
        unread: false
      }
    ],
    taskActivity: [
      {
        id: 1,
        time: '2 Hour Ago',
        title: 'Transaction Assets',
        description: 'Vehicle #2345 completed maintenance check and returned to fleet',
        color: 'orange',
        priority: 'high'
      },
      {
        id: 2,
        time: '3 Hour Ago',
        title: 'New Driver Registration',
        description: 'New driver onboarding completed - License verified',
        color: 'gray',
        priority: 'medium'
      },
      {
        id: 3,
        time: '5 Hour Ago',
        title: 'Fleet Assignment',
        description: 'Route #789 assigned to driver Harris for delivery',
        color: 'yellow',
        priority: 'high'
      },
      {
        id: 4,
        time: '6 Hour Ago',
        title: 'Maintenance Alert',
        description: 'Scheduled PMI reminder sent to 5 vehicle owners',
        color: 'orange',
        priority: 'medium'
      }
    ]
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json({
    success: true,
    data: dashboardData,
    timestamp: new Date().toISOString()
  });
}

// Optional: POST endpoint for updating dashboard data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Here you would typically save to database
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard data updated successfully',
      data: body
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}