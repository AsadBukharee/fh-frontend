"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type EquipmentItem = {
  title: string;
  description: string;
  status: boolean;
};

const mandatoryEquipment: EquipmentItem[] = [
  { title: "First Aid Kit", description: "Expiry date must be written on the kit", status: true },
  { title: "First Aid Kit Sign", description: "Arrow or signage in van to show location", status: true },
  { title: "62mph Speed Limit Sign", description: "Visible to driver", status: true },
  { title: "Foam Fire Extinguisher", description: "In date or in green zone", status: true },
  { title: "Fire Extinguisher in Bracket", description: "Stored securely", status: true },
  { title: "Fire Extinguisher Sign", description: "Arrow or signage in van to show location", status: true },
  { title: "Tacho Rolls", description: "2 rolls (only if Tacho present)", status: true },
  { title: "High Visibility Vests", description: "Minimum 1 in the van", status: true },
];

const additionalEquipment: EquipmentItem[] = [
  { title: "No Smoking Signs", description: "Expiry date must be written on the kit", status: true },
  { title: "No Eating Signs", description: "Arrow or signage in van to show location of kit", status: true },
  { title: "Wear Seat Belts Signs", description: "Visible to driver", status: true },
  { title: "Sick Bags", description: "In date or in green zone", status: true },
  { title: "Bin Bags", description: "Stored securely", status: true },
  { title: "CCTV Signs", description: "Arrow or signage in van to show location", status: true },
  { title: "Laminated Multilingual Routes", description: "2 rolls (only if Tacho present)", status: true },
  { title: "Spare Pen & Clip Board", description: "Minimum 1 in the van", status: true },
];

function EquipmentCard({ item }: { item: EquipmentItem }) {
  return (
    <Card className="rounded-xl border bg-muted/40 hover:bg-muted transition">
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <CheckCircle2 className="text-green-500 mt-1" size={20} />
          <div>
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Yes
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function DetailPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Detail</h1>
            <p className="text-sm text-muted-foreground">see all details</p>
          </div>

          <Badge className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full">
            Reviewed by Sarah Manager on 18 Dec 2025
          </Badge>
        </div>

        {/* Top Summary Card */}
        <Card className="rounded-xl">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div className="space-y-1">
              <h2 className="font-semibold text-lg">ABC - XYZ</h2>
              <Badge className="bg-green-100 text-green-700 w-fit">Passed</Badge>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-10" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Auditor</p>
                <p className="font-medium">John Smith</p>
              </div>
              <div>
                <p className="text-muted-foreground">Driver</p>
                <p className="font-medium">Mike Johnson</p>
              </div>
              <div>
                <p className="text-muted-foreground">Operating Center</p>
                <p className="font-medium">London Depot</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check Type</p>
                <p className="font-medium">Daily</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Mandatory Equipment */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Mandatory <span className="bg-yellow-300 px-2 rounded">Equipment</span>
            </CardTitle>
            <Badge variant="outline">26/26 Passed</Badge>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid md:grid-cols-2 gap-4">
                {mandatoryEquipment.map((item, index) => (
                  <EquipmentCard key={index} item={item} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Additional Equipment */}
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Additional <span className="bg-yellow-300 px-2 rounded">Equipment</span> (Non-Mandatory)
            </CardTitle>
            <Badge variant="outline">8/8 Present</Badge>
          </CardHeader>

          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid md:grid-cols-2 gap-4">
                {additionalEquipment.map((item, index) => (
                  <EquipmentCard key={index} item={item} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
