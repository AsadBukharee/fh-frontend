/* eslint-disable react/no-unescaped-entities */
'use client';

import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import React, { useEffect, useState } from 'react';

// Define TypeScript interfaces for the API response
interface JobSummary {
  date?: string;
  driver: string;
  vehicle_registration: string;
  start_mileage: number;
  su_runs: string;
  internal_jobs_operational: string;
  internal_transfers: string;
  maintenance_runs: string;
  total_jobs: number;
  total_mileage: number;
  end_mileage: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    date_from: string;
    date_to: string;
    results: JobSummary[];
  };
}

const TodayMileagePage = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
const cookies=useCookies();
  const fetchData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch(`${API_URL}/activity/operations/today-mileage/`, {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          'Authorization': `Bearer ${cookies.get("access_token")}`,
        },
        cache: 'no-store', // Prevent caching for fresh data
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh if enabled
    let intervalId: NodeJS.Timeout;
    if (autoRefresh) {
      intervalId = setInterval(fetchData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  // Helper function to parse job details
  const parseJobDetails = (suRuns: string) => {
    const [jobsPart, kmsPart] = suRuns.split('/');
    if (!jobsPart || !kmsPart) return { jobCount: '0', mileage: '0' };
    
    const jobCount = jobsPart.replace('jobs', '').trim();
    const mileage = kmsPart.replace('kms', '').trim();
    return { jobCount, mileage };
  };

  // Helper function to parse internal jobs
  const parseInternalJobs = (internalJobs: string) => {
    const [jobs, distance] = internalJobs.split('/');
    return { jobs: jobs || '0', distance: distance || '0' };
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!data?.data?.results) return null;

    return data.data.results.reduce(
      (acc, item) => ({
        totalJobs: acc.totalJobs + item.total_jobs,
        totalMileage: acc.totalMileage + item.total_mileage,
        vehicles: acc.vehicles + 1,
      }),
      { totalJobs: 0, totalMileage: 0, vehicles: 0 }
    );
  };

  const totals = calculateTotals();

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg font-medium">Loading today's mileage data...</p>
          <p className="text-gray-400 text-sm">Fetching operational information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-red-100">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Error Loading Data</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                fetchData();
              }}
              className="flex-1 px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success || !data.data.results.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600 mb-6">No mileage operations recorded for today.</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  const { date_from, date_to, results } = data.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Today's Mileage Operations</h1>
              <p className="text-gray-600 mt-2">
                {date_from === date_to 
                  ? `Date: ${new Date(date_from).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                  : `Period: ${new Date(date_from).toLocaleDateString()} to ${new Date(date_to).toLocaleDateString()}`
                }
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">
                  Last updated: {lastUpdated || 'Never'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                    autoRefresh
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Vehicles</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totals.vehicles}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Jobs</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totals.totalJobs}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Mileage</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totals.totalMileage.toFixed(1)} km</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Avg. per Vehicle</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {totals.vehicles > 0 ? (totals.totalMileage / totals.vehicles).toFixed(1) : 0} km
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Operations Details</h2>
            <p className="text-sm text-gray-500 mt-1">Detailed breakdown of each vehicle's mileage and jobs</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vehicle Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mileage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    SU Runs
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Internal Jobs
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((item, index) => {
                  const { jobCount, mileage } = parseJobDetails(item.su_runs);
                  const { jobs: internalJobs } = parseInternalJobs(item.internal_jobs_operational);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.vehicle_registration}</div>
                            <div className="text-xs text-gray-500">ID: {index + 1}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {item.driver || (
                            <span className="text-gray-400 italic">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-24">Start:</span>
                            <span className="font-medium">{item.start_mileage.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-24">End:</span>
                            <span className="font-medium text-green-600">{item.end_mileage.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500 w-24">Total:</span>
                            <span className="font-medium text-orange-600">{item.total_mileage.toFixed(1)} km</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex flex-col bg-orange-50 rounded-lg p-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-orange-700">{jobCount} jobs</span>
                          </div>
                          <div className="text-xs text-orange-600 mt-1">{mileage} kilometers</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">Operational: {internalJobs}</div>
                          <div className="text-gray-500 text-xs mt-1">Transfers: {item.internal_transfers}</div>
                          <div className="text-gray-500 text-xs">Maintenance: {item.maintenance_runs}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start space-y-2">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.total_jobs > 0 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.total_jobs} Total Jobs
                          </span>
                          {item.total_mileage > 100 && (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                              High Mileage
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Mileage Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mileage Distribution</h3>
            <div className="space-y-4">
              {results.map((item, index) => {
                const percentage = totals ? (item.total_mileage / totals.totalMileage * 100) : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.vehicle_registration}</span>
                      <span className="text-gray-600">{item.total_mileage.toFixed(1)} km ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm font-medium text-orange-700">SU Runs</span>
                <span className="text-lg font-bold text-orange-600">
                  {results.reduce((sum, item) => {
                    const { jobCount } = parseJobDetails(item.su_runs);
                    return sum + parseInt(jobCount || '0');
                  }, 0)} jobs
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Internal Jobs</span>
                <span className="text-lg font-bold text-green-600">
                  {results.reduce((sum, item) => {
                    const { jobs } = parseInternalJobs(item.internal_jobs_operational);
                    return sum + parseInt(jobs || '0');
                  }, 0)} jobs
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-700">Transfers</span>
                <span className="text-lg font-bold text-purple-600">
                  {results.reduce((sum, item) => {
                    const [transfers] = item.internal_transfers.split('/');
                    return sum + parseInt(transfers || '0');
                  }, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="font-medium text-gray-700">Print Report</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  const csvContent = [
                    ['Vehicle', 'Driver', 'Start Mileage', 'End Mileage', 'Total Mileage', 'Total Jobs', 'SU Runs'],
                    ...results.map(item => [
                      item.vehicle_registration,
                      item.driver,
                      item.start_mileage,
                      item.end_mileage,
                      item.total_mileage,
                      item.total_jobs,
                      item.su_runs
                    ])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mileage-report-${date_from}.csv`;
                  a.click();
                }}
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-gray-700">Export as CSV</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  const summary = `Mileage Report for ${date_from}\n\n` +
                    results.map(item => 
                      `${item.vehicle_registration}: ${item.total_mileage}km (${item.total_jobs} jobs)`
                    ).join('\n');
                  alert(summary);
                }}
                className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-700">View Summary</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
          <p>
            Data fetched from operations system • Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          {lastUpdated && (
            <p className="mt-1">
              Last auto-refresh: {lastUpdated} • {autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayMileagePage;