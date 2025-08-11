"use client"

import { Eye, Search, Car, Plus, RefreshCcw } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import GradientButton from "@/app/utils/GradientButton"
import Addwalkaround from "@/components/walkaround/add-walkaround"
import WalkaroundDetailsDialog from "@/components/walkaround/walkaround_detail"

interface Walkaround {
  id: number
  driver: {
    full_name: string
    email: string
  }
  vehicle: {
    id: number
    vehicles_type_name: string
    registration_number: string
  }
  conducted_by: string | null
  walkaround_assignee: string | null
  status: "pending" | "failed" | "completed" | "custom"
  date: string
  time: string
  milage: number
  defects?: string // Added optional defects
  notes?: string // Added optional notes
}

interface GroupedWalkaround {
  vehicle_id: number
  vehicle_type: string
  registration_number: string
  drivers: Walkaround[] // Store full Walkaround objects here
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "failed":
      return "bg-red-500"
    case "custom":
      return "bg-purple-700"
    default:
      return "bg-gray-300"
  }
}

const WalkaroundPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [walkarounds, setWalkarounds] = useState<Walkaround[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false) // State for Addwalkaround dialog
  const [selectedWalkaround, setSelectedWalkaround] = useState<Walkaround | null>(null) // State for details dialog
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false) // State for details dialog visibility

  const cookies = useCookies()

  const fetchWalkarounds = async () => {
    try {
      const response = await fetch(`${API_URL}/api/walk-around/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        const mappedWalkarounds = result.data.results.flatMap((chain: any) => {
          const steps = [chain.root, ...chain.children]
          return steps.map((step: any) => {
            const conductor = step.conducted_by || { full_name: "None None", email: "unknown" }
            const conductorName = conductor.full_name !== "None None" ? conductor.full_name : conductor.email
            let assigneeName = null
            if (step.walkaround_assignee) {
              assigneeName =
                step.walkaround_assignee.full_name !== "None None"
                  ? step.walkaround_assignee.full_name
                  : step.walkaround_assignee.email
            }
            return {
              id: step.id,
              driver: conductor,
              vehicle: chain.root.vehicle,
              conducted_by: conductorName,
              walkaround_assignee: assigneeName,
              status: step.status,
              date: step.date,
              time: step.time,
              milage: step.milage,
              defects: step.defects || undefined, // Include if present in API response
              notes: step.notes || undefined, // Include if present in API response
            }
          })
        })
        setWalkarounds(mappedWalkarounds)
      } else {
        setError("Failed to fetch walkarounds.")
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while fetching data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalkarounds()
  }, [])

  const groupedWalkarounds = walkarounds.reduce(
    (acc, walkaround) => {
      const vehicleId = walkaround.vehicle.id
      const vehicleType = walkaround.vehicle.vehicles_type_name
      const registrationNumber = walkaround.vehicle.registration_number

      if (!acc[vehicleId]) {
        acc[vehicleId] = {
          vehicle_id: vehicleId,
          vehicle_type: vehicleType,
          registration_number: registrationNumber,
          drivers: [],
        }
      }
      acc[vehicleId].drivers.push(walkaround) // Push the full walkaround object
      return acc
    },
    {} as Record<number, GroupedWalkaround>,
  )

  const filteredWalkarounds = Object.values(groupedWalkarounds).filter(
    (group) =>
      group.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.drivers.some((driver) =>
        (driver.driver.full_name === "None None" ? driver.driver.email : driver.driver.full_name)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
  )

  const handleViewDetails = (walkaroundData: Walkaround) => {
    setSelectedWalkaround(walkaroundData)
    setOpenDetailsDialog(true)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }
  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround</h1>
            <p className="text-sm text-gray-500 mb-4">Dummy text</p>
            {/* Search Input for Vehicle Number */}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search vehicle no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
          </div>
          <div className=" flex gap-4 items-center justify-center">
            <RefreshCcw
              className=" text-gray-500 hover:text-gray-600 cursor-pointer"
              onClick={() => fetchWalkarounds()}
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <GradientButton text="Walkaround" Icon={Plus} />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-auto ">
                <DialogHeader>
                  <DialogTitle>Create New Walkaround</DialogTitle>
                </DialogHeader>
                <Addwalkaround setOpen={setOpen} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Walkaround List */}
        <div className="space-y-6">
          {filteredWalkarounds.map((group, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 border-b border-gray-200">
              {/* Left: Vehicle Icon and Registration Number */}
              <div className="flex items-center space-x-3">
                <Car className="text-gray-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">{group.registration_number}</span>
              </div>
              {/* Center: Driver Status Circles */}
              <div className="flex items-center max-w-[450px] overflow-x-auto space-x-2">
                {group.drivers.map((driver, driverIdx) => (
                  <div
                    key={driverIdx}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => handleViewDetails(driver)} // Pass the full driver object
                  >
                    <span className="text-xs text-gray-600 mt-1">{driver.walkaround_assignee || "N/A"}</span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getStatusClasses(
                        driver.status,
                      )}`}
                    >
                      {driverIdx + 1}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{driver.conducted_by || "Not conducted"}</span>
                  </div>
                ))}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${getStatusClasses(
                    "custom",
                  )} cursor-pointer`}
                >
                  +
                </div>
              </div>
              {/* Right: View Button */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">View</span>
                <Eye className="text-gray-500 w-4 h-4 cursor-pointer hover:text-gray-700 transition-colors" />
              </div>
            </div>
          ))}
        </div>
        {/* No Results */}
        {filteredWalkarounds.length === 0 && (
          <div className="text-center py-12">
            <Car className="mx-auto w-12 h-12 text-gray-400 mb-3" />
            <p className="text-gray-500">No walkarounds found matching your search.</p>
          </div>
        )}
      </div>

      {/* Walkaround Details Dialog */}
      <WalkaroundDetailsDialog
        walkaround={selectedWalkaround}
        open={openDetailsDialog}
        onOpenChange={setOpenDetailsDialog}
      />
    </div>
  )
}

export default WalkaroundPage
