"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {  Plus, MapPin, Truck, Users } from "lucide-react";

import GradientButton from "@/app/utils/GradientButton";
import Link from "next/link";
import { sitesData } from "@/app/data/sites";



export default function SiteGrid() {
  return (
    <section className="p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-sm text-gray-500">See sites list</p>
        </div>
        <GradientButton text="Add Site" Icon={Plus} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {sitesData.map((site, index) => (
          <Card
            key={index}
            className="rounded-xl shadow-sm border border-gray-200 overflow-hidden p-0"
          >
            <div className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-sm text-gray-800">{site.name}</h2>
                </div>
                <div className="flex gap-1">
                  <Badge
                    className={`text-xs font-medium ${
                      site.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : site.status === "On Hold"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {site.status}
                  </Badge>
                  <div className="flex items-center bg-rose w-6 justify-center rounded-full h-6 gap-1">
                    <span className="text-white text-xs font-medium">{site.alerts}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between px-2 items-center min-w-full text-gray-500 mt-1">
              <div className="flex items-center w-fit">
                <MapPin className="w-4 h-4 text-rose" />
                {site.location.city}
              </div>
              <div className="flex items-center w-fit">
                <p className="text-xs w-fit text-gray-400">ZipCode: {site.location.zipCode}</p>
              </div>
            </div>
            <div className="px-4 mt-3 flex gap-2 flex-wrap">
              {site.shifts.map((shift, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                    shift.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {shift.name}
                </span>
              ))}
            </div>
            <div className="bg-[#FFF0EB] mt-3 mx-4 rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#F97316] font-semibold">
                <Truck className="w-4 h-4" />
                Authorized Vehicle
              </div>
              <div className="text-[#F97316] font-bold text-sm">{site.authorizedVehicles}</div>
            </div>
            <div className="bg-gray-100 mt-3 mx-4 rounded-lg px-4 py-3">
              <div className="flex justify-between items-center text-sm font-semibold text-[#B91C1C]">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-orange" />
                  <span className="text-black text-lg font-bold">Staff on Site</span>
                </div>
                <span>{`${site.staff.current}/${site.staff.capacity}`}</span>
              </div>
              <div className="flex gap-2 mt-2 text-xs justify-evenly items-center">
                {site.staff.breakdown.slice(0, 3).map((role, idx) => (
                  <div
                    key={idx}
                    className="text-white flex flex-col justify-center items-center px-2 py-1 rounded-full"
                  >
                    <span className="text-black text-lg text-bold font-medium">{role.count}</span>
                    <span className="text-xs w-fit text-gray-800">{role.role}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="text-xs font-medium text-[#B91C1C] mb-1">Utilizations</div>
                <div className="relative h-2 bg-[#FCA5A5] rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-[#B91C1C]"
                    style={{ width: site.staff.utilization }}
                  ></div>
                </div>
                <div className="text-right text-xs font-semibold text-[#B91C1C] mt-1">
                  {site.staff.utilization}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-4 px-4">
              <p>Geofencing: {`${site.location.geofencing.latitude}, ${site.location.geofencing.longitude}`}</p>
              <p className="mt-1">
                Last Updated: {new Date(site.lastUpdated).toLocaleString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
            <div className="px-4 mt-3 flex justify-end pb-4">
              <Link href={`/dashboard/sites/${index}`} className="text-md  underline hover:text-magenta cursor-pointer text-bold text-right w-fit  text-orange">
                see more...
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}