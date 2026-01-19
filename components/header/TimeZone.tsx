import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import API_URL from '@/app/utils/ENV'
import { useCookies } from 'next-client-cookies'

// Type definitions
interface TimezoneOption {
  key: string;
  label: string;
}

interface CurrentTimezoneResponse {
  timezone: string;
}

interface TimezoneListResponse {
  timezones: TimezoneOption[];
}

interface LoadingState {
  current: boolean;
  list: boolean;
  update: boolean;
}

const TimeZone: React.FC = () => {
  const [timezone, setTimezone] = useState<string>('')
  const [availableTimezones, setAvailableTimezones] = useState<TimezoneOption[]>([])
  const [loading, setLoading] = useState<LoadingState>({
    current: true,
    list: true,
    update: false
  })
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [selectedTimezone, setSelectedTimezone] = useState<string>('')
  const cookies = useCookies()
  const token = cookies.get('access_token') || ''

  // Fetch current timezone
  const fetchCurrentTimezone = useCallback(async (): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, current: true }))
      const response = await fetch(`${API_URL}/api/profiles/user/timezone/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: CurrentTimezoneResponse = await response.json()
      setTimezone(data.timezone)
      setSelectedTimezone(data.timezone)
      setError('')
    } catch (err) {
      setError('Failed to fetch current timezone')
      console.error('Error fetching timezone:', err)
    } finally {
      setLoading(prev => ({ ...prev, current: false }))
    }
  }, [token])

  // Fetch available timezones
  const fetchAvailableTimezones = useCallback(async (): Promise<void> => {
    try {
      setLoading(prev => ({ ...prev, list: true }))
      const response = await fetch(`${API_URL}/api/profiles/timezones/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: TimezoneListResponse = await response.json()
      setAvailableTimezones(data.timezones || [])
      setError('')
    } catch (err) {
      setError('Failed to fetch available timezones')
      console.error('Error fetching timezone list:', err)
    } finally {
      setLoading(prev => ({ ...prev, list: false }))
    }
  }, [token])

  // Update timezone
  const updateTimezone = useCallback(async (newTimezone: string): Promise<void> => {
    if (!newTimezone || newTimezone === timezone) return

    try {
      setLoading(prev => ({ ...prev, update: true }))
      setError('')
      setSuccessMessage('')

      const response = await fetch(`${API_URL}/api/profiles/user/timezone/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ timezone: newTimezone })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setTimezone(newTimezone)
      setSuccessMessage('Timezone updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (err) {
      setError('Failed to update timezone')
      console.error('Error updating timezone:', err)
    } finally {
      setLoading(prev => ({ ...prev, update: false }))
    }
  }, [timezone, token])

  // Handle timezone selection change with immediate API call
  const handleTimezoneChange = useCallback((value: string): void => {
    setSelectedTimezone(value)
    setSuccessMessage('')
    // Call API immediately on selection
    updateTimezone(value)
  }, [updateTimezone])

  // Load data on component mount
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      await Promise.all([
        fetchCurrentTimezone(),
        fetchAvailableTimezones()
      ])
    }
    loadData()
  }, [fetchCurrentTimezone, fetchAvailableTimezones])

  return (
    <Card className="w-full">
   
      <CardContent className="">
       

        {/* Timezone Selector */}
        <div className="space-y-0">
          <h3 className="text-sm font-medium">Select Timezone</h3>
          {loading.list ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={selectedTimezone} 
              onValueChange={handleTimezoneChange}
              disabled={loading.update}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a timezone">
                  {selectedTimezone ? (
                    availableTimezones.find(tz => tz.key === selectedTimezone)?.label || selectedTimezone
                  ) : (
                    'Select a timezone'
                  )}
                </SelectValue>
                {loading.update && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
              </SelectTrigger>
              <SelectContent>
                {availableTimezones.map((tz) => (
                  <SelectItem key={tz.key} value={tz.key}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tz.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {tz.key}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Indicators */}
        <div className="space-y-3">
          {loading.update && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Updating timezone...
            </div>
          )}
          
          {selectedTimezone && selectedTimezone !== timezone && !loading.update && (
            <div className="text-sm text-amber-600">
              Timezone will be updated to: {selectedTimezone}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TimeZone