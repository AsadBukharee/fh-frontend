import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Clock logs API working fine', data: [
    {
      "driverName": "John Doe",
      "driverId": "DRV001",
      "siteName": "Downtown Warehouse",
      "siteId": "SITE001",
      "date": "2025-01-20",
      "clockIn": "09:30",
      "clockOut": "17:30",
      "totalHours": "8.0"
    },
    {
      "driverName": "Jane Smith",
      "driverId": "DRV002",
      "siteName": "Eastside Depot",
      "siteId": "SITE002",
      "date": "2025-01-21",
      "clockIn": "08:45",
      "clockOut": "17:15",
      "totalHours": "8.5"
    },
    {
      "driverName": "Michael Brown",
      "driverId": "DRV003",
      "siteName": "North Hub",
      "siteId": "SITE003",
      "date": "2025-01-22",
      "clockIn": "09:00",
      "clockOut": "17:00",
      "totalHours": "8.0"
    },
    {
      "driverName": "Emily Davis",
      "driverId": "DRV004",
      "siteName": "West Terminal",
      "siteId": "SITE004",
      "date": "2025-01-23",
      "clockIn": "08:30",
      "clockOut": "16:45",
      "totalHours": "8.25"
    },
    {
      "driverName": "David Wilson",
      "driverId": "DRV005",
      "siteName": "Central Station",
      "siteId": "SITE005",
      "date": "2025-01-24",
      "clockIn": "09:15",
      "clockOut": "17:45",
      "totalHours": "8.5"
    },
    {
      "driverName": "Sarah Johnson",
      "driverId": "DRV006",
      "siteName": "South Yard",
      "siteId": "SITE006",
      "date": "2025-01-27",
      "clockIn": "08:50",
      "clockOut": "17:20",
      "totalHours": "8.5"
    },
    {
      "driverName": "Chris Lee",
      "driverId": "DRV007",
      "siteName": "Downtown Warehouse",
      "siteId": "SITE001",
      "date": "2025-01-28",
      "clockIn": "09:00",
      "clockOut": "16:30",
      "totalHours": "7.5"
    },
    {
      "driverName": "Anna Martinez",
      "driverId": "DRV008",
      "siteName": "Eastside Depot",
      "siteId": "SITE002",
      "date": "2025-01-29",
      "clockIn": "08:40",
      "clockOut": "17:10",
      "totalHours": "8.5"
    },
    {
      "driverName": "Robert Taylor",
      "driverId": "DRV009",
      "siteName": "North Hub",
      "siteId": "SITE003",
      "date": "2025-01-30",
      "clockIn": "09:20",
      "clockOut": "17:50",
      "totalHours": "8.5"
    },
    {
      "driverName": "Lisa Anderson",
      "driverId": "DRV010",
      "siteName": "West Terminal",
      "siteId": "SITE004",
      "date": "2025-01-31",
      "clockIn": "08:55",
      "clockOut": "17:25",
      "totalHours": "8.5"
    },
    {
      "driverName": "James Thomas",
      "driverId": "DRV011",
      "siteName": "Central Station",
      "siteId": "SITE005",
      "date": "2025-02-03",
      "clockIn": "09:10",
      "clockOut": "17:40",
      "totalHours": "8.5"
    },
    {
      "driverName": "Megan White",
      "driverId": "DRV012",
      "siteName": "South Yard",
      "siteId": "SITE006",
      "date": "2025-02-04",
      "clockIn": "08:30",
      "clockOut": "16:30",
      "totalHours": "8.0"
    },
    {
      "driverName": "Daniel Harris",
      "driverId": "DRV013",
      "siteName": "Downtown Warehouse",
      "siteId": "SITE001",
      "date": "2025-02-05",
      "clockIn": "09:00",
      "clockOut": "17:30",
      "totalHours": "8.5"
    },
    {
      "driverName": "Laura Clark",
      "driverId": "DRV014",
      "siteName": "Eastside Depot",
      "siteId": "SITE002",
      "date": "2025-02-06",
      "clockIn": "08:45",
      "clockOut": "17:15",
      "totalHours": "8.5"
    },
    {
      "driverName": "Steven Lewis",
      "driverId": "DRV015",
      "siteName": "North Hub",
      "siteId": "SITE003",
      "date": "2025-02-07",
      "clockIn": "09:30",
      "clockOut": "17:00",
      "totalHours": "7.5"
    },
    {
      "driverName": "Rachel Walker",
      "driverId": "DRV016",
      "siteName": "West Terminal",
      "siteId": "SITE004",
      "date": "2025-02-10",
      "clockIn": "08:50",
      "clockOut": "17:20",
      "totalHours": "8.5"
    },
    {
      "driverName": "Mark Hall",
      "driverId": "DRV017",
      "siteName": "Central Station",
      "siteId": "SITE005",
      "date": "2025-02-11",
      "clockIn": "09:15",
      "clockOut": "17:45",
      "totalHours": "8.5"
    },
    {
      "driverName": "Sophie Allen",
      "driverId": "DRV018",
      "siteName": "South Yard",
      "siteId": "SITE006",
      "date": "2025-02-12",
      "clockIn": "08:40",
      "clockOut": "17:10",
      "totalHours": "8.5"
    },
    {
      "driverName": "Thomas Young",
      "driverId": "DRV019",
      "siteName": "Downtown Warehouse",
      "siteId": "SITE001",
      "date": "2025-02-13",
      "clockIn": "09:00",
      "clockOut": "16:45",
      "totalHours": "7.75"
    },
    {
      "driverName": "Olivia King",
      "driverId": "DRV020",
      "siteName": "Eastside Depot",
      "siteId": "SITE002",
      "date": "2025-02-14",
      "clockIn": "08:55",
      "clockOut": "17:25",
      "totalHours": "8.5"
    },
    {
      "driverName": "Emma Green",
      "driverId": "DRV021",
      "siteName": "North Hub",
      "siteId": "SITE003",
      "date": "2025-01-20",
      "clockIn": "08:30",
      "clockOut": "16:30",
      "totalHours": "8.0"
    },
    {
      "driverName": "Liam Turner",
      "driverId": "DRV022",
      "siteName": "West Terminal",
      "siteId": "SITE004",
      "date": "2025-01-21",
      "clockIn": "09:00",
      "clockOut": "17:30",
      "totalHours": "8.5"
    },
    {
      "driverName": "Ava Scott",
      "driverId": "DRV023",
      "siteName": "Central Station",
      "siteId": "SITE005",
      "date": "2025-01-23",
      "clockIn": "08:45",
      "clockOut": "17:00",
      "totalHours": "8.25"
    },
    {
      "driverName": "Noah Adams",
      "driverId": "DRV024",
      "siteName": "South Yard",
      "siteId": "SITE006",
      "date": "2025-01-27",
      "clockIn": "09:15",
      "clockOut": "17:45",
      "totalHours": "8.5"
    },
    {
      "driverName": "Mia Carter",
      "driverId": "DRV025",
      "siteName": "Downtown Warehouse",
      "siteId": "SITE001",
      "date": "2025-01-29",
      "clockIn": "08:50",
      "clockOut": "16:50",
      "totalHours": "8.0"
    },
    {
      "driverName": "Ethan Brooks",
      "driverId": "DRV026",
      "siteName": "Eastside Depot",
      "siteId": "SITE002",
      "date": "2025-02-03",
      "clockIn": "09:20",
      "clockOut": "17:50",
      "totalHours": "8.5"
    },
    {
      "driverName": "Isabella Evans",
      "driverId": "DRV027",
      "siteName": "North Hub",
      "siteId": "SITE003",
      "date": "2025-02-05",
      "clockIn": "08:40",
      "clockOut": "17:10",
      "totalHours": "8.5"
    },
    {
      "driverName": "Lucas Parker",
      "driverId": "DRV028",
      "siteName": "West Terminal",
      "siteId": "SITE004",
      "date": "2025-02-07",
      "clockIn": "09:00",
      "clockOut": "16:30",
      "totalHours": "7.5"
    },
    {
      "driverName": "Chloe Reed",
      "driverId": "DRV029",
      "siteName": "Central Station",
      "siteId": "SITE005",
      "date": "2025-02-10",
      "clockIn": "08:55",
      "clockOut": "17:25",
      "totalHours": "8.5"
    },
    {
      "driverName": "Henry Ward",
      "driverId": "DRV030",
      "siteName": "South Yard",
      "siteId": "SITE006",
      "date": "2025-02-12",
      "clockIn": "09:10",
      "clockOut": "17:40",
      "totalHours": "8.5"
    }
  ] });
}