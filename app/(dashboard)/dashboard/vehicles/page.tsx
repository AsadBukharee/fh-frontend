"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import Link from "next/link"


interface Vehicle {
  id: number
  registration_number: string
  vehicle_status: string
  is_roadworthy: boolean
  mot_expiry: string
  tax_expiry: string
  insurance_expiry: string
  walkaround_count: number
  vehicles_type: {
    name: string
  }
  site_allocated: {
    name: string
    postcode: string
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const cookies=useCookies()

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/vehicles/`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await res.json()
        if (data.success) {
          setVehicles(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  return (
    <div className="bg-white">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicles Management</h2>
        <p className="text-gray-600 mb-6">List of vehicles with status and expiry information.</p>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Reg No.</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roadworthy</TableHead>
                <TableHead>MOT Expiry</TableHead>
                <TableHead>Tax Expiry</TableHead>
                <TableHead>Insurance Expiry</TableHead>
                <TableHead>Site</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map(vehicle => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.id}</TableCell>
                    <TableCell>
                      <Link href={`vehicles/${vehicle.id}`} className="text-magenta underline hover:text-magenta-600">
                        {vehicle.registration_number}
                      </Link>
                    </TableCell>
                    <TableCell>{vehicle.vehicles_type?.name}</TableCell>
                    <TableCell className="capitalize">{vehicle.vehicle_status}</TableCell>
                    <TableCell>
                      {vehicle.is_roadworthy ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </TableCell>
                    <TableCell>{vehicle.mot_expiry}</TableCell>
                    <TableCell>{vehicle.tax_expiry}</TableCell>
                    <TableCell>{vehicle.insurance_expiry}</TableCell>
                    <TableCell>{vehicle.site_allocated?.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
