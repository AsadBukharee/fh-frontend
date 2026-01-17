'use client';

import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Clock, Car, Gauge } from 'lucide-react';

interface DutyLog {
  id: number;
  day: string;
  date: string;
  shift_name: string;
  vehicle_registration?: string | null;
  duty_start_time: string;
  duty_end_time: string;
  start_mileage?: number | null;
  end_mileage?: number | null;
  total_duty_time: string;
}

interface WeekData {
  week_start: string;
  week_end: string;
  logs: DutyLog[];
}

function getStatus(log: DutyLog) {
  if (log.shift_name === 'OFF') return 'OFF Day';
  if (log.total_duty_time === '00:00:00') return 'Incomplete';
  return 'Complete';
}

export default function DutyLogsPage() {
  const { id } = useParams();
  const router = useRouter(); // Initialize router
  const token = useCookies().get('access_token');
  const [data, setData] = useState<WeekData | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/activity/duty-logs/fetch-week/?user_id=${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setData);
  }, [id, token]);

  const handleLogClick = (log: DutyLog) => {
    // Navigate to detail page with log data as query parameters
    // router.push(`/detail-page?data=${encodeURIComponent(JSON.stringify(log))}`);
    
    // OR if you want to use dynamic routing with a route parameter:
    // router.push(`/duty-logs/${log.id}?day=${log.day}&date=${log.date}`);
    
    // OR if you want to pass state (recommended for larger objects):
    router.push(
      `/dashboard/users/daily-duty-logs/${id}/${log.day}?logData=${encodeURIComponent(JSON.stringify(log))}`
    );
  };

  if (!data) return null;

  return (
    <div className="bg-muted/40 p-6 rounded-xl">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Current Week Logs</h2>
        <p className="text-sm text-muted-foreground">
          Logs for the current working week only
        </p>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {data.logs.map(log => {
          const status = getStatus(log);

          return (
            <div
              key={log.id}
              onClick={() => handleLogClick(log)} // Added click handler
              className="flex items-center justify-between rounded-lg bg-white px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors" // Added cursor and hover
            >
              {/* Day + Vehicle */}
              <div className="min-w-[210px]">
                <p className="font-medium">
                  {log.day}{' '}
                  <span className="text-xs text-muted-foreground">
                    ({log.date})
                  </span>
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Car className="h-3.5 w-3.5" />
                  {log.vehicle_registration ?? '—'}
                </div>
              </div>

              <SoftDivider />

              {/* Shift */}
              <div className="min-w-[170px] flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {log.duty_start_time.slice(0, 5)} –{' '}
                {log.duty_end_time.slice(0, 5)}
              </div>

              <SoftDivider />

              {/* Mileage */}
              <div className="min-w-[150px] flex items-center gap-2 text-sm text-muted-foreground">
                <Gauge className="h-4 w-4" />
                {log.start_mileage != null && log.end_mileage != null
                  ? `${log.start_mileage} – ${log.end_mileage}`
                  : '—'}
              </div>

              <SoftDivider />

              {/* Total */}
              <div className="min-w-[120px] text-sm font-medium text-purple-600">
                Total:{' '}
                {log.total_duty_time !== '00:00:00'
                  ? log.total_duty_time
                  : '0h'}
              </div>

              {/* Status */}
              <Badge
                className={
                  status === 'Complete'
                    ? 'bg-green-100 text-green-700'
                    : status === 'Incomplete'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }
              >
                {status}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SoftDivider() {
  return <div className="mx-4 h-6 w-px bg-border/60" />;
}