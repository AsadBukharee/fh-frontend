'use client'
import { useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Mock data generation (unchanged)
const numWeeks = 20;
const generateMockData = (numWeeks: number) => {
  const drivers = [
    "John Doe", "Mike Han", "Sarah Wilson", "David Chen", "Emma Johnson",
    "Alex Rodriguez", "Lisa Thompson", "James Park", "Maria Garcia", "Robert Kim"
  ];
  return drivers.map((driver, index) => {
    const row: any = {
      id: index + 1,
      driver,
      bigHrs: "Big hrs",
      amount: index === 4 ? "50.00" : "40.00",
      wtdRemain: index >= 6 ? "0.0 hrs Remain" : "WTD hrs Remain",
    };
    for (let i = 1; i <= numWeeks; i++) {
      row[`w${i}`] = index >= 6 && i >= 7 ? "0 hrs" : `${48 - (i % 10)} hrs`;
    }
    return row;
  });
};
const mockData = generateMockData(numWeeks);

export default function WTDLogsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  return (
    <div className="w-full space-y-6 p-4 bg-white">
      {/* Header and Filters (unchanged) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">WTD Logs</h1>
          <p className="text-sm text-gray-500 mt-1">A view to see working directives logs of drivers below.</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // className="pl-9 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="period1">
            <SelectTrigger className="w-32 bg-white border-gray-200">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period1">Select Period</SelectItem>
              <SelectItem value="period2">Period 2</SelectItem>
              <SelectItem value="period3">Period 3</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="range1">
            <SelectTrigger className="w-32 bg-white border-gray-200">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="range1">Select Range</SelectItem>
              <SelectItem value="range2">Range 2</SelectItem>
              <SelectItem value="range3">Range 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Single Table with Sticky Columns */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-20 sticky left-0 bg-gray-50 z-10">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-40 sticky left-20 bg-gray-50 z-10">Driver</th>
                {Array.from({ length: numWeeks }, (_, i) => (
                  <th
                    key={`w${i + 1}`}
                    className="px-4 py-3 text-center  bg-purple-200 text-sm font-medium text-purple-600 w-24"
                  >
                    W {i + 1}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-84 bg-gray-50 z-10">More Hrs</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-56 bg-gray-50 z-10">Hrs Worked</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-28 bg-gray-50 z-10">WTD Hrs</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-28 sticky right-0 bg-gray-50 z-10">Avg Hrs Rem</th>
              </tr>
            </thead>
            <tbody>
              {mockData
                .filter((row) => row.driver.toLowerCase().includes(searchTerm.toLowerCase()))
                .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                .map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-inherit z-10">{row.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium sticky left-20 bg-inherit z-10">{row.driver}</td>
                    {Array.from({ length: numWeeks }, (_, i) => (
                      <td
                        key={`w${i + 1}`}
                        className={`px-4 py-3 bg-purple-100 text-center text-sm ${
                          row[`w${i + 1}`] === "0 hrs" ? "text-gray-400" : "text-gray-900"
                        } w-24`}
                      >
                        {row[`w${i + 1}`]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center text-sm  sticky right-84 bg-inherit z-10">
                        <Badge className="bg-green-100 text-green-600">{row.bigHrs}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-red-500 font-medium sticky right-56 bg-inherit z-10">
                        <Badge className="bg-red-100 text-red-600">{row.amount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-red-500 font-medium sticky right-28 bg-inherit z-10">
                        <Badge className="bg-red-100 text-red-600">{row.amount}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-orange-500 font-medium sticky right-0 bg-inherit z-10">
                        <Badge className="bg-orange-100 text-orange-600">{row.wtdRemain}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show Page</span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
            <SelectTrigger className="w-16 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="border-gray-200 text-gray-400 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.ceil(mockData.length / rowsPerPage) }, (_, i) => (
              <Button
                key={i + 1}
                size="sm"
                variant={currentPage === i + 1 ? "default" : "outline"}
                className={`w-8 h-8 ${
                  currentPage === i + 1
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === Math.ceil(mockData.length / rowsPerPage)}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}