"use client"

import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Truck, Users, MapPin, TriangleAlert, Clock, TrendingUp } from "lucide-react"
import { sitesData } from "@/app/data/sites"

export default function SiteDetails() {
  const params = useParams()
  const siteId = params.id // Assuming id is passed as a parameter, e.g., /site-details/0
  // Find site based on index (adjust logic as needed to match your id system)
  const site = sitesData[Number.parseInt(siteId as string, 10)]

  if (!site) return <div>Site not found</div>

  const getStatusBadgeColors = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700"
      case "On Hold":
        return "bg-yellow-100 text-yellow-700"
      case "Completed":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getSeverityBadgeColors = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplianceBadgeColors = (status: string) => {
    switch (status) {
      case "Over Capacity":
        return "bg-red-100 text-red-700"
      case "In Compliance":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="text-sm text-gray-500 mb-2">
        Dashboard / Sites / <span className="text-orange-600">Sites Details</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Sites Details</h1>
      <p className="text-sm text-gray-500 mb-6">see sited details</p>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Site Information */}
          <Card className="p-4 border border-gray-200 rounded-lg bg-gray-100">
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
              <MapPin className="w-5 h-5 text-orange-600" />
              <span>Site Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-500">Site Name</p>
                <p className="font-semibold">{site.name}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Location</p>
                <p className="font-semibold">{site.location.city}</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-500">Longitude (Geofencing)</p>
                <p className="font-semibold">{site.location.geofencing.longitude.toFixed(4)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500">Latitude (Geofencing)</p>
                <p className="font-semibold">{site.location.geofencing.latitude.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-gray-500">
              <Badge className={`${getStatusBadgeColors(site.status)} text-xs font-medium mr-2`}>{site.status}</Badge>
              <span>
                Last Updated:{" "}
                {new Date(site.lastUpdated).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          </Card>

          {/* Vehicle Information & Max Staff Allow */}
<div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
<Truck className="w-8 h-8 text-orange" />
<h1 className="text-2xl font-bold">Vehicle Information</h1>
</div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
            {/* Authorized Vehicles */}
            <Card className="p-4 rounded-lg bg-orange-600 text-white flex flex-col justify-between">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Truck className="w-5 h-5" />
                <span>Authorized Vehicle</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-4xl font-bold">{site.authorizedVehicles}</span>
                <Truck className="w-12 h-12 opacity-50" />
              </div>
            </Card>
            {/* Max Staff Allow */}
            <Card className="p-4 rounded-lg bg-red-600 text-white flex flex-col justify-between">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Users className="w-5 h-5" />
                <span>Max Staff Allow</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-4xl font-bold">{site.staff.capacity}</span>
                <Users className="w-12 h-12 opacity-50" />
              </div>
            </Card>
          </div>
         <div className=" bg-gray-100 flex justify-center items-center h-16 rounded-lg">
         <p className="text-xs text-gray-500 flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-yellow-500" />
          Authorization changes automatically adjust maximum staff limits and trigger alerts for compliance.
          </p>
         </div>

          {/* Current Staff on Site */}
          <Card className="p-4  rounded-lg">
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
              <Users className="w-5 h-5 text-orange-600" />
              <span>Current Staff onsite</span>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {site.staff.breakdown.map((role, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded-md text-center">
                  <p className="text-lg font-bold">{role.count}</p>
                  <p className="text-xs text-gray-500">{role.role}</p>
                </div>
              ))}
            </div>
            {/* <br  className="bg-red-300 flex"/> */}
            <span className="bg-gray-400 flex w-full h-0.5 mt-2"></span>
            <div className="text-sm bg-gray-100 p-4 rounded-lg text-gray-700 mt-4">
              <p className="font-medium">Total Staff / Maximum Allowed</p>
              <p className="text-xl font-bold text-black">
                {site.staff.current} / {site.staff.capacity}
              </p>
           <div className="flex items-center gap-2">
           <TrendingUp className="w-4 h-4 text-red-500" />
              <p
                className={
                  site.staff.utilization.includes("105%") || site.staff.utilization.includes("107%")
                    ? "text-red-600 font-medium"
                    : "text-gray-700 font-medium"
                }
              >
                {site.staff.utilization}
              </p>
           </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Site Alerts */}
          <div className="flex items-center gap-2">
                <TriangleAlert className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-600 font-bold">Site Alerts</span>
                <Badge className={`${getSeverityBadgeColors(site.siteAlerts.severity)} text-xs font-medium`}>
                {site.siteAlerts.severity}
              </Badge>
              </div>
          <Card className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex justify-between items-center mb-2">
              
              <Badge className={`${getSeverityBadgeColors(site.siteAlerts.severity)} text-xs font-medium`}>
                {site.siteAlerts.severity}
              </Badge>
            </div>
            <p className="text-sm text-gray-700">{site.siteAlerts.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              Last Updated:{" "}
              {new Date(site.siteAlerts.lastUpdate).toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>Quick Stats</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Site status</span>
                <Badge className={`${getStatusBadgeColors(site.quickStats.status)} text-xs font-medium`}>
                  {site.quickStats.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Compliance Status</span>
                <Badge className={`${getComplianceBadgeColors(site.quickStats.complianceStatus)} text-xs font-medium`}>
                  {site.quickStats.complianceStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Active Alerts</span>
                <Badge className="bg-red-100 text-red-700 text-xs font-medium">{site.quickStats.activeAlerts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Latest Update</span>
                <span className="text-sm text-gray-700">
                  {new Date(site.lastUpdated).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>Quick Actions</span>
            </div>
            <div className="space-y-2">
              {site.quickActions.map((action, index) => (
                <button
                  key={index}
                  className={`w-full text-sm font-medium py-2 px-4 rounded-lg ${action.enabled ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                  disabled={!action.enabled}
                >
                  {action.name}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
