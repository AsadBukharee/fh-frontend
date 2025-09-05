"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Battery, Gauge } from "lucide-react"

interface Vehicle {
  id: number
  registration: string
  alias?: string
  vehicle_type: string
  vehicle_status: {
    last_event: string
    location: {
      latitude: number
      longitude: number
    }
    event_date: string
  }
  engine_hours: {
    engine_time_hours: number
  }
  batteryLevel: number
  vehicle_settings: {
    vehicle_icon_colour: string
  }
}

interface VehicleGridProps {
  vehicles: Vehicle[]
}

export function VehicleGrid({ vehicles }: VehicleGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "IGNITION_ON":
        return "bg-green-100 text-green-800 border-green-200"
      case "IGNITION_OFF":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 70) return "text-green-600"
    if (level > 30) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{vehicle.alias || vehicle.registration}</CardTitle>
              <Badge variant="outline" className={getStatusColor(vehicle.vehicle_status.last_event)}>
                {vehicle.vehicle_status.last_event.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{vehicle.vehicle_type}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div className="text-xs">
                  <p className="font-medium">Location</p>
                  <p className="text-gray-500">
                    {vehicle.vehicle_status.location.latitude.toFixed(4)},<br />
                    {vehicle.vehicle_status.location.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div className="text-xs">
                  <p className="font-medium">Engine Hours</p>
                  <p className="text-gray-500">{vehicle.engine_hours.engine_time_hours}h</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Battery className={`h-4 w-4 ${getBatteryColor(vehicle.batteryLevel)}`} />
                <div className="text-xs">
                  <p className="font-medium">Battery</p>
                  <p className={getBatteryColor(vehicle.batteryLevel)}>{vehicle.batteryLevel}%</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-purple-600" />
                <div className="text-xs">
                  <p className="font-medium">Last Event</p>
                  <p className="text-gray-500">{new Date(vehicle.vehicle_status.event_date).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
