'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L, { LatLngExpression, DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'
import 'leaflet-control-geocoder'
import './LiveTracking.css'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import API_URL from '@/app/utils/ENV'
import { useCookies } from 'next-client-cookies'

import { Car, MapPin } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'

interface Vehicle {
  id: number
  name: string
  position: LatLngExpression
  status: 'active' | 'inactive'
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
}

const BOLTON_CENTER: LatLngExpression = [53.5769, -2.4282]

const initialVehicles: Vehicle[] = [
  { id: 1, name: 'Vehicle 1', position: [53.5769, -2.4282], status: 'active' },
  { id: 2, name: 'Vehicle 2', position: [53.5800, -2.4200], status: 'inactive' },
  { id: 3, name: 'Vehicle 3', position: [53.5700, -2.4400], status: 'active' },
]

// Helper to convert Lucide React icon to SVG string for Leaflet DivIcon
const renderLucideIconToString = (IconComponent: React.ElementType, props = {}) =>
  renderToStaticMarkup(<IconComponent {...props} />)

// Vehicle icon with color based on status
const vehicleIcon = (status: 'active' | 'inactive'): DivIcon => {
  const fillColor = status === 'active' ? '#28a745' : '#dc3545'
  const svgString = renderLucideIconToString(Car, {
    color: fillColor,
    size: 32,
    strokeWidth: 1.5,
  })
  return L.divIcon({
    html: svgString,
    className: 'vehicle-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// Site icon as blue pin
const siteIcon: DivIcon = L.divIcon({
  html: renderLucideIconToString(MapPin, {
    color: '#007bff',
    size: 32,
    strokeWidth: 1.5,
  }),
  className: 'site-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32], // pin tip points here
})

const GeocoderControl: React.FC = () => {
  const map = useMap()
  //@ts-expect-error ab thk ha
  useEffect(() => {
  //@ts-expect-error ab thk ha
    const geocoder = L.Control.Geocoder.nominatim()
   //@ts-expect-error ab thk ha
    const control = L.Control.geocoder({
      geocoder,
      defaultMarkGeocode: false,
    })
      .on('markgeocode', (e: any) => {
        const { center } = e.geocode
        map.setView(center, 13)
        L.marker(center).addTo(map).bindPopup(e.geocode.name).openPopup()
      })
      .addTo(map)
    return () => map.removeControl(control)
  }, [map])
  return null
}

const FollowVehicle: React.FC<{ selectedVehicle: string; vehicles: Vehicle[] }> = ({ selectedVehicle, vehicles }) => {
  const map = useMap()
  useEffect(() => {
    if (selectedVehicle === 'all') return
    const vehicle = vehicles.find((v) => v.id === parseInt(selectedVehicle))
    if (vehicle) {
      map.setView(vehicle.position, 14)
    }
  }, [selectedVehicle, vehicles, map])
  return null
}

const LiveTracking: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/api/sites/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cookies.get('access_token')}`,
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch sites')
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
        }))
        setSites(formattedSites)
      } catch (err) {
        setError('Error fetching sites data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSites()
  }, [cookies])

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => ({
          ...vehicle,
          position: vehicle.status === 'active' ? generateSmallMovement(vehicle.position) : vehicle.position,
        }))
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const generateSmallMovement = (currentPosition: LatLngExpression): LatLngExpression => {
    const [currentLat, currentLng] = currentPosition as [number, number]
    const maxChange = 0.002
    const latChange = (Math.random() - 0.5) * maxChange
    const lngChange = (Math.random() - 0.5) * maxChange
    return [currentLat + latChange, currentLng + lngChange]
  }

  const filteredVehicles = useMemo(() => {
    return selectedVehicle === 'all' ? vehicles : vehicles.filter((vehicle) => vehicle.id === parseInt(selectedVehicle))
  }, [selectedVehicle, vehicles])

  const filteredSites = useMemo(() => {
    return selectedSite === 'all' ? sites : sites.filter((site) => site.id === parseInt(selectedSite))
  }, [selectedSite, sites])

  if (isLoading) {
    return <div>Loading sites...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-4 z-10">
        <Select onValueChange={setSelectedVehicle} value={selectedVehicle}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                {vehicle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setSelectedSite} value={selectedSite}>
          <SelectTrigger className="w-[180px]">
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
      </div>

      <div className="relative z-0 h-[500px] w-[800px]">
        <MapContainer center={BOLTON_CENTER} zoom={13} className="leaflet-container">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <GeocoderControl />
          <FollowVehicle selectedVehicle={selectedVehicle} vehicles={vehicles} />
          {filteredVehicles.map((vehicle) => (
            <Marker key={vehicle.id} position={vehicle.position} icon={vehicleIcon(vehicle.status)}>
              <Popup>
                {vehicle.name} - {vehicle.status}
              </Popup>
            </Marker>
          ))}
          {filteredSites.map((site) => (
            <Marker key={site.id} position={site.position} icon={siteIcon}>
              <Popup>
                <div>
                  <h3>{site.name}</h3>
                  <p>Status: {site.status}</p>
                  <p>Address: {site.address}</p>
                  <p>Email: {site.contact_email}</p>
                  <p>Phone: {site.contact_phone}</p>
                  <p>Vehicles: {site.number_of_allocated_vehicles}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default LiveTracking
