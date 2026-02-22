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
import { cn } from "@/lib/utils";

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

// ── Dummy Data (expanded to match screenshot count) ─────
const dummyData: ValetCheck[] = [
    {
        reg: "AB21-XYZ",
        date: "2/17/2026",
        valet: "John",
        type: "Full Interior Clean",
        beforeImg: "https://placehold.co/80x60?text=Before",
        afterImg: "https://placehold.co/80x60?text=After",
        checkBy: "John",
        checkDate: "2/17/2026",
        result: "Partial",
        notes: "Must leave...",
        remedial: "Must Create A...",
        auditBy: "John",
        auditDate: "2/17/2026",
        auditResult: "Partial",
        auditNotes: "Must leave...",
        auditRemedial: "Must Create A...",
    },
    // ... (your other 7 entries here - omitted for brevity)
    // Add the remaining rows following the same pattern
];

// ── Reusable Stats Card ─────────────────────────────────
interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
    return (
        <Card className="border shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="mt-1 text-3xl font-bold" style={{ color }}>
                        {value}
                    </p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="h-6 w-6" style={{ color }} />
                </div>
            </CardContent>
        </Card>
    );
}

// ── Custom Badge Variants ───────────────────────────────
const statusVariants = {
    Passed: cn(
        badgeVariants({ variant: "outline" }),
        "border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
    ),
    Failed: cn(
        badgeVariants({ variant: "outline" }),
        "border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
    ),
    Partial: cn(
        badgeVariants({ variant: "outline" }),
        "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
    ),
};

function StatusBadge({ status }: { status: CheckResult }) {
    return <Badge className={statusVariants[status]}>{status}</Badge>;
}

export default function ValetCheckDashboard() {
    return (
        <div className="min-h-screen bg-background p-6">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Valet Check System</h1>
                    <p className="text-sm text-muted-foreground">
                        Track and manage vehicle valet inspections
                    </p>
                </div>
                <Button className="bg-[#FF5722] hover:bg-[#F4511E] text-white gap-2">
                    <Download className="h-4 w-4" />
                    Download PSD
                </Button>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 md:grid-cols-5">
                <StatsCard title="Total" value={3} icon={Car} color="#6B7280" />
                <StatsCard title="Passed" value={2} icon={CheckCircle2} color="#10B981" />
                <StatsCard title="Failed" value={3} icon={XCircle} color="#EF4444" />
                <StatsCard title="Partial" value={5} icon={AlertCircle} color="#F59E0B" />
                <StatsCard title="Partial" value={5} icon={AlertCircle} color="#F59E0B" />
            </div>

            {/* Tabs & Filters */}
            <div className="mb-6 space-y-4">
                <Tabs defaultValue="latest">
                    <TabsList className="h-auto justify-start gap-6 bg-transparent p-0">
                        {["Latest Check", "Outstanding", "History"].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase().replace(" ", "-")}
                                className={cn(
                                    "rounded-none border-b-2 border-transparent pb-3 pt-2 text-muted-foreground",
                                    "data-[state=active]:border-[#FF5722] data-[state=active]:text-[#FF5722] data-[state=active]:shadow-none"
                                )}
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search Vehicle Reg / Valeter..." className="h-10 pl-10" />
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="h-10 min-w-32 justify-between">
                            All Types <span className="ml-1 text-xs opacity-60">▼</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 min-w-32 justify-between">
                            All Results <span className="ml-1 text-xs opacity-60">▼</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-none shadow-sm">
                <ScrollArea className="h-[580px] rounded-lg border bg-white">
                    <Table>
                        <TableHeader>
                            {/* Group Headers */}
                            <TableRow className="hover:bg-transparent">
                                <TableHead rowSpan={2} className="sticky left-0 z-10 w-32 bg-white pl-6 font-semibold">
                                    Vehicle Reg
                                </TableHead>
                                <TableHead colSpan={6} className="bg-orange-50/70 text-center text-[#FF5722]">
                                    Vehicle Details
                                </TableHead>
                                <TableHead colSpan={5} className="bg-pink-50/70 text-center text-pink-600">
                                    Checker Details
                                </TableHead>
                                <TableHead colSpan={5} className="bg-amber-50/70 text-center text-amber-600">
                                    Auditor Details
                                </TableHead>
                            </TableRow>

                            {/* Column Headers */}
                            <TableRow className="hover:bg-transparent">
                                {/* Vehicle */}
                                <TableHead className="bg-orange-50/40 text-xs font-medium">Date</TableHead>
                                <TableHead className="bg-orange-50/40 text-xs font-medium">Valeter</TableHead>
                                <TableHead className="bg-orange-50/40 text-xs font-medium">Type</TableHead>
                                <TableHead className="bg-orange-50/40 text-xs font-medium">Before</TableHead>
                                <TableHead className="bg-orange-50/40 text-xs font-medium">After</TableHead>

                                {/* Checker */}
                                <TableHead className="bg-pink-50/40 text-xs font-medium">Check By</TableHead>
                                <TableHead className="bg-pink-50/40 text-xs font-medium">Date</TableHead>
                                <TableHead className="bg-pink-50/40 text-xs font-medium">Result</TableHead>
                                <TableHead className="bg-pink-50/40 text-xs font-medium">Notes</TableHead>
                                <TableHead className="bg-pink-50/40 text-xs font-medium">Remedial</TableHead>

                                {/* Auditor */}
                                <TableHead className="bg-amber-50/40 text-xs font-medium">Audit By</TableHead>
                                <TableHead className="bg-amber-50/40 text-xs font-medium">Date</TableHead>
                                <TableHead className="bg-amber-50/40 text-xs font-medium">Result</TableHead>
                                <TableHead className="bg-amber-50/40 text-xs font-medium">Notes</TableHead>
                                <TableHead className="bg-amber-50/40 text-xs font-medium">Remedial</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {dummyData.map((item, i) => (
                                <TableRow key={i} className="group hover:bg-muted/40">
                                    <TableCell className="sticky left-0 z-0 bg-white font-medium pl-6">
                                        {item.reg}
                                    </TableCell>

                                    <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.valet}</TableCell>
                                    <TableCell className="font-medium">{item.type}</TableCell>
                                    <TableCell>
                                        <div className="h-10 w-16 overflow-hidden rounded border bg-muted">
                                            <img src={item.beforeImg} alt="Before" className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-10 w-16 overflow-hidden rounded border bg-muted">
                                            <img src={item.afterImg} alt="After" className="h-full w-full object-cover" />
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-sm text-muted-foreground">{item.checkBy}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.checkDate}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={item.result} />
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground" title={item.notes}>
                                        {item.notes}
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground" title={item.remedial}>
                                        {item.remedial}
                                    </TableCell>

                                    <TableCell className="text-sm text-muted-foreground">{item.auditBy}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{item.auditDate}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={item.auditResult} />
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground" title={item.auditNotes}>
                                        {item.auditNotes}
                                    </TableCell>
                                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground" title={item.auditRemedial}>
                                        {item.auditRemedial}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t bg-white px-4 py-3">
                    <div className="rounded-full border bg-muted/40 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                        Row Page <span className="font-semibold text-foreground">01</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </Button>

                        <Button size="sm" className="h-8 w-8 bg-[#FF5722] hover:bg-[#F4511E]">
                            1
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 text-xs">
                            2
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 text-xs">
                            3
                        </Button>
                        <span className="px-2 text-xs text-muted-foreground">...</span>
                        <Button variant="outline" size="sm" className="h-8 w-8 text-xs">
                            67
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 text-xs">
                            68
                        </Button>

                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}