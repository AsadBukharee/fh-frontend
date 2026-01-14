// app/drivers/[id]/tabs/HealthAnswerTab.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface HealthAnswerTabProps {
  healthData: any[];
  editHealthData: any[];
  isEditingHealth: boolean;
  savingHealth: boolean;
  handleHealthEditToggle: () => void;
  handleHealthInputChange: (id: number, field: string, value: boolean | string) => void;
  handleSaveHealth: () => void;
}

export default function HealthAnswerTab({
  healthData,
  editHealthData,
  isEditingHealth,
  savingHealth,
  handleHealthEditToggle,
  handleHealthInputChange,
  handleSaveHealth,
}: HealthAnswerTabProps) {
  return (
    <Card className=" bg-gray-50/10 transition-all rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-2xl text-black">
            Health Information
          </CardTitle>
          <div className="flex gap-3">
            {isEditingHealth ? (
              <>
                <Button
                  onClick={handleSaveHealth}
                  disabled={savingHealth}
                  className="bg-black hover:bg-black text-white px-6 py-2 rounded-lg transition-all"
                >
                  {savingHealth ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleHealthEditToggle}
                  disabled={savingHealth}
                  className="border-black-600 text-black-600 hover:bg-black-100 rounded-lg transition-all"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleHealthEditToggle}
                className="bg-black hover:bg-black text-white px-6 py-2 rounded-lg transition-all"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Health Answers
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-600">Health-related questions and answers</CardDescription>
      </CardHeader>
    <CardContent className="space-y-6">
  {healthData.length === 0 ? (
    <p className="text-gray-600 text-center py-6">
      No health answers found.
    </p>
  ) : (
    (isEditingHealth ? editHealthData : healthData).map((health: any) => (
      <div
        key={health.id}
        className="bg-gray-50/70 rounded-xl p-6"
      >
        {/* Row 1: Question | Answer */}
        <div className="flex items-start justify-between">
          <div className="w-1/2 pr-6">
            <p className="text-sm font-medium text-gray-500">Question</p>
            <p className="text-gray-900">
              {health.question_text}
            </p>
          </div>

          <div className="w-px bg-gray-200 self-stretch" />

          <div className="w-1/2 pl-6">
            <p className="text-sm font-medium text-gray-500">Answer</p>

            {isEditingHealth ? (
              <Select
                value={health.answer.toString()}
                onValueChange={(value) =>
                  handleHealthInputChange(
                    health.id,
                    "answer",
                    value === "true"
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-gray-900">
                {health.answer ? "Yes" : "No"}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 " />

        {/* Row 2: Note | Admin Remarks */}
        <div className="flex items-start justify-between">
          <div className="w-1/2 pr-6">
            <p className="text-sm font-medium text-gray-500">Note</p>

            {isEditingHealth ? (
              <Input
                value={health.note}
                onChange={(e) =>
                  handleHealthInputChange(
                    health.id,
                    "note",
                    e.target.value
                  )
                }
                placeholder="Enter note"
                className="mt-1"
              />
            ) : (
              <p className="text-gray-900">
                {health.note || "No additional notes"}
              </p>
            )}
          </div>

          <div className="w-px bg-gray-200 self-stretch" />

          <div className="w-1/2 pl-6">
            <p className="text-sm font-medium text-gray-500">
              Admin Remarks
            </p>
            <p className="text-gray-900">
              {health.admin_remarks || "No Remarks Provided"}
            </p>
          </div>
        </div>
      </div>
    ))
  )}
</CardContent>

    </Card>
  );
}