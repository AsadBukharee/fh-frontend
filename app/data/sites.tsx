export const sitesData=[
    {
      "name": "Construction Site Alpha",
      "status": "Active",
      "alerts": 5,
      "location": {
        "city": "Manchester, UK",
        "zipCode": "73640",
        "geofencing": {
          "latitude": 53.4808,
          "longitude": -2.2426
        }
      },
      "shifts": [
        { "name": "Early", "active": true },
        { "name": "Middle", "active": false },
        { "name": "Night", "active": true }
      ],
      "authorizedVehicles": 20,
      "staff": {
        "current": 21,
        "capacity": 20,
        "utilization": "105%",
        "breakdown": [
          { "role": "Drivers", "count": 15 },
          { "role": "Admin", "count": 2 },
          { "role": "Mechanic", "count": 1 },
          { "role": "Supervisors", "count": 2 },
          { "role": "Office Staff", "count": 1 }
        ]
      },
      "lastUpdated": "2024-01-15T09:30:00",
      "siteAlerts": {
        "message": "Site has 21 staff assigned but only 20 vehicles authorized, immediate action needed",
        "severity": "High",
        "lastUpdate": "2024-01-15T09:30:00"
      },
      "quickStats": {
        "status": "Active",
        "complianceStatus": "Over Capacity",
        "activeAlerts": 1
      },
      "quickActions": [
        { "name": "View Schedule", "enabled": true },
        { "name": "Vehicle Logs", "enabled": false }
      ]
    },
    {
      "name": "Construction Site Beta",
      "status": "On Hold",
      "alerts": 2,
      "location": {
        "city": "London, UK",
        "zipCode": "12345",
        "geofencing": {
          "latitude": 51.5074,
          "longitude": -0.1278
        }
      },
      "shifts": [
        { "name": "Early", "active": true },
        { "name": "Middle", "active": false },
        { "name": "Night", "active": false }
      ],
      "authorizedVehicles": 15,
      "staff": {
        "current": 12,
        "capacity": 15,
        "utilization": "80%",
        "breakdown": [
          { "role": "Drivers", "count": 8 },
          { "role": "Admin", "count": 3 },
          { "role": "Mechanic", "count": 1 }
        ]
      },
      "lastUpdated": "2024-02-10T14:20:00",
      "siteAlerts": {
        "message": "Low staff utilization detected",
        "severity": "Low",
        "lastUpdate": "2024-02-10T14:20:00"
      },
      "quickStats": {
        "status": "On Hold",
        "complianceStatus": "In Compliance",
        "activeAlerts": 0
      },
      "quickActions": [
        { "name": "View Schedule", "enabled": true },
        { "name": "Vehicle Logs", "enabled": false }
      ]
    },
    {
      "name": "Construction Site Gamma",
      "status": "Active",
      "alerts": 8,
      "location": {
        "city": "Birmingham, UK",
        "zipCode": "54321",
        "geofencing": {
          "latitude": 52.4862,
          "longitude": -1.8904
        }
      },
      "shifts": [
        { "name": "Early", "active": false },
        { "name": "Middle", "active": true },
        { "name": "Night", "active": true }
      ],
      "authorizedVehicles": 25,
      "staff": {
        "current": 30,
        "capacity": 28,
        "utilization": "107%",
        "breakdown": [
          { "role": "Drivers", "count": 20 },
          { "role": "Admin", "count": 5 },
          { "role": "Mechanic", "count": 5 }
        ]
      },
      "lastUpdated": "2024-03-05T11:15:00",
      "siteAlerts": {
        "message": "Overstaffed, adjust personnel immediately",
        "severity": "High",
        "lastUpdate": "2024-03-05T11:15:00"
      },
      "quickStats": {
        "status": "Active",
        "complianceStatus": "Over Capacity",
        "activeAlerts": 2
      },
      "quickActions": [
        { "name": "View Schedule", "enabled": true },
        { "name": "Vehicle Logs", "enabled": true }
      ]
    },
    {
      "name": "Construction Site Delta",
      "status": "Completed",
      "alerts": 0,
      "location": {
        "city": "Glasgow, UK",
        "zipCode": "67890",
        "geofencing": {
          "latitude": 55.8642,
          "longitude": -4.2518
        }
      },
      "shifts": [
        { "name": "Early", "active": true },
        { "name": "Middle", "active": false },
        { "name": "Night", "active": false }
      ],
      "authorizedVehicles": 10,
      "staff": {
        "current": 5,
        "capacity": 10,
        "utilization": "50%",
        "breakdown": [
          { "role": "Drivers", "count": 3 },
          { "role": "Admin", "count": 2 },
          { "role": "Mechanic", "count": 0 }
        ]
      },
      "lastUpdated": "2024-04-20T16:45:00",
      "siteAlerts": {
        "message": "No alerts",
        "severity": "None",
        "lastUpdate": "2024-04-20T16:45:00"
      },
      "quickStats": {
        "status": "Completed",
        "complianceStatus": "In Compliance",
        "activeAlerts": 0
      },
      "quickActions": [
        { "name": "View Schedule", "enabled": false },
        { "name": "Vehicle Logs", "enabled": true }
      ]
    },
    {
      "name": "Construction Site Epsilon",
      "status": "Active",
      "alerts": 3,
      "location": {
        "city": "Liverpool, UK",
        "zipCode": "45678",
        "geofencing": {
          "latitude": 53.4084,
          "longitude": -2.9916
        }
      },
      "shifts": [
        { "name": "Early", "active": true },
        { "name": "Middle", "active": true },
        { "name": "Night", "active": false }
      ],
      "authorizedVehicles": 18,
      "staff": {
        "current": 16,
        "capacity": 20,
        "utilization": "80%",
        "breakdown": [
          { "role": "Drivers", "count": 10 },
          { "role": "Admin", "count": 4 },
          { "role": "Mechanic", "count": 2 }
        ]
      },
      "lastUpdated": "2024-05-12T08:00:00",
      "siteAlerts": {
        "message": "Moderate staff utilization",
        "severity": "Medium",
        "lastUpdate": "2024-05-12T08:00:00"
      },
      "quickStats": {
        "status": "Active",
        "complianceStatus": "In Compliance",
        "activeAlerts": 1
      },
      "quickActions": [
        { "name": "View Schedule", "enabled": true },
        { "name": "Vehicle Logs", "enabled": false }
      ]
    }
  ]