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
    <Card className="shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-2xl text-purple-800">
            <Heart className="h-6 w-6" />
            Health Information
          </CardTitle>
          <div className="flex gap-3">
            {isEditingHealth ? (
              <>
                <Button
                  onClick={handleSaveHealth}
                  disabled={savingHealth}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-all"
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
                  className="border-purple-600 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleHealthEditToggle}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all"
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Health Answers
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-gray-600">Health-related questions and answers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {healthData.length === 0 ? (
          <p className="text-gray-600 text-center py-6">No health answers found.</p>
        ) : (
          (isEditingHealth ? editHealthData : healthData).map((health: any) => (
            <div key={health.id} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Question</Label>
                  <p className="font-medium text-purple-800">{health.question_text}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Answer</Label>
                  {isEditingHealth ? (
                    <Select
                      value={health.answer.toString()}
                      onValueChange={(value) =>
                        handleHealthInputChange(health.id, "answer", value === "true")
                      }
                    >
                      <SelectTrigger className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg">
                        <SelectValue placeholder="Select answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium text-purple-800">{health.answer ? "Yes" : "No"}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-600">Note</Label>
                  {isEditingHealth ? (
                    <Input
                      value={health.note}
                      onChange={(e) =>
                        handleHealthInputChange(health.id, "note", e.target.value)
                      }
                      placeholder="Enter note"
                      className="border-purple-200 focus:ring-2 focus:ring-purple-600 rounded-lg"
                    />
                  ) : (
                    <p className="font-medium text-purple-800">{health.note || "No note provided"}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-600">Admin Remarks</Label>
                  <p className="font-medium text-purple-800">
                    {health.admin_remarks || "No remarks provided"}
                  </p>
                </div>
              </div>
              <Separator className="bg-purple-200" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}