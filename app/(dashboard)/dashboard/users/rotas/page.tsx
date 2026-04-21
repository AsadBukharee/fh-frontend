import { cookies } from "next/headers"
import { getContracts, getDrivers, getShifts, getReportingData } from "@/lib/rota-api"
import RotaClient from "@/components/Rota/RotaClient"

export default async function Rota({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value || ""
  const userId = cookieStore.get("user_id")?.value || ""
  const role = cookieStore.get("role")?.value || ""
  const resolvedSearchParams = await searchParams

  // Basic filters from search params
  const dateFrom = (resolvedSearchParams.dateFrom as string) || "2026-01-01"
  const dateTo = (resolvedSearchParams.dateTo as string) || "2026-01-31"
  let displayType = (resolvedSearchParams.displayType as string) || "DAYS"
  const contractId = (resolvedSearchParams.contractType as string) || ""
  const driverId = (resolvedSearchParams.driver as string) || ""
  const shiftType = (resolvedSearchParams.shiftType as string) || ""

  // Security: Prevent non-admins from accessing salary data
  if (role !== "superadmin" && displayType === "SALARY") {
    displayType = "DAYS"
  }

  // Prepare params for reporting
  const reportingParams = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
    display_type: displayType,
    contract_id: contractId === "ALL" ? "" : contractId,
    driver_id: driverId === "ALL" ? "" : driverId,
    shift_type: shiftType === "ALL" ? "" : shiftType,
    status: "ALL",
    page: "1",
    page_size: "25",
  })

  // Parallel fetch initial data
  const [contracts, drivers, shifts, reportingData] = await Promise.all([
    getContracts(token),
    getDrivers(token),
    getShifts(token, userId),
    getReportingData(reportingParams, token)
  ])

  return (
    <RotaClient 
      initialReportingData={reportingData}
      contracts={contracts}
      drivers={drivers}
      shifts={shifts}
      role={role}
    />
  )
}