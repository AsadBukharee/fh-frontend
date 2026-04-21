"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Users,
    Truck,
    ClipboardCheck,
    ArrowRight,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Activity,
    ChevronRight,
    BarChart3,
    Loader2,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface ComplianceStats {
    drivers: { total: number; expired: number; expiringSoon: number; valid: number };
    vehicles: { total: number; expired: number; expiringSoon: number; valid: number };
}

const subPages = [
    {
        title: "Driver Compliance",
        description:
            "Track driver licences, CPC cards, tacho expiry, DBS checks, and more. Monitor upcoming expirations and ensure all drivers remain fully compliant.",
        href: "/dashboard/compliance-management/driver-management",
        icon: Users,
        gradient: "from-violet-500 to-purple-600",
        shadowColor: "shadow-violet-200",
        bgAccent: "bg-violet-50",
        textAccent: "text-violet-700",
        borderAccent: "border-violet-200",
        features: [
            "Licence & CPC Expiry Tracking",
            "Tacho Card Management",
            "DBS & Night Worker Checks",
            "Employment Milestones",
        ],
    },
    {
        title: "Vehicle Compliance",
        description:
            "Manage MOT, PMI inspections, insurance, tyre checks, tacho downloads, and calibration records for your entire fleet in one unified view.",
        href: "/dashboard/compliance-management/vehicle-management",
        icon: Truck,
        gradient: "from-orange-500 to-red-500",
        shadowColor: "shadow-orange-200",
        bgAccent: "bg-orange-50",
        textAccent: "text-orange-700",
        borderAccent: "border-orange-200",
        features: [
            "MOT & PMI Scheduling",
            "Insurance & Tax Tracking",
            "Tyre Maintenance Logs",
            "Tacho & Loller Calibrations",
        ],
    },
    {
        title: "PMI Analysis",
        description:
            "Dive deep into Preventive Maintenance Inspection analytics. View maintenance trends, driver PMI records, and historical inspection data.",
        href: "/dashboard/compliance-management/pmi-analysis",
        icon: ClipboardCheck,
        gradient: "from-emerald-500 to-teal-600",
        shadowColor: "shadow-emerald-200",
        bgAccent: "bg-emerald-50",
        textAccent: "text-emerald-700",
        borderAccent: "border-emerald-200",
        features: [
            "Maintenance Analytics",
            "Driver PMI Records",
            "Inspection History",
            "Trend Analysis",
        ],
    },
];

export default function ComplianceManagementPage() {
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const cookies = useCookies();
    const token = cookies.get("access_token");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch driver compliance stats
                const driverRes = await fetch(
                    `${API_URL}/api/profiles/driver/compliance/?page=1&page_size=1`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                let driverTotal = 0;
                if (driverRes.ok) {
                    const driverData = await driverRes.json();
                    driverTotal = driverData?.data?.pagination?.count ?? 0;
                }

                // Fetch vehicle compliance stats
                const vehicleRes = await fetch(`${API_URL}/api/vehicles/compliance/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                let vehicleTotal = 0;
                if (vehicleRes.ok) {
                    const vehicleData = await vehicleRes.json();
                    vehicleTotal = vehicleData?.data?.mot?.length ?? 0;
                }

                setStats({
                    drivers: {
                        total: driverTotal,
                        expired: 0,
                        expiringSoon: 0,
                        valid: driverTotal,
                    },
                    vehicles: {
                        total: vehicleTotal,
                        expired: 0,
                        expiringSoon: 0,
                        valid: vehicleTotal,
                    },
                });
            } catch (error) {
                console.error("Failed to fetch compliance stats:", error);
            } finally {
                setLoadingStats(false);
            }
        };

        if (token) fetchStats();
        else setLoadingStats(false);
    }, [token]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header Section */}
            <div className="relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-violet-100/40 to-purple-100/30 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-orange-100/40 to-red-100/30 blur-3xl" />
                </div>

                <div className="relative px-6 pt-8 pb-6">
                    {/* Breadcrumb */}


                    {/* Title & description */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    Compliance Management
                                </h1>
                            </div>
                            <p className="text-gray-500 max-w-xl text-sm leading-relaxed">
                                Centralised compliance hub for driver certifications, vehicle inspections, and
                                preventive maintenance. Stay ahead of expiry dates and regulatory requirements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Total Drivers",
                            value: stats?.drivers.total ?? "—",
                            icon: Users,
                            color: "text-violet-600",
                            bg: "bg-violet-50",
                            loading: loadingStats,
                        },
                        {
                            label: "Total Vehicles",
                            value: stats?.vehicles.total ?? "—",
                            icon: Truck,
                            color: "text-orange-600",
                            bg: "bg-orange-50",
                            loading: loadingStats,
                        },
                        {
                            label: "Compliance Areas",
                            value: "3",
                            icon: Activity,
                            color: "text-emerald-600",
                            bg: "bg-emerald-50",
                            loading: false,
                        },
                        {
                            label: "Status",
                            value: "Active",
                            icon: CheckCircle2,
                            color: "text-green-600",
                            bg: "bg-green-50",
                            loading: false,
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 leading-none mb-1">{stat.label}</p>
                                {stat.loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                ) : (
                                    <p className="text-lg font-semibold text-gray-900 leading-none">{stat.value}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sub-page Cards */}
            <div className="px-6 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {subPages.map((page) => {
                        const Icon = page.icon;
                        return (
                            <Link
                                key={page.href}
                                href={page.href}
                                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                {/* Top gradient accent line */}
                                <div
                                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${page.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                                />

                                <div className="p-6">
                                    {/* Icon & Title */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${page.gradient} shadow-lg ${page.shadowColor} group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200"
                                        >
                                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all duration-200" />
                                        </div>
                                    </div>

                                    <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                                        {page.title}
                                    </h2>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-5">
                                        {page.description}
                                    </p>

                                    {/* Feature list */}
                                    <div className="space-y-2.5">
                                        {page.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5">
                                                <div
                                                    className={`flex items-center justify-center w-5 h-5 rounded-full ${page.bgAccent}`}
                                                >
                                                    <CheckCircle2 className={`w-3 h-3 ${page.textAccent}`} />
                                                </div>
                                                <span className="text-sm text-gray-600">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom CTA */}
                                    <div
                                        className={`mt-6 pt-4 border-t ${page.borderAccent} flex items-center justify-between`}
                                    >
                                        <span className={`text-sm font-medium ${page.textAccent}`}>
                                            View Details
                                        </span>
                                        <ChevronRight
                                            className={`w-4 h-4 ${page.textAccent} group-hover:translate-x-1 transition-transform duration-200`}
                                        />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>


        </div>
    );
}
