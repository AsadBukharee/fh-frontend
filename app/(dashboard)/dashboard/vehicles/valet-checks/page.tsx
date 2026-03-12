"use client";

import {
    Car,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// ── Types ────────────────────────────────────────────────
type CheckResult = "Passed" | "Failed" | "Partial";

interface ValetCheck {
    reg: string;
    date: string;
    valet: string;
    type: string;
    beforeImg: string;
    afterImg: string;
    checkBy: string;
    checkDate: string;
    result: CheckResult;
    notes: string;
    remedial: string;
    auditBy: string;
    auditDate: string;
    auditResult: CheckResult;
    auditNotes: string;
    auditRemedial: string;
}

// ── Dummy Data ──────────────────────────────────────────
const dummyData: ValetCheck[] = [
    // Same 5–8 entries as before (omitted here for brevity – copy from previous version)
    // ...
];

// ── Status Badge ────────────────────────────────────────
const statusVariants = {
    Passed: cn(
        badgeVariants({ variant: "outline" }),
        "border-green-200/70 bg-green-50/60 text-green-700 text-xs px-2 py-0.5"
    ),
    Failed: cn(
        badgeVariants({ variant: "outline" }),
        "border-red-200/70 bg-red-50/60 text-red-700 text-xs px-2 py-0.5"
    ),
    Partial: cn(
        badgeVariants({ variant: "outline" }),
        "border-amber-200/70 bg-amber-50/60 text-amber-700 text-xs px-2 py-0.5"
    ),
};

function StatusBadge({ status }: { status: CheckResult }) {
    return <Badge className={statusVariants[status]}>{status}</Badge>;
}

// ── Softer Stats Card ───────────────────────────────────
interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
    return (
        <Card className="border border-border/60 shadow-xs rounded-lg">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    <p className="mt-0.5 text-2xl font-semibold" style={{ color }}>
                        {value}
                    </p>
                </div>
                <div className="rounded-md p-2.5" style={{ backgroundColor: `${color}12` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function ValetCheckDashboard() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] p-6 space-y-6 text-sm">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Valet Check System</h1>
                    <p className="text-xs text-muted-foreground">
                        Track and manage vehicle valet inspections
                    </p>
                </div>
                <Button
                    size="sm"
                    className="bg-[#FF5722] hover:bg-[#F4511E] text-white gap-1.5 h-9 px-4"
                >
                    <Download className="h-3.5 w-3.5" />
                    Download PSD
                </Button>
            </div>

            {/* Top Filter Bar */}
            <Card className="border-border/60 shadow-xs">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[140px]">
                            <Label className="text-xs mb-1 block">Vehicle Reg</Label>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Vehicle</SelectItem>
                                    <SelectItem value="ab21-xyz">AB21-XYZ</SelectItem>
                                    {/* Add more */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[160px]">
                            <Label className="text-xs mb-1 block">Refiller Name</Label>
                            <Select defaultValue="all">
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Refillers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Refillers</SelectItem>
                                    <SelectItem value="john">John</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-[110px]">
                            <Label className="text-xs mb-1 block">Date From</Label>
                            <div className="relative">
                                <Input type="date" className="h-8 text-xs pl-8" defaultValue="2023-11-01" />
                                <Calendar className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="min-w-[110px]">
                            <Label className="text-xs mb-1 block">Date To</Label>
                            <div className="relative">
                                <Input type="date" className="h-8 text-xs pl-8" defaultValue="2023-11-23" />
                                <Calendar className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="min-w-[160px]">
                            <Label className="text-xs mb-1 block">Batch/Invoice No</Label>
                            <Input placeholder="Search..." className="h-8 text-xs" />
                        </div>

                        <Button size="sm" className="h-8 px-5 bg-[#FF5722] hover:bg-[#F4511E] mt-5 sm:mt-0">
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-5">
                <StatsCard title="Total" value={3} icon={Car} color="#6B7280" />
                <StatsCard title="Passed" value={2} icon={CheckCircle2} color="#10B981" />
                <StatsCard title="Failed" value={3} icon={XCircle} color="#EF4444" />
                <StatsCard title="Partial" value={5} icon={AlertCircle} color="#F59E0B" />
                <StatsCard title="Partial" value={5} icon={AlertCircle} color="#F59E0B" />
            </div>

            {/* Tabs & Secondary Filters */}
            <div className="space-y-4">
                <Tabs defaultValue="latest-check">
                    <TabsList className="h-auto justify-start gap-6 bg-transparent p-0 border-b border-border/50">
                        {["Latest Check", "Outstanding", "History"].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase().replace(" ", "-")}
                                className={cn(
                                    "rounded-none border-b-2 border-transparent pb-2.5 pt-1.5 text-xs font-medium text-muted-foreground",
                                    "data-[state=active]:border-[#FF5722] data-[state=active]:text-[#FF5722] data-[state=active]:shadow-none"
                                )}
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Q Search" className="h-8 pl-9 text-xs" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs px-3">
                            All Types <span className="ml-1 text-[10px] opacity-60">▼</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs px-3">
                            All Results <span className="ml-1 text-[10px] opacity-60">▼</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-border/60 shadow-xs">
                <ScrollArea className="h-[520px] rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead rowSpan={2} className="sticky left-0 z-20 bg-gray-50 pl-5 font-semibold text-xs border-r w-32">
                                    Vehicle Reg
                                </TableHead>
                                <TableHead colSpan={6} className="bg-orange-50/40 text-center text-orange-700/90 font-medium text-xs">
                                    Vehicle Details
                                </TableHead>
                                <TableHead colSpan={5} className="bg-pink-50/40 text-center text-pink-700/90 font-medium text-xs">
                                    Checker Details
                                </TableHead>
                                <TableHead colSpan={5} className="bg-amber-50/40 text-center text-amber-700/90 font-medium text-xs">
                                    Auditor Details
                                </TableHead>
                            </TableRow>

                            <TableRow className="hover:bg-transparent">
                                <TableHead className="bg-orange-50/30 text-[11px] font-normal sticky left-[128px] z-10">Date</TableHead>
                                <TableHead className="bg-orange-50/30 text-[11px] font-normal">Valeter</TableHead>
                                <TableHead className="bg-orange-50/30 text-[11px] font-normal">Type</TableHead>
                                <TableHead className="bg-orange-50/30 text-[11px] font-normal">Before</TableHead>
                                <TableHead className="bg-orange-50/30 text-[11px] font-normal">After</TableHead>

                                <TableHead className="bg-pink-50/30 text-[11px] font-normal">Check By</TableHead>
                                <TableHead className="bg-pink-50/30 text-[11px] font-normal">Date</TableHead>
                                <TableHead className="bg-pink-50/30 text-[11px] font-normal">Result</TableHead>
                                <TableHead className="bg-pink-50/30 text-[11px] font-normal">Notes</TableHead>
                                <TableHead className="bg-pink-50/30 text-[11px] font-normal">Remedial</TableHead>

                                <TableHead className="bg-amber-50/30 text-[11px] font-normal">Audit By</TableHead>
                                <TableHead className="bg-amber-50/30 text-[11px] font-normal">Date</TableHead>
                                <TableHead className="bg-amber-50/30 text-[11px] font-normal">Result</TableHead>
                                <TableHead className="bg-amber-50/30 text-[11px] font-normal">Notes</TableHead>
                                <TableHead className="bg-amber-50/30 text-[11px] font-normal">Remedial</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {dummyData.map((item, i) => (
                                <TableRow key={i} className="hover:bg-gray-50/60 border-b h-12">
                                    <TableCell className="sticky left-0 z-10 bg-white font-medium pl-5 border-r text-sm">
                                        {item.reg}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.valet}</TableCell>
                                    <TableCell className="text-xs font-medium">{item.type}</TableCell>
                                    <TableCell>
                                        <div className="h-9 w-14 overflow-hidden rounded border bg-gray-100">
                                            <img src={item.beforeImg} alt="Before" className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-9 w-14 overflow-hidden rounded border bg-gray-100">
                                            <img src={item.afterImg} alt="After" className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.checkBy}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.checkDate}</TableCell>
                                    <TableCell><StatusBadge status={item.result} /></TableCell>
                                    <TableCell className="max-w-[130px] truncate text-[11px] text-muted-foreground" title={item.notes}>
                                        {item.notes}
                                    </TableCell>
                                    <TableCell className="max-w-[130px] truncate text-[11px] text-muted-foreground" title={item.remedial}>
                                        {item.remedial}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.auditBy}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{item.auditDate}</TableCell>
                                    <TableCell><StatusBadge status={item.auditResult} /></TableCell>
                                    <TableCell className="max-w-[130px] truncate text-[11px] text-muted-foreground" title={item.auditNotes}>
                                        {item.auditNotes}
                                    </TableCell>
                                    <TableCell className="max-w-[130px] truncate text-[11px] text-muted-foreground" title={item.auditRemedial}>
                                        {item.auditRemedial}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between bg-white px-5 py-2.5 border-t text-xs">
                    <div className="rounded-full border bg-gray-50 px-3 py-1 text-muted-foreground">
                        Row Page <span className="font-medium text-foreground">01</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-xs">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" className="h-7 w-7 text-xs bg-[#FF5722] hover:bg-[#F4511E] text-white p-0">
                            1
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
                            2
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
                            3
                        </Button>
                        <span className="px-1.5 text-muted-foreground">…</span>
                        <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
                            67
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 text-xs p-0">
                            68
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-xs">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}