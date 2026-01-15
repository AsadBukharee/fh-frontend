'use client';

import {
  CheckCircle,
  ClipboardList,
  Calendar,
  User,
  Building2,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Item = {
  title: string;
  description: string;
  value: 'Yes' | 'No';
};

const mandatoryEquipment: Item[] = [
  { title: 'First Aid Kit', description: 'Expiry date must be written on the kit', value: 'Yes' },
  { title: 'First Aid Kit Sign', description: 'Arrow or signage in van to show location of kit', value: 'Yes' },
  { title: '62mph Speed Limit Sign', description: 'Visible to driver', value: 'Yes' },
  { title: 'Foam Fire Extinguisher', description: 'In date or in green zone', value: 'Yes' },
  { title: 'Fire Extinguisher in Bracket', description: 'Stored securely', value: 'Yes' },
  { title: 'Fire Extinguisher Sign', description: 'Arrow or signage in van to show location', value: 'Yes' },
  { title: 'Tacho Rolls', description: '2 rolls (only if Tacho present)', value: 'Yes' },
  { title: 'High Visibility Vests', description: 'Minimum 1 in the van', value: 'Yes' },
];

const additionalEquipment: Item[] = [
  { title: 'No Smoking Signs', description: 'Expiry date must be written on the kit', value: 'Yes' },
  { title: 'No Eating Signs', description: 'Arrow or signage in van to show location of kit', value: 'Yes' },
  { title: 'Wear Seat Belts Signs', description: 'Visible to driver', value: 'Yes' },
  { title: 'Sick Bags', description: 'In date or in green zone', value: 'Yes' },
  { title: 'Bin Bags', description: 'Stored securely', value: 'Yes' },
  { title: 'CCTV Signs', description: 'Arrow or signage in van to show location', value: 'Yes' },
  { title: 'Laminated Multilingual Routes', description: '2 rolls (only if Tacho present)', value: 'Yes' },
  { title: 'Spare Pen & Clip Board', description: 'Minimum 1 in the van', value: 'Yes' },
];

export default function VehicleChecklistDetail() {
  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold">Detail</h2>
          <p className="text-sm text-muted-foreground">see all details</p>
        </div>

        {/* Review Banner */}
        <div className="flex justify-end">
          <Badge className="bg-orange-100 text-orange-700 rounded-full px-4 py-1">
            Reviewed by Sarah Manager on 18 Dec 2025 PMT/6049300 14:15
          </Badge>
        </div>

        {/* Summary Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <ClipboardList className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-semibold">ABC - XYZ</span>
            </div>

            <Badge className="bg-green-100 text-green-700 rounded-full">
              Passed
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <Info label="Auditor" value="John Smith" icon={User} />
            <Info label="Driver" value="Mike Johnson" icon={User} />
            <Info label="Operating Center" value="London Depot" icon={Building2} />
            <Info label="Check Type" value="Daily" icon={Calendar} />
          </div>
        </Card>

        {/* Mandatory Equipment */}
        <Section
          title="Mandatory Equipment"
          count="26/26 Passed"
          items={mandatoryEquipment}
        />

        {/* Additional Equipment */}
        <Section
          title="Additional Equipment (Non-Mandatory)"
          count="8/8 Present"
          items={additionalEquipment}
        />
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function Info({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 mt-1 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, count, items }: any) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ClipboardList className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>

        <Badge variant="secondary" className="rounded-full">
          {count}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item: Item, idx: number) => (
          <div
            key={idx}
            className="border rounded-lg p-4 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>

            <Badge className="bg-green-100 text-green-700 rounded-full">
              {item.value}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
