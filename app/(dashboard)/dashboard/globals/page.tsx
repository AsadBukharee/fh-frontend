// app/globals/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Clock, Database, Car, RefreshCw, Check, X } from 'lucide-react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';

interface GlobalSettings {
  id: number;
  year_start_date: string;
  year_end_date: string;
  site_start_time: string;
  vehicle_recall_after_the_date: string;
  holiday_reset_after_the_date: string;
  database: string;
}

export default function GlobalsPage() {
  const cookies = useCookies();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobals = async () => {
      const token = cookies.get('access_token');

      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/globals/globals/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch: ${res.status}`);
        }

        const json = await res.json();
        const data: GlobalSettings[] = json.data;
        const current = data[0] || null;
        setSettings(current);
        setOriginalSettings(current);
      } catch (err: any) {
        setError(err.message || 'Failed to load global settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobals();
  }, []);

  const handleUpdate = async () => {
    if (!settings) return;

    const token = cookies.get('access_token');
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/globals/globals/1/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          year_start_date: settings.year_start_date,
          year_end_date: settings.year_end_date,
          site_start_time: settings.site_start_time,
          vehicle_recall_after_the_date: settings.vehicle_recall_after_the_date,
          holiday_reset_after_the_date: settings.holiday_reset_after_the_date,
          database: settings.database,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const updated = await res.json();
      setSettings(updated.data || settings);
      setOriginalSettings(updated.data || settings);
      setSuccess('Global settings updated successfully!');
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setEditMode(false);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <Database className="w-10 h-10 text-primary" />
          Global Site Settings
        </h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-72" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-6 h-6" />
              Error
            </CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return <div>No global settings found.</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Database className="w-10 h-10 text-orange-600" />
          Global Site Settings
        </h1>

        {!editMode ? (
          <Button onClick={() => setEditMode(true)} variant="default" className=' bg-orange-500 hover:bg-orange-600'>
            Edit Settings
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button onClick={handleCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating} className=' bg-orange-500 hover:bg-orange-600'>
              {updating ? (
                <>Updating...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && editMode && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{editMode ? 'Edit Configuration' : 'Current Configuration'}</CardTitle>
          <CardDescription>
            System-wide settings • Last updated:{' '}
            <Badge variant="secondary">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Badge>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {editMode ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="year_start_date">Financial Year Start</Label>
                  <Input
                    id="year_start_date"
                    type="date"
                    value={settings.year_start_date}
                    onChange={(e) =>
                      setSettings({ ...settings, year_start_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year_end_date">Financial Year End</Label>
                  <Input
                    id="year_end_date"
                    type="date"
                    value={settings.year_end_date}
                    onChange={(e) =>
                      setSettings({ ...settings, year_end_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site_start_time">Site Start Time</Label>
                  <Input
                    id="site_start_time"
                    type="time"
                    value={settings.site_start_time}
                    onChange={(e) =>
                      setSettings({ ...settings, site_start_time: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_recall">Vehicle Recall After</Label>
                  <Input
                    id="vehicle_recall"
                    type="date"
                    value={settings.vehicle_recall_after_the_date}
                    onChange={(e) =>
                      setSettings({ ...settings, vehicle_recall_after_the_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holiday_reset">Holiday Reset After</Label>
                  <Input
                    id="holiday_reset"
                    type="date"
                    value={settings.holiday_reset_after_the_date}
                    onChange={(e) =>
                      setSettings({ ...settings, holiday_reset_after_the_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input
                    id="database"
                    type="text"
                    value={settings.database}
                    onChange={(e) =>
                      setSettings({ ...settings, database: e.target.value })
                    }
                    placeholder="e.g., dev, prod"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Financial Year</p>
                    <p className="text-xl font-semibold">
                      {formatDate(settings.year_start_date)} → {formatDate(settings.year_end_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Site Start Time</p>
                    <p className="text-xl font-semibold">{settings.site_start_time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Car className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Vehicle Recall After</p>
                    <p className="text-xl font-semibold">
                      {formatDate(settings.vehicle_recall_after_the_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <RefreshCw className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Holiday Reset After</p>
                    <p className="text-xl font-semibold">
                      {formatDate(settings.holiday_reset_after_the_date)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Database Information</p>
                  <Badge variant="outline" className="mt-2 text-base py-2 px-4">
                    {settings.database}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}