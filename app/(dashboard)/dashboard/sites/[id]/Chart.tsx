"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Dummy data for the chart
const fuelUsageData = [
  { month: "Jan", usage: 5000 },
  { month: "Feb", usage: 8000 },
  { month: "Mar", usage: 12000 },
  { month: "Apr", usage: 10000 },
  { month: "May", usage: 55670 },
  { month: "Jun", usage: 15000 },
  { month: "Jul", usage: 20000 },
  { month: "Aug", usage: 18000 },
  { month: "Sep", usage: 17000 },
  { month: "Oct", usage: 14000 },
  { month: "Nov", usage: 9000 },
];

// Dummy data for statistics
const stats = {
  employees: { total: 30, operationalToday: 21 },
  vehicles: { total: 30, operationalToday: 18 },
};

const dummyWeeklyTotal = 1250;
const dummyMonthlyTotal = 4850;

export default function OperationalStatistics() {
  return (
    <div className="p-6 bg-white min-h-screen text-gray-700">
      <Card className="w-full border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-2xl font-bold">Operational Statistics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Employees</h3>
              </div>
              <p className="text-sm text-gray-600">Total: {stats.employees.total}</p>
              <p className="text-sm text-green-600">
                Operational Today: {stats.employees.operationalToday}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Vehicles</h3>
              </div>
              <p className="text-sm text-gray-600">Total: {stats.vehicles.total}</p>
              <p className="text-sm text-green-600">
                Operational Today: {stats.vehicles.operationalToday}
              </p>
            </div>
          </div>
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-xl font-semibold">Fuel Usage (Liters)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#374151" />
                    <YAxis stroke="#374151" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend align="center" verticalAlign="top" height={36} />
                    <Bar
                      dataKey="usage"
                      fill="#f472b6"
                      radius={[6, 6, 0, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-600">
                <span>{dummyWeeklyTotal.toLocaleString()} This Week</span>
                <span>{dummyMonthlyTotal.toLocaleString()} This Month</span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}