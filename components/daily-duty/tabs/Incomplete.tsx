import { useCookies } from 'next-client-cookies';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Progress,
} from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  User,
  TrendingUp,
  Search,
  Download,
  BarChart3,
  Filter,
  RefreshCw,
  FileText,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import API_URL from '@/app/utils/ENV';
import ExportButton from '@/app/utils/ExportButton';
import { formatToDDMMYYYY } from '@/app/utils/DateFormat';

interface UserWeek {
  id: number;
  user: number;
  reference_period: number;
  week_number: number;
  week_hours: number;
  week_status: string;
  signature: string | null;
  is_approved: boolean;
  approver_signature: string | null;
  approver_remarks: string | null;
  week_start_date: string | null;
  week_end_date: string | null;
  allowed_hours: number;
  total_hours_worked: number;
  average_hours: number;
  wtd_hours_remaining: number;
  average_remaining: number;
}

interface Log {
  id: number;
  user_week: number;
  child_rota: number;
  shift: number;
  shift_name: string;
  vehicle: number | null;
  vehicle_registration?: string;
  date: string;
  day: string;
  start_mileage: number | null;
  end_mileage: number | null;
  duty_start_time: string;
  duty_end_time: string;
  driving_duty_hours: string;
  driving_duty_hours_2: string;
  other_duty_hours: string;
  other_duty_hours_2: string;
  time_spent: string;
  total_duty_time: string;
  breaks_taken: string;
  breaks_taken_2: string;
  on_duty: boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
}

interface WeekData {
  userweek: UserWeek;
  logs: Log[];
}

const Incomplete = () => {
  const { id } = useParams();
  const token = useCookies().get('access_token');
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const router = useRouter()

  useEffect(() => {
    fetchIncompletedWeeks();
  }, [id, token]);
  const handleLogClick = (log: Log) => {
    // Navigate to detail page with log data as query parameters
    // router.push(`/detail-page?data=${encodeURIComponent(JSON.stringify(log))}`);

    // OR if you want to use dynamic routing with a route parameter:
    // router.push(`/duty-logs/${log.id}?day=${log.day}&date=${log.date}`);

    // OR if you want to pass state (recommended for larger objects):
    if (log.on_duty) {
      router.push(
        `/dashboard/users/daily-duty-logs/${id}/${log.day}?logData=${encodeURIComponent(JSON.stringify(log))}`
      );
    }
  };
  const fetchIncompletedWeeks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_URL}/activity/wtd?week_status=incomplete&user_id=${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch completed weeks');
      }

      const data = await response.json();
      setWeeks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching completed weeks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalWeeks = weeks.length;
    const approvedWeeks = weeks.filter(w => w.userweek.is_approved).length;
    const pendingWeeks = totalWeeks - approvedWeeks;
    const totalHours = weeks.reduce((sum, w) => sum + w.userweek.total_hours_worked, 0);
    const avgUtilization = totalWeeks > 0
      ? weeks.reduce((sum, w) => sum + (w.userweek.total_hours_worked / w.userweek.allowed_hours) * 100, 0) / totalWeeks
      : 0;

    return { totalWeeks, approvedWeeks, pendingWeeks, totalHours, avgUtilization };
  }, [weeks]);

  // Filter weeks based on search and tab
  const filteredWeeks = useMemo(() => {
    let filtered = weeks;

    if (selectedTab === 'approved') {
      filtered = filtered.filter(w => w.userweek.is_approved);
    } else if (selectedTab === 'pending') {
      filtered = filtered.filter(w => !w.userweek.is_approved);
    }

    if (searchQuery) {
      filtered = filtered.filter(w =>
        w.userweek.week_number.toString().includes(searchQuery) ||
        w.userweek.reference_period.toString().includes(searchQuery) ||
        w.userweek.week_start_date?.includes(searchQuery)
      );
    }

    return filtered;
  }, [weeks, selectedTab, searchQuery]);

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return '-';
    const [hours, minutes] = timeString.split(':');
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return formatToDDMMYYYY(dateString);
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return 'Date range unavailable';
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const calculateTotalDrivingHours = (logs: Log[]) => {
    return logs.reduce((total, log) => {
      if (log.driving_duty_hours !== '00:00:00') {
        const [hours] = log.driving_duty_hours.split(':');
        return total + parseInt(hours);
      }
      return total;
    }, 0);
  };

  const calculateTotalOtherHours = (logs: Log[]) => {
    return logs.reduce((total, log) => {
      if (log.other_duty_hours !== '00:00:00') {
        const [hours] = log.other_duty_hours.split(':');
        return total + parseInt(hours);
      }
      return total;
    }, 0);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getUtilizationBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-50 border-red-200';
    if (percentage >= 75) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="border-0 shadow-lg bg-red-50">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Unable to Load Data</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {error}
            </AlertDescription>
          </Alert>
          <Button
            onClick={fetchIncompletedWeeks}
            size="lg"
            className="mt-6 shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="rounded-full bg-gradient-to-br from-blue-100 to-blue-50 p-6 mb-6">
                <Calendar className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No Incompleted Weeks</h3>
              <p className="text-slate-600 max-w-md mb-6">
                There are no completed weeks available yet. Incompleted weeks will appear here once submitted and processed.
              </p>
              <Button onClick={fetchIncompletedWeeks} variant="outline" size="lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Incompleted Weeks
            </h1>
            <p className="text-slate-600 mt-2">
              Track and manage work time directive compliance
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={filteredWeeks} fileName='Incomplete-duty-logs' />
            <Button onClick={fetchIncompletedWeeks} variant="outline" size="lg" className="shadow-sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>


        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by week number or reference period..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-[#E63946] transition-colors"
                />
              </div>
              <Button variant="outline" className="sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Content */}
        {/* <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6"> */}
        {/* <TabsList className="bg-white border-0 shadow-sm p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#E63946] data-[state=active]:text-white">
              All Weeks ({weeks.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-[#F77F00] data-[state=active]:text-white">
              Approved ({stats.approvedWeeks})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#FCBF49] data-[state=active]:text-white">
              Pending ({stats.pendingWeeks})
            </TabsTrigger>
          </TabsList> */}

        {/* <TabsContent value={selectedTab} className="space-y-4"> */}
        {filteredWeeks.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No weeks found</h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredWeeks.map((weekData) => {
              const { userweek, logs } = weekData;
              const utilizationPercentage = (userweek.total_hours_worked / userweek.allowed_hours) * 100;
              const totalDrivingHours = calculateTotalDrivingHours(logs);
              const totalOtherHours = calculateTotalOtherHours(logs);

              return (
                <AccordionItem
                  key={userweek.id}
                  value={`week-${userweek.id}`}
                  className="border-0 shadow-sm rounded-xl overflow-hidden bg-white"
                >
                  <AccordionTrigger className="hover:no-underline px-6 py-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#E63946]/10 rounded-lg border border-[#E63946]/20">
                            <Calendar className="h-4 w-4 text-[#E63946]" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-900">Week {userweek.week_number}</p>
                            <p className="text-xs text-slate-500">{formatDateRange(userweek.week_start_date, userweek.week_end_date)}</p>
                          </div>
                        </div>

                        <Badge
                          variant={userweek.is_approved ? "default" : "secondary"}
                          className={userweek.is_approved
                            ? "bg-[#F77F00] text-white hover:bg-[#F77F00] border-[#F77F00]"
                            : "bg-[#FCBF49] text-slate-800 hover:bg-[#FCBF49] border-[#FCBF49]"
                          }
                        >
                          {userweek.is_approved ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>

                        <Badge variant="outline" className="border-slate-300">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          RP {userweek.reference_period}
                        </Badge>
                      </div>

                      <div className="hidden lg:flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{userweek.total_hours_worked}h</p>
                          <p className="text-xs text-slate-500">of {userweek.allowed_hours}h</p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg border ${getUtilizationBgColor(utilizationPercentage)}`}>
                          <p className={`text-lg font-bold ${getUtilizationColor(utilizationPercentage)}`}>
                            {utilizationPercentage.toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-600">utilized</p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6">
                      {/* Stats Grid */}
                      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <Card className="border border-slate-200 shadow-none">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="h-4 w-4 text-[#E63946]" />
                                  <p className="text-xs font-medium text-slate-600">Total Worked</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{userweek.total_hours_worked}h</p>
                              </CardContent>
                            </Card>
                            
                            <Card className="border border-slate-200 shadow-none">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Truck className="h-4 w-4 text-[#F77F00]" />
                                  <p className="text-xs font-medium text-slate-600">Driving</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{totalDrivingHours}h</p>
                                <Progress 
                                  value={(totalDrivingHours / userweek.total_hours_worked) * 100} 
                                  className="mt-2 h-1.5" 
                                />
                              </CardContent>
                            </Card>
                            
                            <Card className="border border-slate-200 shadow-none">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-[#FCBF49]" />
                                  <p className="text-xs font-medium text-slate-600">Other Duties</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{totalOtherHours}h</p>
                                <Progress 
                                  value={(totalOtherHours / userweek.total_hours_worked) * 100} 
                                  className="mt-2 h-1.5" 
                                />
                              </CardContent>
                            </Card>
                            
                            <Card className="border border-slate-200 shadow-none">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="h-4 w-4 text-[#E63946]" />
                                  <p className="text-xs font-medium text-slate-600">Avg Daily</p>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{userweek.average_hours.toFixed(1)}h</p>
                              </CardContent>
                            </Card>
                          </div> */}

                      {/* Daily Logs Table */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">Daily Activity Logs</h3>
                          <Badge variant="outline">{logs.length} days logged</Badge>
                        </div>
                        <div className="rounded-lg border border-slate-200 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Day</TableHead>
                                <TableHead className="font-semibold">Shift</TableHead>
                                <TableHead className="font-semibold">Vehicle</TableHead>
                                <TableHead className="font-semibold">Duty Hours</TableHead>
                                <TableHead className="font-semibold">Driving</TableHead>
                                <TableHead className="font-semibold">Other Duty</TableHead>
                                <TableHead className="font-semibold">Breaks</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {logs.map((log) => (
                                <TableRow key={log.id} onClick={() => handleLogClick(log)} className="hover:bg-slate-50">
                                  <TableCell className="font-medium">
                                    {formatDate(log.date)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-medium">
                                      {log.day}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <Badge variant="secondary" className="mb-1">
                                        {log.shift_name}
                                      </Badge>
                                      <p className="text-xs text-slate-500">
                                        {log.duty_start_time} - {log.duty_end_time}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {log.vehicle_registration ? (
                                      <Badge variant="outline" className="border-[#F77F00]/30 bg-[#F77F00]/10 text-[#F77F00]">
                                        <Truck className="h-3 w-3 mr-1" />
                                        {log.vehicle_registration}
                                      </Badge>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">{formatTime(log.total_duty_time)}</TableCell>
                                  <TableCell className="text-[#F77F00] font-medium">{formatTime(log.driving_duty_hours)}</TableCell>
                                  <TableCell className="text-[#FCBF49] font-medium">{formatTime(log.other_duty_hours)}</TableCell>
                                  <TableCell className="text-[#E63946] font-medium">{formatTime(log.breaks_taken)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Approver Info if approved */}
                      {userweek.is_approved && userweek.approver_remarks && (
                        <Card className="border border-[#F77F00]/30 bg-[#F77F00]/10">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-[#F77F00] mt-0.5" />
                              <div>
                                <p className="font-medium text-slate-900 mb-1">Approved</p>
                                <p className="text-sm text-slate-700">{userweek.approver_remarks}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        {/* </TabsContent> */}
        {/* </Tabs> */}
      </div>
    </div>
  );
};

export default Incomplete;