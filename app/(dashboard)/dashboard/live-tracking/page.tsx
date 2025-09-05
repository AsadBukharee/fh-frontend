// "use client"

// import { useState, useEffect } from "react"
// import { Loader2, RefreshCw, MapPin, Car } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { VehicleGrid } from "@/components/tracking/Map-grid"
// import { VehicleMap } from "@/components/tracking/vehicle-map"

// interface Vehicle {
//   id: number
//   registration: string
//   alias?: string
//   vehicle_type: string
//   vehicle_status: {
//     last_event: string
//     location: {
//       latitude: number
//       longitude: number
//     }
//     event_date: string
//   }
//   engine_hours: {
//     engine_time_hours: number
//   }
//   batteryLevel: number
//   vehicle_settings: {
//     vehicle_icon_colour: string
//   }
// }

// export default function VehicleTracker() {
//   const [vehicles, setVehicles] = useState<Vehicle[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

//   const fetchVehicles = async () => {
//     try {
//       setLoading(true)
//       setError(null)

//       const response = await fetch("https://api.qaifn.co.uk/api/v1/vehicle/for-account", {
//         headers: {
//           Authorization: "Bearer 1c4b2b38-062f-4fce-b7ee-53734424a69f", // User needs to add their token
//           "Content-Type": "application/json",
//         },
//       })

//       if (!response.ok) {
//         throw new Error(`API Error: ${response.status}`)
//       }

//       const data = await response.json()
//       setVehicles(data.vehicles || [])
//       setLastUpdated(new Date())
//     } catch (err) {
//       console.error("[v0] API fetch error:", err)
//       setError(err instanceof Error ? err.message : "Failed to fetch vehicles")

//       setVehicles([
//         {
//           id: 1,
//           registration: "ABC123",
//           alias: "Fleet Vehicle 1",
//           vehicle_type: "Van",
//           vehicle_status: {
//             last_event: "IGNITION_ON",
//             location: { latitude: 51.5074, longitude: -0.1278 },
//             event_date: "2024-01-15T10:30:00Z",
//           },
//           engine_hours: { engine_time_hours: 1250 },
//           batteryLevel: 85,
//           vehicle_settings: { vehicle_icon_colour: "blue" },
//         },
//         {
//           id: 2,
//           registration: "XYZ789",
//           alias: "Fleet Vehicle 2",
//           vehicle_type: "Truck",
//           vehicle_status: {
//             last_event: "IGNITION_OFF",
//             location: { latitude: 51.5155, longitude: -0.0922 },
//             event_date: "2024-01-15T09:45:00Z",
//           },
//           engine_hours: { engine_time_hours: 2100 },
//           batteryLevel: 92,
//           vehicle_settings: { vehicle_icon_colour: "red" },
//         },
//       ])
//       setLastUpdated(new Date())
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => {
//     fetchVehicles()

//     const interval = setInterval(fetchVehicles, 30000)
//     return () => clearInterval(interval)
//   }, [])

//   if (loading && vehicles.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//         <div className="text-center space-y-4">
//           <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
//           <p className="text-lg text-gray-600">Loading vehicle data...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="bg-white shadow-sm border-b">
//         <div className="mx-auto max-w-7xl px-4 py-6">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2">
//                 <MapPin className="h-8 w-8 text-blue-600" />
//                 <h1 className="text-3xl font-bold text-gray-900">Vehicle Tracker</h1>
//               </div>
//               <div className="flex items-center space-x-4 text-sm text-gray-500">
//                 <div className="flex items-center space-x-1">
//                   <Car className="h-4 w-4" />
//                   <span>{vehicles.length} vehicles</span>
//                 </div>
//                 {lastUpdated && <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
//               </div>
//             </div>

//             <Button
//               onClick={fetchVehicles}
//               disabled={loading}
//               variant="outline"
//               size="sm"
//               className="flex items-center space-x-2 bg-transparent"
//             >
//               <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//               <span>Refresh</span>
//             </Button>
//           </div>

//           {error && (
//             <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//               <p className="text-sm text-yellow-800">⚠️ {error} - Showing demo data instead</p>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="mx-auto max-w-7xl p-6 space-y-8">
//         <div className="space-y-4">
//           <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
//             <MapPin className="h-5 w-5 text-blue-600" />
//             <span>Live Vehicle Locations</span>
//           </h2>
//           <VehicleMap vehicles={vehicles} />
//         </div>

//         <div className="space-y-4">
//           <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
//             <Car className="h-5 w-5 text-blue-600" />
//             <span>Vehicle Details</span>
//           </h2>
//           <VehicleGrid vehicles={vehicles} />
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import React from "react"

export default function RamTrackingIframe() {
  return (
    <div className="w-full h-screen">
      <iframe
        src="https://www.ramwebtracking.co.uk/"
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  )
}
