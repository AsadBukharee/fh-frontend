// app/drivers/[id]/tabs/SignAgreementTab.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SignAgreementTabProps {
  driverData: any;
  formatDate: (date: string | null) => string;
  showToast: (message: string, type: string) => void;
}

export default function SignAgreementTab({
  driverData,
  formatDate,
  showToast,
}: SignAgreementTabProps) {
  return (
    <Card className="shadow-lg bg-gradient-to-br from-white to-orange-50 hover:shadow-xl transition-all rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl text-orange-800">
          <FileText className="h-6 w-6" />
          Sign Agreement
        </CardTitle>
        <CardDescription className="text-gray-600">Review and sign the agreement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-orange-800">Current Contract</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-semibold text-gray-600">Contract Name</Label>
              <p className="font-medium text-orange-800">{driverData.user.contract?.name || "Not assigned"}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">Signing Date</Label>
              <p className="font-medium text-orange-800">
                {formatDate(driverData.user.contract_signing_date) || "Not signed"}
              </p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-600">Description</Label>
            <p className="font-medium text-orange-800">
              {driverData.user.contract?.description || "No description available"}
            </p>
          </div>
        </div>
        <Separator className="bg-orange-200" />
        <Button
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all"
          onClick={() => showToast("Agreement signed successfully", "success")}
        >
          <Save className="h-5 w-5 mr-2" />
          Sign Agreement
        </Button>
      </CardContent>
    </Card>
  );
}