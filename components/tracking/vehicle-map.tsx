"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface Vehicle {
  id: number
  registration: string
  vehicle_type: string
  vehicle_status: {
    last_event: string
    location: {
      latitude: number
      longitude: number
    }
    event_date: string
  }
  vehicle_settings: {
    vehicle_icon_colour: string
  }
  alias?: string
  batteryLevel: number
  engine_hours: {
    engine_time_hours: number
  }
}

interface VehicleMapProps {
  vehicles: Vehicle[]
}

export function VehicleMap({ vehicles }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return

    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Fix for default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const centerLat = vehicles.length > 0 ? vehicles[0].vehicle_status.location.latitude : 51.5074
      const centerLng = vehicles.length > 0 ? vehicles[0].vehicle_status.location.longitude : -0.1278

      const map = L.map(mapRef.current).setView([centerLat, centerLng], 10)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      vehicles.forEach((vehicle) => {
        const { latitude, longitude } = vehicle.vehicle_status.location
        const isOnline = vehicle.vehicle_status.last_event === "IGNITION_ON"

        // Create custom colored marker
        const iconHtml = `
          <div style="
            background-color: ${isOnline ? "#10b981" : "#ef4444"};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-vehicle-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map)

        marker.bindPopup(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-lg mb-2">${vehicle.alias || vehicle.registration}</h3>
            <div class="space-y-1 text-sm">
              <p><span class="font-medium">Type:</span> ${vehicle.vehicle_type}</p>
              <p><span class="font-medium">Status:</span> 
                <span class="px-2 py-1 rounded text-xs ${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                  ${vehicle.vehicle_status.last_event.replace("_", " ")}
                </span>
              </p>
              <p><span class="font-medium">Battery:</span> ${vehicle.batteryLevel}%</p>
              <p><span class="font-medium">Engine Hours:</span> ${vehicle.engine_hours.engine_time_hours}h</p>
              <p class="text-xs text-gray-500 mt-2">
                Last update: ${new Date(vehicle.vehicle_status.event_date).toLocaleString()}
              </p>
            </div>
          </div>
        `)
      })

      // Fit map to show all vehicles
      if (vehicles.length > 1) {
        const group = new L.featureGroup(
          vehicles.map((v) => L.marker([v.vehicle_status.location.latitude, v.vehicle_status.location.longitude])),
        )
        map.fitBounds(group.getBounds().pad(0.1))
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [vehicles])

  return (
    <Card className="h-[500px] w-full overflow-hidden shadow-lg">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
      <div ref={mapRef} className="h-full w-full" />
    </Card>
  )
}
