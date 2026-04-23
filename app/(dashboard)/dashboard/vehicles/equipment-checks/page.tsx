'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  ChevronDown,
  Car,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Edit,
  Trash2,
  Printer,
  Share2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface Check {
  id: number;
  date: string;
  vehicleReg: string;
  auditor: string;
  driver: string;
  checkType: 'Daily' | 'Weekly';
  status: 'Passed' | 'Failed' | 'Advisory';
}

// Mock data for different tabs
const todayChecks: Check[] = [
  { id: 1, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'John Smith', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Passed' },
  { id: 2, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'David Joe', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Advisory' },
  { id: 3, date: '18 Dec 2025', vehicleReg: 'AB21-XYZ', auditor: 'Parker Will', driver: 'Jenny Wilson', checkType: 'Daily', status: 'Passed' },
];

const submittedChecks: Check[] = [
  { id: 4, date: '17 Dec 2025', vehicleReg: 'CD22-ABC', auditor: 'Max Will', driver: 'Robert Brown', checkType: 'Weekly', status: 'Passed' },
  { id: 5, date: '17 Dec 2025', vehicleReg: 'EF23-DEF', auditor: 'Sarah Johnson', driver: 'Michael Davis', checkType: 'Daily', status: 'Failed' },
];

const rejectedChecks: Check[] = [
  { id: 6, date: '16 Dec 2025', vehicleReg: 'GH24-GHI', auditor: 'Tom Wilson', driver: 'Emma Wilson', checkType: 'Weekly', status: 'Failed' },
  { id: 7, date: '16 Dec 2025', vehicleReg: 'IJ25-JKL', auditor: 'Lisa Anderson', driver: 'James Miller', checkType: 'Daily', status: 'Failed' },
  { id: 8, date: '15 Dec 2025', vehicleReg: 'KL26-MNO', auditor: 'David Lee', driver: 'Patricia Taylor', checkType: 'Weekly', status: 'Failed' },
];

const remedialChecks: Check[] = [
  { id: 9, date: '14 Dec 2025', vehicleReg: 'MN27-PQR', auditor: 'Paul Walker', driver: 'Jennifer White', checkType: 'Daily', status: 'Advisory' },
  { id: 10, date: '14 Dec 2025', vehicleReg: 'OP28-STU', auditor: 'Emma Thompson', driver: 'Richard Harris', checkType: 'Weekly', status: 'Advisory' },
];

const allChecks: Check[] = [
  ...todayChecks,
  ...submittedChecks,
  ...rejectedChecks,
  ...remedialChecks,
  { id: 11, date: '13 Dec 2025', vehicleReg: 'QR29-VWX', auditor: 'Chris Evans', driver: 'Susan Clark', checkType: 'Daily', status: 'Passed' },
  { id: 12, date: '12 Dec 2025', vehicleReg: 'ST30-YZA', auditor: 'Mark Roberts', driver: 'Daniel Lewis', checkType: 'Weekly', status: 'Passed' },
];

export default function VehicleChecklist() {
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'today';

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const renderTable = (data: Check[]) => (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>Check Date</TableHead>
          <TableHead>Vehicle Reg</TableHead>
          <TableHead>Auditor</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Check Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} className="hover:bg-muted/40">
            <TableCell>{row.date}</TableCell>
            <TableCell>{row.vehicleReg}</TableCell>
            <TableCell>{row.auditor}</TableCell>
            <TableCell>{row.driver}</TableCell>

            <TableCell>
              <Badge className="rounded-full bg-orange-100 text-orange-700">
                {row.checkType}
              </Badge>
            </TableCell>

            <TableCell>
              {row.status === 'Passed' && (
                <Badge className="rounded-full bg-green-100 text-green-700">Passed</Badge>
              )}
              {row.status === 'Failed' && (
                <Badge className="rounded-full bg-red-100 text-red-700">Failed</Badge>
              )}
              {row.status === 'Advisory' && (
                <Badge className="rounded-full bg-yellow-100 text-yellow-700">Advisory</Badge>
              )}
            </TableCell>

            <TableCell className="text-right">
              <ActionDropdown row={row} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Vehicle Equipment Checklist
            </h1>
            <p className="text-sm text-muted-foreground">
              Fleet safety inspection management
            </p>
          </div>

          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Download className="w-4 h-4" />
            Download PSD
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat title="Total Checks" value="12" icon={Car} color="bg-pink-100 text-pink-600" />
          <Stat title="Passed" value="5" icon={CheckCircle} color="bg-green-100 text-green-600" />
          <Stat title="Failed" value="4" icon={XCircle} color="bg-red-100 text-red-600" />
          <Stat title="Advisory" value="3" icon={AlertTriangle} color="bg-yellow-100 text-yellow-600" />
          <Stat title="Pending" value="5" icon={Clock} color="bg-orange-100 text-orange-600" />
        </div>

        {/* Tabs using shadcn */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="today">
              Today checks ({todayChecks.length})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Submitted ({submittedChecks.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedChecks.length})
            </TabsTrigger>
            <TabsTrigger value="remedial">
              Remedial Required ({remedialChecks.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All History ({allChecks.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="mt-6">
            <TabsContent value="today">
              <Card className="border-0 overflow-hidden">
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="pl-9 h-9"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {['Check Type', 'Date & Time', 'Driver', 'Vehicle', 'Status'].map((f) => (
                      <Button key={f} variant="outline" size="sm" className="gap-1">
                        {f}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                {renderTable(todayChecks)}

                {/* Pagination */}
                <Pagination />
              </Card>
            </TabsContent>

            <TabsContent value="submitted">
              <Card className="border-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['Check Type', 'Date & Time', 'Driver', 'Vehicle', 'Status'].map((f) => (
                      <Button key={f} variant="outline" size="sm" className="gap-1">
                        {f}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
                {renderTable(submittedChecks)}
                <Pagination />
              </Card>
            </TabsContent>

            <TabsContent value="rejected">
              <Card className="border-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['Check Type', 'Date & Time', 'Driver', 'Vehicle', 'Status'].map((f) => (
                      <Button key={f} variant="outline" size="sm" className="gap-1">
                        {f}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
                {renderTable(rejectedChecks)}
                <Pagination />
              </Card>
            </TabsContent>

            <TabsContent value="remedial">
              <Card className="border-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['Check Type', 'Date & Time', 'Driver', 'Vehicle', 'Status'].map((f) => (
                      <Button key={f} variant="outline" size="sm" className="gap-1">
                        {f}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
                {renderTable(remedialChecks)}
                <Pagination />
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <Card className="border-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search"
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['Check Type', 'Date & Time', 'Driver', 'Vehicle', 'Status'].map((f) => (
                      <Button key={f} variant="outline" size="sm" className="gap-1">
                        {f}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
                {renderTable(allChecks)}
                <Pagination />
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// Action Dropdown Component
function ActionDropdown({ row }: { row: Check }) {
  const handleAction = (action: string) => {
    console.log(`${action} clicked for row ${row.id}`);
    switch (action) {
      case 'view':
        // Handle view action
        break;
      case 'report':
        // Handle report action
        break;
      case 'edit':
        // Handle edit action
        break;
      case 'print':
        // Handle print action
        break;
      case 'share':
        // Handle share action
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this check?')) {
          console.log('Deleting check:', row.id);
        }
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleAction('view')}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('report')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>View Report</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('edit')}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Check</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => handleAction('print')}>
            <Printer className="mr-2 h-4 w-4" />
            <span>Print Report</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('share')}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleAction('delete')}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Check</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Pagination Component
function Pagination() {
  return (
    <div className="flex items-center justify-between p-4 border-t text-sm">
      <span className="text-muted-foreground">
        Row Page <strong>01</strong>
      </span>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button size="sm" className="bg-orange-500 text-white">1</Button>
        <Button size="sm" variant="ghost">2</Button>
        <Button size="sm" variant="ghost">3</Button>
        <span className="px-2">...</span>
        <Button size="sm" variant="ghost">67</Button>
        <Button size="sm" variant="ghost">68</Button>
        <Button variant="ghost" size="icon">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function Stat({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}