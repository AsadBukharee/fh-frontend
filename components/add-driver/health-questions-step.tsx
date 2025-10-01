"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStepper } from "./DriverStepper";
import { useActionState } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface HealthQuestion {
  id: number;
  question: string;
  answer?: boolean;
  created_at: string;
  updated_at: string;
}

interface HealthAnswer {
  question: number;
  answered_by: number;
  answer: boolean;
  note: string;
}

interface HealthQuestionsStepProps {
  driverId: number | null;
  setHealthQuestionsData: (data: Record<string, string>) => void;
}

export function HealthQuestionsStep({ driverId, setHealthQuestionsData }: HealthQuestionsStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const cookies = useCookies();
  const [healthQuestions, setHealthQuestions] = useState<HealthQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const [healthQuestionsState, healthQuestionsAction, healthQuestionsPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      if (driverId === null) {
        return { success: false, message: "Please complete the 'Personal Info' and 'Next of Kin' steps first." };
      }

      const newErrors: string[] = [];
      for (const q of healthQuestions) {
        const ans = formData.get(`question_${q.id}_answer`)?.toString();
        const note = formData.get(`question_${q.id}_note`)?.toString().trim();
        if (ans === undefined) {
          newErrors.push(`Please answer: "${q.question}"`);
        } else if (ans === "true" && !note) {
          newErrors.push(`Notes are required for: "${q.question}"`);
        }
      }

      if (newErrors.length > 0) {
        return { success: false, message: newErrors.join("; ") };
      }

      const healthAnswers: HealthAnswer[] = [];
      for (const q of healthQuestions) {
        const questionId = q.id;
        const answer = formData.get(`question_${questionId}_answer`) === "true";
        const note = formData.get(`question_${questionId}_note`)?.toString() || "";

        healthAnswers.push({
          question: questionId,
          answered_by: driverId,
          answer,
          note: note || "No additional notes",
        });
      }

      try {
        const response = await fetch(`${API_URL}/api/profiles/health-answers/bulk-create/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token") || ""}`,
          },
          body: JSON.stringify({ health_answers: healthAnswers }),
        });

        const result = await response.json();
        if (!response.ok) {
          return { success: false, message: result.message || "Failed to submit health answers" };
        }

        setHealthQuestionsData(
          Object.fromEntries(
            Array.from(formData.entries()).map(([k, v]) => [k, typeof v === "string" ? v : v.toString()])
          )
        );
        goToNextStep();
        return { success: true, message: "Health answers submitted successfully", data: result.data };
      } catch (error) {
        return { success: false, message: `Error submitting health answers: ${(error as Error).message}` };
      }
    },
    { success: false, message: "" },
  );

  useEffect(() => {
    async function fetchHealthQuestions() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/profiles/health-questions/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token") || ""}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch health questions");
        }

        const data = await response.json();
        if (data.success) {
          setHealthQuestions(data.data);
          // Initialize answers and notes for existing questions
          const initialAnswers: Record<number, string> = {};
          const initialNotes: Record<number, string> = {};
          data.data.forEach((q: HealthQuestion) => {
            initialAnswers[q.id] = q.answer?.toString() || "false";
            initialNotes[q.id] = "";
          });
          setAnswers(initialAnswers);
          setNotes(initialNotes);
        } else {
          setError(data.message || "Failed to load questions");
        }
      } catch (err) {
        setError("Error fetching questions: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchHealthQuestions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Health Questions</CardTitle>
        <CardDescription>Please answer the following health-related questions.</CardDescription>
      </CardHeader>
      <form action={healthQuestionsAction}>
        <input type="hidden" name="driver_id" value={driverId || ""} />
        <CardContent className="space-y-6 min-h-[200px]">
          {driverId === null ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              Please complete the &quot;Personal Info&quot; and &quot;Next of Kin&quot; steps first.
            </div>
          ) : loading ? (
            <div className="text-center text-gray-500 font-medium py-8">Loading questions...</div>
          ) : error ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">{error}</div>
          ) : healthQuestions.length === 0 ? (
            <div className="text-center text-gray-500 font-medium py-8">No health questions available.</div>
          ) : (
            healthQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.question}</Label>
                <RadioGroup
                  name={`question_${q.id}_answer`}
                  value={answers[q.id] || "false"}
                  className="flex space-x-4"
                  onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`q${q.id}-yes`} />
                    <Label htmlFor={`q${q.id}-yes`}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`q${q.id}-no`} />
                    <Label htmlFor={`q${q.id}-no`}>No</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  name={`question_${q.id}_note`}
                  placeholder={answers[q.id] === "true" ? "Required - add notes here" : "Optional notes"}
                  className={`mt-2 ${answers[q.id] === "true" && !notes[q.id]?.trim() ? "border-red-500" : ""}`}
                  required={answers[q.id] === "true"}
                  value={notes[q.id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))
          )}
          {healthQuestionsState?.message && !healthQuestionsState.success && (
            <p className="text-sm text-red-500 mt-4" aria-live="polite">
              {healthQuestionsState.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="border border-magenta text-magenta"
            onClick={goToPreviousStep}
            disabled={disableBack || healthQuestionsPending || loading}
          >
            Previous
          </Button>
          <Button
            type="submit"
            className="bg-magenta text-white"
            disabled={healthQuestionsPending || driverId === null || loading || !!error}
          >
            {healthQuestionsPending ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}