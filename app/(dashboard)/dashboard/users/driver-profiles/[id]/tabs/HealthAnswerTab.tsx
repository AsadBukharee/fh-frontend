// app/drivers/[id]/tabs/HealthAnswerTab.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Edit, Save, X, Heart } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"; // Add Textarea import if needed

interface HealthAnswerTabProps {
  healthData: any[];
  editHealthData: any[];
  isEditingHealth: boolean;
  savingHealth: boolean;
  handleHealthEditToggle: () => void;
  handleHealthInputChange: (id: number, field: string, value: boolean | string) => void;
  handleSaveHealth: () => void;
  expandedId?: string | string[];
  handleExpandedChange?: (id: string) => void;
}

export default function HealthAnswerTab({
  healthData,
  editHealthData,
  isEditingHealth,
  savingHealth,
  handleHealthEditToggle,
  handleHealthInputChange,
  handleSaveHealth,
  expandedId,
  handleExpandedChange,
}: HealthAnswerTabProps) {
  // State to track which cards are being edited
  const [editingCards, setEditingCards] = useState<Set<number>>(new Set());
  const [localEditData, setLocalEditData] = useState<any>({});

  const handleCardEditToggle = (healthId: number) => {
    const newEditingCards = new Set(editingCards);

    if (newEditingCards.has(healthId)) {
      // Cancel edit - remove from editing set and clear local data
      newEditingCards.delete(healthId);
      setLocalEditData((prev: any) => {
        const newData = { ...prev };
        delete newData[healthId];
        return newData;
      });
    } else {
      // Start edit - add to editing set and initialize local data
      newEditingCards.add(healthId);
      const healthItem = healthData.find(h => h.id === healthId);
      if (healthItem) {
        setLocalEditData((prev: any) => ({
          ...prev,
          [healthId]: {
            answer: healthItem.answer,
            note: healthItem.note || "",
            admin_remarks: healthItem.admin_remarks || "" // Add admin_remarks to local edit data
          }
        }));
      }
    }

    if (!newEditingCards.has(healthId)) {
      handleExpandedChange?.(`health-card-${healthId}`);
    }

    setEditingCards(newEditingCards);
  };

  const handleCardSave = (healthId: number) => {
    const editedData = localEditData[healthId];
    if (editedData) {
      // Apply changes to the parent state
      Object.keys(editedData).forEach(field => {
        handleCardInputChange(healthId, field, editedData[field]);
      });

      // Exit edit mode for this card
      const newEditingCards = new Set(editingCards);
      newEditingCards.delete(healthId);
      setEditingCards(newEditingCards);

      // Clear local data for this card
      setLocalEditData((prev: any) => {
        const newData = { ...prev };
        delete newData[healthId];
        return newData;
      });
      handleSaveHealth();
    }
  };

  const handleCardInputChange = (healthId: number, field: string, value: any) => {
    setLocalEditData((prev: any) => ({
      ...prev,
      [healthId]: {
        ...prev[healthId],
        [field]: value
      }
    }));
  };

  const getHealthDisplayData = (health: any) => {
    if (editingCards.has(health.id) && localEditData[health.id]) {
      return {
        ...health,
        ...localEditData[health.id]
      };
    }
    return health;
  };

  return (
    <Card className="bg-gray-50/10 transition-all rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-2xl text-black">
            Health Information
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600">
          Edit Health-related questions and answers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {healthData.length === 0 ? (
          <p className="text-gray-600 text-center py-6">
            No health answers found.
          </p>
        ) : (
          (isEditingHealth ? editHealthData : healthData).map((health: any) => {
            const isCardEditing = editingCards.has(health.id);
            const displayData = getHealthDisplayData(health);

            return (
              <div
                key={health.id}
                id={`health-card-${health.id}`}
                className="bg-gray-50/70 rounded-xl p-6 relative"
              >
                {/* Edit button for individual card */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {isCardEditing ? (
                    <>
                      <Badge
                        className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs flex items-center gap-1"
                        onClick={() => handleCardSave(health.id)}
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Badge>

                      <Badge
                        variant="outline"
                        className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50 px-2 py-1 text-xs flex items-center gap-1"
                        onClick={() => handleCardEditToggle(health.id)}
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Badge>
                    </>
                  ) : (
                    <Badge
                      variant="outline"
                      className="cursor-pointer px-4 py-1 text-xs bg-orange-50 text-orange-600 border-0 flex items-center gap-1 hover:bg-muted"
                      onClick={() => handleCardEditToggle(health.id)}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Badge>
                  )}
                </div>

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

                    {isCardEditing || isEditingHealth ? (
                      <Select
                        value={displayData.answer.toString()}
                        onValueChange={(value) => {
                          if (isCardEditing) {
                            handleCardInputChange(
                              health.id,
                              "answer",
                              value === "true"
                            );
                          } else if (isEditingHealth) {
                            // You'll need to add handleHealthInputChange to props
                          }
                        }}
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
                      <Badge className="text-red-600 bg-red-50">
                        {displayData.answer ? "Yes" : "No"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6" />

                {/* Row 2: Note | Admin Remarks */}
                <div className="flex items-start justify-between">
                  <div className="w-1/2 pr-6">
                    <p className="text-sm font-medium text-gray-500">Note</p>

                    {isCardEditing || isEditingHealth ? (
                      <Input
                        value={displayData.note || ""}
                        onChange={(e) => {
                          if (isCardEditing) {
                            handleCardInputChange(
                              health.id,
                              "note",
                              e.target.value
                            );
                          } else if (isEditingHealth) {
                            // You'll need to add handleHealthInputChange to props
                          }
                        }}
                        placeholder="Enter note"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {displayData.note || "No additional notes"}
                      </p>
                    )}
                  </div>

                  <div className="w-px bg-gray-200 self-stretch" />

                  <div className="w-1/2 pl-6">
                    <p className="text-sm font-medium text-gray-500">
                      Admin Remarks
                    </p>

                    {isCardEditing || isEditingHealth ? (
                      <Textarea // Using Textarea for multi-line input
                        value={displayData.admin_remarks || ""}
                        onChange={(e) => {
                          if (isCardEditing) {
                            handleCardInputChange(
                              health.id,
                              "admin_remarks",
                              e.target.value
                            );
                          } else if (isEditingHealth) {
                            // You'll need to add handleHealthInputChange to props
                          }
                        }}
                        placeholder="Enter admin remarks"
                        className="mt-1 min-h-[80px]"
                        rows={3}
                      />
                    ) : (
                      <div className="mt-1">
                        {displayData.admin_remarks ? (
                          <div className="bg-yellow-50 text-yellow-800 rounded-md p-3 text-sm">
                            {displayData.admin_remarks}
                          </div>
                        ) : (
                          <Badge variant="default" className="text-yellow-500 bg-yellow-50 border-0">
                            No admin remarks
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}