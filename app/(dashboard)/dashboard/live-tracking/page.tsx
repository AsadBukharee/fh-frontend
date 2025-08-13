"use client"

import type React from "react"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet"
import L, { type LatLngExpression, type DivIcon } from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-control-geocoder/dist/Control.Geocoder.css"
import "leaflet-control-geocoder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Car,
  MapPin,
  Activity,
  Navigation,
  Search,
  Download,
  RefreshCw,
  Settings,
  Moon,
  Sun,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Fuel,
  Gauge,
  User,
  Phone,
  Mail,
  MapPinIcon,
} from "lucide-react"
import { renderToStaticMarkup } from "react-dom/server"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface Vehicle {
  id: number
  name: string
  position: LatLngExpression
  status: "active" | "inactive" | "maintenance"
  speed: number
  direction: number
  lastUpdate: Date
  route: LatLngExpression[]
  driver?: string
  fuel?: number
  mileage?: number
  batteryLevel?: number
  temperature?: number
}

interface Site {
  id: number
  name: string
  position: LatLngExpression
  status: string
  address: string
  contact_email: string
  contact_phone: string
  number_of_allocated_vehicles: number
  type: "depot" | "service" | "maintenance"
}

interface Statistics {
  totalVehicles: number
  activeVehicles: number
  inactiveVehicles: number
  maintenanceVehicles: number
  totalSites: number
  averageSpeed: number
  totalDistance: number
  fuelEfficiency: number
}

interface VehicleCluster {
  id: string
  position: LatLngExpression
  vehicles: Vehicle[]
  count: number
}

const BOLTON_CENTER: LatLngExpression = [53.5769, -2.4282]

const initialVehicles: Vehicle[] = [
  {
    id: 1,
    name: "Vehicle Alpha",
    position: [53.5769, -2.4282],
    status: "active",
    speed: 45,
    direction: 90,
    lastUpdate: new Date(),
    route: [
      [53.5769, -2.4282],
      [53.58, -2.42],
    ],
    driver: "John Doe",
    fuel: 75,
    mileage: 12450,
    batteryLevel: 85,
    temperature: 22,
  },
  {
    id: 2,
    name: "Vehicle Beta",
    position: [53.58, -2.42],
    status: "inactive",
    speed: 0,
    direction: 0,
    lastUpdate: new Date(),
    route: [[53.58, -2.42]],
    driver: "Jane Smith",
    fuel: 30,
    mileage: 8920,
    batteryLevel: 45,
    temperature: 18,
  },
  {
    id: 3,
    name: "Vehicle Gamma",
    position: [53.57, -2.44],
    status: "maintenance",
    speed: 0,
    direction: 0,
    lastUpdate: new Date(),
    route: [[53.57, -2.44]],
    driver: "Mike Johnson",
    fuel: 90,
    mileage: 15670,
    batteryLevel: 95,
    temperature: 25,
  },
  {
    id: 4,
    name: "Vehicle Delta",
    position: [53.575, -2.43],
    status: "active",
    speed: 32,
    direction: 180,
    lastUpdate: new Date(),
    route: [
      [53.575, -2.43],
      [53.572, -2.435],
    ],
    driver: "Sarah Wilson",
    fuel: 60,
    mileage: 9800,
    batteryLevel: 70,
    temperature: 20,
  },
  {
    id: 5,
    name: "Vehicle Echo",
    position: [53.578, -2.425],
    status: "active",
    speed: 28,
    direction: 45,
    lastUpdate: new Date(),
    route: [
      [53.578, -2.425],
      [53.579, -2.424],
    ],
    driver: "David Brown",
    fuel: 85,
    mileage: 11200,
    batteryLevel: 80,
    temperature: 23,
  },
]

// Enhanced icon creation
const renderLucideIconToStringWithFill = (
  IconComponent: React.ElementType,
  fillColor: string,
  strokeColor: string,
  size = 32,
) => {
  let svgString = renderToStaticMarkup(<IconComponent color={strokeColor} size={size} strokeWidth={2} />)
  svgString = svgString.replace("<svg ", `<svg fill="${fillColor}" `)
  return svgString
}

const vehicleIcon = (status: Vehicle["status"], isSelected = false): DivIcon => {
  const colors = {
    active: { fill: "#10b981", stroke: "#059669" },
    inactive: { fill: "#ef4444", stroke: "#dc2626" },
    maintenance: { fill: "#f59e0b", stroke: "#d97706" },
  }
  const color = colors[status]
  const svgString = renderLucideIconToStringWithFill(Car, color.fill, color.stroke, isSelected ? 36 : 32)

  return L.divIcon({
    html: `<div class="vehicle-marker ${status} ${isSelected ? "selected" : ""}">${svgString}</div>`,
    className: "custom-vehicle-icon",
    iconSize: isSelected ? [44, 44] : [40, 40],
    iconAnchor: isSelected ? [22, 22] : [20, 20],
  })
}

const siteIcon = (type: Site["type"]): DivIcon => {
  const colors = {
    depot: { fill: "#3b82f6", stroke: "#2563eb" },
    service: { fill: "#8b5cf6", stroke: "#7c3aed" },
    maintenance: { fill: "#f59e0b", stroke: "#d97706" },
  }
  const color = colors[type]
  const svgString = renderLucideIconToStringWithFill(MapPin, color.fill, color.stroke)

  return L.divIcon({
    html: `<div class="site-marker ${type}">${svgString}</div>`,
    className: "custom-site-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  })
}

// Custom clustering function
const createClusters = (vehicles: Vehicle[], zoomLevel: number): (Vehicle | VehicleCluster)[] => {
  if (zoomLevel >= 14) return vehicles // No clustering at high zoom levels

  const clusters: VehicleCluster[] = []
  const processed = new Set<number>()
  const clusterDistance = zoomLevel < 10 ? 0.01 : 0.005 // Adjust based on zoom

  vehicles.forEach((vehicle, index) => {
    if (processed.has(index)) return

    const [lat, lng] = vehicle.position as [number, number]
    const nearbyVehicles = [vehicle]
    processed.add(index)

    vehicles.forEach((otherVehicle, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return

      const [otherLat, otherLng] = otherVehicle.position as [number, number]
      const distance = Math.sqrt(Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2))

      if (distance < clusterDistance) {
        nearbyVehicles.push(otherVehicle)
        processed.add(otherIndex)
      }
    })

    if (nearbyVehicles.length > 1) {
      // Create cluster
      const avgLat =
        nearbyVehicles.reduce((sum, v) => sum + (v.position as [number, number])[0], 0) / nearbyVehicles.length
      const avgLng =
        nearbyVehicles.reduce((sum, v) => sum + (v.position as [number, number])[1], 0) / nearbyVehicles.length

      clusters.push({
        id: `cluster-${clusters.length}`,
        position: [avgLat, avgLng],
        vehicles: nearbyVehicles,
        count: nearbyVehicles.length,
      })
    } else {
      // If a vehicle is not part of any cluster, add it as a single item
      //@ts-expect-error ab thk ha
      clusters.push(vehicle as VehicleCluster) // Cast to VehicleCluster for type compatibility in map, though it's a single vehicle
    }
  })

  return clusters.filter((item) => !("vehicles" in item) || item.vehicles.length > 0) // Filter out empty clusters if any
}

const clusterIcon = (count: number): DivIcon => {
  const size = count < 10 ? 40 : count < 100 ? 50 : 60
  const color = count < 10 ? "#3b82f6" : count < 100 ? "#f59e0b" : "#ef4444"

  return L.divIcon({
    html: `<div class="cluster-marker" style="background-color: ${color}; width: ${size}px; height: ${size}px; line-height: ${size}px;">${count}</div>`,
    className: "custom-cluster-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Enhanced Geocoder
const GeocoderControl: React.FC = () => {
  const map = useMap()

  //@ts-expect-error leaflet geocoder types
  useEffect(() => {
    //@ts-expect-error leaflet geocoder types
    const geocoder = L.Control.Geocoder.nominatim()
    //@ts-expect-error leaflet geocoder types
    const control = L.Control.geocoder({
      geocoder,
      defaultMarkGeocode: false,
      placeholder: "Search locations...",
      errorMessage: "Location not found",
    })
      .on("markgeocode", (e: any) => {
        const { center } = e.geocode
        map.flyTo(center, 15, { animate: true, duration: 1.5 })
        L.marker(center).addTo(map).bindPopup(`<strong>${e.geocode.name}</strong>`).openPopup()
      })
      .addTo(map)
    return () => map.removeControl(control)
  }, [map])
  return null
}

// Vehicle following with smooth animation
const FollowVehicle: React.FC<{ selectedVehicle: string; vehicles: Vehicle[] }> = ({ selectedVehicle, vehicles }) => {
  const map = useMap()

  useEffect(() => {
    if (selectedVehicle === "all") return

    const vehicle = vehicles.find((v) => v.id === Number.parseInt(selectedVehicle))
    if (vehicle) {
      map.flyTo(vehicle.position, 16, {
        animate: true,
        duration: 1.5,
      })
    }
  }, [selectedVehicle, vehicles, map])
  return null
}

// Map zoom tracker
const ZoomTracker: React.FC<{ onZoomChange: (zoom: number) => void }> = ({ onZoomChange }) => {
  const map = useMap()

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom())
    }

    map.on("zoomend", handleZoom)
    handleZoom() // Initial zoom

    return () => {
      map.off("zoomend", handleZoom)
    }
  }, [map, onZoomChange])

  return null
}

// Real-time updates indicator
const RealTimeIndicator: React.FC<{ isConnected: boolean; lastUpdate: Date }> = ({ isConnected, lastUpdate }) => (
  <div className="flex items-center gap-2 text-sm">
    <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
    <span className={isConnected ? "text-green-600" : "text-red-600"}>{isConnected ? "Live" : "Disconnected"}</span>
    <span className="text-muted-foreground text-xs">{lastUpdate.toLocaleTimeString()}</span>
  </div>
)

// Enhanced Statistics component
const StatisticsPanel: React.FC<{ stats: Statistics }> = ({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-sm text-muted-foreground">Total Vehicles</p>
            <p className="text-2xl font-bold">{stats.totalVehicles}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeVehicles}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <div>
            <p className="text-sm text-muted-foreground">Avg Speed</p>
            <p className="text-2xl font-bold">{stats.averageSpeed} mph</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-sm text-muted-foreground">Efficiency</p>
            <p className="text-2xl font-bold">{stats.fuelEfficiency} mpg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

// Enhanced Vehicle details sidebar
const VehicleDetailsPanel: React.FC<{
  vehicle: Vehicle | null
  onClose: () => void
}> = ({ vehicle, onClose }) => {
  if (!vehicle) return null

  const getStatusColor = (status: Vehicle["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-red-500"
      case "maintenance":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: Vehicle["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "inactive":
        return <XCircle className="w-4 h-4" />
      case "maintenance":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getFuelColor = (fuel: number) => {
    if (fuel > 50) return "bg-green-500"
    if (fuel > 25) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className="w-80 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{vehicle.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(vehicle.status)} text-white`}>
            {getStatusIcon(vehicle.status)}
            <span className="ml-1 capitalize">{vehicle.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-muted-foreground">Speed</p>
              <p className="font-semibold">{vehicle.speed} mph</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-muted-foreground">Direction</p>
              <p className="font-semibold">{vehicle.direction}°</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Fuel Level</span>
              <span className="font-semibold">{vehicle.fuel}%</span>
            </div>
         
            <Progress value={vehicle.fuel} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Battery</span>
              <span className="font-semibold">{vehicle.batteryLevel}%</span>
            </div>
            <Progress value={vehicle.batteryLevel} className="h-2" />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-muted-foreground">Driver</p>
              <p className="font-semibold">{vehicle.driver || "Unassigned"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-muted-foreground">Mileage</p>
              <p className="font-semibold">{vehicle.mileage?.toLocaleString()} mi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-muted-foreground">Last Update</p>
              <p className="text-sm">{vehicle.lastUpdate.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Navigation className="w-4 h-4 mr-1" />
            Track
          </Button>
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Vehicle list component
const VehicleList: React.FC<{
  vehicles: Vehicle[]
  onVehicleSelect: (vehicle: Vehicle) => void
  selectedVehicle: Vehicle | null
}> = ({ vehicles, onVehicleSelect, selectedVehicle }) => (
  <ScrollArea className="h-64">
    <div className="space-y-2">
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className={`cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedVehicle?.id === vehicle.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onVehicleSelect(vehicle)}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    vehicle.status === "active"
                      ? "bg-green-500"
                      : vehicle.status === "inactive"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm">{vehicle.name}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.driver}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{vehicle.speed} mph</p>
                <p className="text-xs text-muted-foreground">{vehicle.fuel}% fuel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </ScrollArea>
)

const EnhancedLiveTrackingFixed: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [sites, setSites] = useState<Site[]>([])
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showRoutes, setShowRoutes] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [enableClustering, setEnableClustering] = useState<boolean>(true)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const [refreshInterval, setRefreshInterval] = useState<number>(5000)
  const [currentZoom, setCurrentZoom] = useState<number>(13)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const cookies = useCookies()
  const mapRef = useRef<any>(null)

  // Calculate enhanced statistics
  const statistics: Statistics = useMemo(() => {
    const activeVehicles = vehicles.filter((v) => v.status === "active").length
    const inactiveVehicles = vehicles.filter((v) => v.status === "inactive").length
    const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length
    const averageSpeed = vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length || 0
    const totalDistance = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0)
    const averageFuel = vehicles.reduce((sum, v) => sum + (v.fuel || 0), 0) / vehicles.length || 0
    const fuelEfficiency = totalDistance / (100 - averageFuel) || 0
    return {
      totalVehicles: vehicles.length,
      activeVehicles,
      inactiveVehicles,
      maintenanceVehicles,
      totalSites: sites.length,
      averageSpeed: Math.round(averageSpeed),
      totalDistance: Math.round(totalDistance),
      fuelEfficiency: Math.round(fuelEfficiency * 10) / 10,
    }
  }, [vehicles, sites])

  // Fetch sites data
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/api/sites/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch sites")
        }

        const data = await response.json()
        const formattedSites: Site[] = data.map((site: any) => ({
          id: site.id,
          name: site.name,
          position: [site.latitude, site.longitude] as LatLngExpression,
          status: site.status,
          address: site.address,
          contact_email: site.contact_email,
          contact_phone: site.contact_phone,
          number_of_allocated_vehicles: site.number_of_allocated_vehicles,
          type: site.type || "depot",
        }))
        setSites(formattedSites)
      } catch (err) {
        setError("Error fetching sites data")
        console.error(err)
        setIsRealTimeConnected(false)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSites()
  }, [cookies])

  // Enhanced vehicle movement simulation
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.status !== "active") return vehicle
          const newPosition = generateSmallMovement(vehicle.position)
          const newSpeed = Math.max(0, Math.min(60, vehicle.speed + (Math.random() - 0.5) * 10))
          const newDirection = (vehicle.direction + (Math.random() - 0.5) * 30) % 360
          const newFuel = Math.max(0, vehicle.fuel! - Math.random() * 0.5)
          const newBattery = Math.max(0, Math.min(100, vehicle.batteryLevel! + (Math.random() - 0.5) * 2))
          return {
            ...vehicle,
            position: newPosition,
            speed: Math.round(newSpeed),
            direction: Math.round(newDirection),
            fuel: Math.round(newFuel * 10) / 10,
            batteryLevel: Math.round(newBattery),
            lastUpdate: new Date(),
            route: [...vehicle.route.slice(-10), newPosition], // Keep last 10 positions
          }
        }),
      )
      setLastUpdate(new Date())
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const generateSmallMovement = (currentPosition: LatLngExpression): LatLngExpression => {
    const [currentLat, currentLng] = currentPosition as [number, number]
    const maxChange = 0.001
    const latChange = (Math.random() - 0.5) * maxChange
    const lngChange = (Math.random() - 0.5) * maxChange
    return [currentLat + latChange, currentLng + lngChange]
  }

  // Filtering logic
  const filteredVehicles = useMemo(() => {
    let filtered =
      selectedVehicle === "all"
        ? vehicles
        : vehicles.filter((vehicle) => vehicle.id === Number.parseInt(selectedVehicle))

    if (searchTerm) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.driver?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [selectedVehicle, vehicles, searchTerm])

  const filteredSites = useMemo(() => {
    let filtered = selectedSite === "all" ? sites : sites.filter((site) => site.id === Number.parseInt(selectedSite))

    if (searchTerm) {
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [selectedSite, sites, searchTerm])

  // Create clusters for display
  const clusteredItems = useMemo(() => {
    return enableClustering ? createClusters(filteredVehicles, currentZoom) : filteredVehicles
  }, [filteredVehicles, currentZoom, enableClustering])

  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    setSelectedVehicleDetails(vehicle)
    setSelectedVehicle(vehicle.id.toString())
  }, [])

  const handleClusterClick = useCallback((cluster: VehicleCluster, map: any) => {
    const bounds = L.latLngBounds(cluster.vehicles.map((v) => v.position as L.LatLngExpression))
    map.fitBounds(bounds, { padding: [20, 20] })
  }, [])

  const exportData = useCallback(() => {
    const data = {
      vehicles: filteredVehicles,
      sites: filteredSites,
      statistics,
      timestamp: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tracking-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredVehicles, filteredSites, statistics])

  // Effect to move map to selected site
  useEffect(() => {
    if (selectedSite !== "all" && mapRef.current) {
      const site = sites.find((s) => s.id === Number.parseInt(selectedSite))
      if (site) {
        mapRef.current.flyTo(site.position, 16, { animate: true, duration: 1.5 })
      }
    }
  }, [selectedSite, sites])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading tracking data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="p-4 space-y-6 bg-background">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Enhanced Fleet Tracking</h1>
            <p className="text-muted-foreground">Advanced real-time monitoring and fleet management</p>
          </div>

          <div className="flex items-center gap-4">
            <RealTimeIndicator isConnected={isRealTimeConnected} lastUpdate={lastUpdate} />
            <Button variant="outline" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <StatisticsPanel stats={statistics} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls & Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="filters" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="filters">Filters</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="filters" className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search vehicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select onValueChange={setSelectedVehicle} value={selectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vehicles</SelectItem>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  vehicle.status === "active"
                                    ? "bg-green-500"
                                    : vehicle.status === "inactive"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                }`}
                              />
                              {vehicle.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={setSelectedSite} value={selectedSite}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sites</SelectItem>
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id.toString()}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label htmlFor="routes" className="text-sm">
                          Show Routes
                        </label>
                        <Switch id="routes" checked={showRoutes} onCheckedChange={setShowRoutes} />
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="clustering" className="text-sm">
                          Enable Clustering
                        </label>
                        <Switch id="clustering" checked={enableClustering} onCheckedChange={setEnableClustering} />
                      </div>

                      <div className="flex items-center justify-between">
                        <label htmlFor="auto-refresh" className="text-sm">
                          Auto Refresh
                        </label>
                        <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground">Refresh Interval</label>
                        <Select
                          value={refreshInterval.toString()}
                          onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1000">1 second</SelectItem>
                            <SelectItem value="5000">5 seconds</SelectItem>
                            <SelectItem value="10000">10 seconds</SelectItem>
                            <SelectItem value="30000">30 seconds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-sm font-semibold mb-2">Vehicle List</h3>
                  <VehicleList
                    vehicles={filteredVehicles}
                    onVehicleSelect={handleVehicleClick}
                    selectedVehicle={selectedVehicleDetails}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : "lg:col-span-3"}`}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Map</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`relative ${isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[600px]"} z-0 w-full`}>
                  <MapContainer
                    center={BOLTON_CENTER}
                    zoom={13}
                    className="leaflet-container h-full w-full rounded-lg"
                    ref={mapRef}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <GeocoderControl />
                    <FollowVehicle selectedVehicle={selectedVehicle} vehicles={vehicles} />
                    <ZoomTracker onZoomChange={setCurrentZoom} />

                    {clusteredItems.map((item) => {
                      if ("vehicles" in item) {
                        // This is a cluster
                        const cluster = item as VehicleCluster
                        return (
                          <Marker
                            key={cluster.id}
                            position={cluster.position}
                            icon={clusterIcon(cluster.count)}
                            eventHandlers={{
                              click: (e) => handleClusterClick(cluster, e.target._map),
                            }}
                          >
                            <Popup>
                              <div className="space-y-2">
                                <h3 className="font-semibold">Vehicle Cluster ({cluster.count})</h3>
                                <div className="space-y-1">
                                  {cluster.vehicles.map((vehicle) => (
                                    <div key={vehicle.id} className="flex items-center justify-between text-sm">
                                      <span>{vehicle.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {vehicle.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                <Button size="sm" className="w-full">
                                  Zoom to Vehicles
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      } else {
                        // This is a single vehicle
                        const vehicle = item as Vehicle
                        const isSelected = selectedVehicleDetails?.id === vehicle.id
                        return (
                          <Marker
                            key={vehicle.id}
                            position={vehicle.position}
                            icon={vehicleIcon(vehicle.status, isSelected)}
                            eventHandlers={{
                              click: () => handleVehicleClick(vehicle),
                            }}
                          >
                            <Popup>
                              <div className="space-y-2">
                                <h3 className="font-semibold">{vehicle.name}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    Status: <Badge variant="outline">{vehicle.status}</Badge>
                                  </div>
                                  <div>Speed: {vehicle.speed} mph</div>
                                  <div>Driver: {vehicle.driver}</div>
                                  <div>Fuel: {vehicle.fuel}%</div>
                                  <div>Battery: {vehicle.batteryLevel}%</div>
                                  <div>Temp: {vehicle.temperature}°C</div>
                                </div>
                                <Button size="sm" onClick={() => handleVehicleClick(vehicle)} className="w-full">
                                  View Details
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      }
                    })}

                    {filteredSites.map((site) => (
                      <Marker key={site.id} position={site.position} icon={siteIcon(site.type)}>
                        <Popup>
                          <div className="space-y-2">
                            <h3 className="font-semibold">{site.name}</h3>
                            <div className="text-sm space-y-1">
                              <p>
                                <strong>Type:</strong> <Badge variant="outline">{site.type}</Badge>
                              </p>
                              <p>
                                <strong>Status:</strong> {site.status}
                              </p>
                              <p>
                                <strong>Address:</strong> {site.address}
                              </p>
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{site.contact_email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{site.contact_phone}</span>
                              </div>
                              <p>
                                <strong>Vehicles:</strong> {site.number_of_allocated_vehicles}
                              </p>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {showRoutes &&
                      filteredVehicles.map(
                        (vehicle) =>
                          vehicle.route.length > 1 && (
                            <Polyline
                              key={`route-${vehicle.id}`}
                              positions={vehicle.route}
                              color={vehicle.status === "active" ? "#10b981" : "#ef4444"}
                              weight={3}
                              opacity={0.7}
                              dashArray={vehicle.status === "active" ? undefined : "5, 10"}
                            />
                          ),
                      )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Vehicle Details Panel - Fixed Position */}
        {selectedVehicleDetails && !isFullscreen && (
          <div className="fixed right-4 top-4 z-40">
            <VehicleDetailsPanel vehicle={selectedVehicleDetails} onClose={() => setSelectedVehicleDetails(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedLiveTrackingFixed
