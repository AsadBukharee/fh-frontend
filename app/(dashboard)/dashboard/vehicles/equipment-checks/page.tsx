'use client';

import { useState } from 'react';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  ChevronDown,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Check {
  id: number;
  date: string;
  vehicleReg: string;
  auditor: string;
  driver: string;
  checkType: 'Daily' | 'Weekly';
  status: 'Passed' | 'Failed' | 'Advisory';
}

const mockData: Check[] = [
  { id: 1, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'John Smith', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Passed' },
  { id: 2, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'David Joe', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Advisory' },
  { id: 3, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Parker will', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Passed' },
  { id: 4, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Max Will', driver: 'Jenny Wilson', checkType: 'Weekly', status: 'Failed' },
  { id: 5, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Eleven', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Failed' },
  { id: 6, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Will', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Passed' },
  { id: 7, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'John', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Passed' },
  { id: 8, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Jenefir', driver: 'Jenny Wilson', checkType: 'Weekly', status: 'Passed' },
  { id: 9, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Harry', driver: 'Jenny Wilson', checkType: 'Weekly', status: 'Failed' },
];

export default function VehicleChecklist() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = mockData.filter((item) =>
    Object.values(item).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header + Stats Card */}
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Vehicle Equipment Checklist</h1>
                <p className="text-sm text-gray-500 mt-1">Fleet safety inspection management</p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download PSD
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-pink-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-pink-200 p-3 rounded-full">
                  <div className="w-8 h-8 bg-pink-500 rounded" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Checks</p>
                  <p className="text-2xl font-bold text-gray-900">33</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-green-200 p-3 rounded-full">
                  <div className="w-8 h-8 bg-green-500 rounded" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-gray-900">22</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-red-200 p-3 rounded-full">
                  <div className="w-8 h-8 bg-red-500 rounded" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-yellow-200 p-3 rounded-full">
                  <div className="w-8 h-8 bg-yellow-500 rounded" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Advisory</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-orange-200 p-3 rounded-full">
                  <div className="w-8 h-8 bg-orange-500 rounded" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </div>

            {/* Tabs - Custom styled to match screenshot */}
            <div className="flex flex-wrap gap-3">
              <Button variant="default" className="bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg">
                Today checks (3)
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Submitted (2)</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Rejected (3)</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Remedial Required (2)</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">All History (6)</Button>
            </div>
          </div>
        </Card>

        {/* Table Card */}
        <Card className="overflow-hidden">
          {/* Search + Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-sm">
                  Check Type <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" size="sm" className="text-sm">
                  Date & Time <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" size="sm" className="text-sm">
                  Driver <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" size="sm" className="text-sm">
                  Vehicle <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" size="sm" className="text-sm">
                  Status <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-gray-500 text-xs uppercase">Check Date</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase">Vehicle Reg</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase">Auditor</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase">Driver</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase">Check Type</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase">Status</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm">{row.date}</TableCell>
                    <TableCell className="text-sm">{row.vehicleReg}</TableCell>
                    <TableCell className="text-sm">{row.auditor}</TableCell>
                    <TableCell className="text-sm">{row.driver}</TableCell>
                    <TableCell>
                      <Badge variant={row.checkType === 'Daily' ? 'default' : 'secondary'} className={row.checkType === 'Daily' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : ''}>
                        {row.checkType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.status === 'Passed' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Passed</Badge>}
                      {row.status === 'Failed' && <Badge variant="destructive">Failed</Badge>}
                      {row.status === 'Advisory' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Advisory</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        {row.status === 'Advisory' ? <Eye className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Row Page <span className="font-medium">01</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Button variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600">1</Button>
              <Button variant="ghost" size="sm">2</Button>
              <Button variant="ghost" size="sm">3</Button>
              <span className="text-gray-500 px-2">...</span>
              <Button variant="ghost" size="sm">67</Button>
              <Button variant="ghost" size="sm">68</Button>

              <Button variant="outline" size="icon">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}