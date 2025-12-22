"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStepper } from "./DriverStepper";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  userId:number|null;
}

export function HealthQuestionsStep({
  driverId,
  setHealthQuestionsData,
  userId
}: HealthQuestionsStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const cookies = useCookies();

  const [healthQuestions, setHealthQuestions] = useState<HealthQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local form state
  const [answers, setAnswers] = useState<Record<number, string>>({}); // "true" | "false"
  const [notes, setNotes] = useState<Record<number, string>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Fetch health questions
  // -------------------------------------------------------------------
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

        if (!response.ok) throw new Error("Failed to fetch health questions");

        const data = await response.json();
        if (data.success) {
          setHealthQuestions(data.data);

          // Initialise answers/notes (you can pre-fill from existing answers if needed)
          const initAnswers: Record<number, string> = {};
          const initNotes: Record<number, string> = {};
          data.data.forEach((q: HealthQuestion) => {
            initAnswers[q.id] = q.answer?.toString() ?? "false";
            initNotes[q.id] = "";
          });
          setAnswers(initAnswers);
          setNotes(initNotes);
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

  // -------------------------------------------------------------------
  // Form submission (used by both Save & Next buttons)
  // -------------------------------------------------------------------
  const handleSubmit = async (e?: React.FormEvent, goNext: boolean = false) => {
    e?.preventDefault();

    if (!driverId) {
      setSubmitError(
        "Please complete the 'Personal Info' and 'Next of Kin' steps first."
      );
      return;
    }

    // ---------- Client-side validation ----------
    const errors: string[] = [];

    for (const q of healthQuestions) {
      const ans = answers[q.id];
      const note = notes[q.id]?.trim();

      if (!ans) {
        errors.push(`Please answer: "${q.question}"`);
      } else if (ans === "true" && !note) {
        errors.push(`Notes are required for: "${q.question}"`);
      }
    }

    if (errors.length > 0) {
      setSubmitError(errors.join("; "));
      return;
    }

    // ---------- Prepare payload ----------
    if (userId === null) {
      setSubmitError("User ID is missing. Please log in again.");
      setSubmitting(false);
      return;
    }
    const healthAnswers: HealthAnswer[] = healthQuestions.map((q) => ({
      question: q.id,
      answered_by: userId,
      answer: answers[q.id] === "true",
      note: notes[q.id]?.trim() || "No additional notes",
    }));

    // ---------- API call ----------
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/profiles/health-answers/bulk-create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token") || ""}`,
          },
          body: JSON.stringify({ health_answers: healthAnswers }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.message || "Failed to submit health answers");
        return;
      }

      // Success → store data for parent & move forward if requested
      const formDataLike: Record<string, string> = {};
      healthQuestions.forEach((q) => {
        formDataLike[`question_${q.id}_answer`] = answers[q.id]!;
        formDataLike[`question_${q.id}_note`] = notes[q.id] ?? "";
      });
      setHealthQuestionsData(formDataLike);

      if (goNext) goToNextStep();
    } catch (err) {
      setSubmitError(`Error submitting health answers: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="text-orange-500">Step 3:</span> Health Questions
        </CardTitle>
        <CardDescription>
          Please answer the following health-related questions.
        </CardDescription>
      </CardHeader>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <CardContent className="space-y-6 min-h-[200px]">
          {driverId === null ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              Please complete the &quot;Personal Info&quot; and &quot;Next of Kin&quot; steps first.
            </div>
          ) : loading ? (
            <div className="text-center text-gray-500 font-medium py-8">
              Loading questions...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              {error}
            </div>
          ) : healthQuestions.length === 0 ? (
            <div className="text-center text-gray-500 font-medium py-8">
              No health questions available.
            </div>
          ) : (
            healthQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.question}</Label>

                <RadioGroup
                  value={answers[q.id] ?? "false"}
                  onValueChange={(val) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: val }))
                  }
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="true"
                      id={`q${q.id}-yes`}
                      className="border-orange-500 text-orange-500"
                    />
                    <Label htmlFor={`q${q.id}-yes`}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="false"
                      id={`q${q.id}-no`}
                      className="border-orange-500 text-orange-500"
                    />
                    <Label htmlFor={`q${q.id}-no`}>No</Label>
                  </div>
                </RadioGroup>

                <Textarea
                  placeholder={
                    answers[q.id] === "true"
                      ? "Required - add notes here"
                      : "Optional notes"
                  }
                  className={`mt-2 ${
                    answers[q.id] === "true" && !notes[q.id]?.trim()
                      ? "border-red-500"
                      : ""
                  }`}
                  value={notes[q.id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </div>
            ))
          )}

          {submitError && (
            <p className="text-sm text-red-500 mt-4" aria-live="polite">
              {submitError}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="grid grid-cols-3 gap-3 w-full">
            {/* Previous */}
            <Button
              type="button"
              variant="outline"
              className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
              onClick={goToPreviousStep}
              disabled={disableBack || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {/* Save only */}
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-lg"
              disabled={submitting || driverId === null || loading || !!error}
            >
              {submitting ? "Saving..." : "Save"}
            </Button>

            {/* Save & Next */}
            <Button
              type="button"
              variant="outline"
              className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
              onClick={() => handleSubmit(undefined, true)}
              disabled={submitting || driverId === null || loading || !!error}
            >
              Next & Save
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}