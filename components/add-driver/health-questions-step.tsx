"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useStepper } from "@/components/ui/stepper"
import { useActionState } from "react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface HealthQuestion {
  id: number
  question: string
  answer: boolean
  created_at: string
  updated_at: string
}

interface HealthQuestionsStepProps {
  driverId: number | null
  setHealthQuestionsData: (data: any) => void
}

 

export function HealthQuestionsStep({ driverId, setHealthQuestionsData }: HealthQuestionsStepProps) {
  const { goToNextStep, goToPreviousStep } = useStepper()
  const [healthQuestions, setHealthQuestions] = useState<HealthQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cookies=useCookies();

  const [healthQuestionsState, healthQuestionsAction, healthQuestionsPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (driverId === null) {
        return { success: false, message: "Please complete the 'Personal Info' and 'Next of Kin' steps first." }
      }
      formData.append("driver_id", driverId!.toString())
        try {
    const driverId = formData.get("driver_id")?.toString();
    if (!driverId) {
      return { success: false, message: "Driver ID is required" };
    }

    const healthAnswers = [];
    for (const [key, value] of formData.entries()) {
      const questionMatch = key.match(/question_(\d+)_answer/);

      if (questionMatch) {
        const questionId = parseInt(questionMatch[1], 10);
        const answer = value === "true";
        const noteKey = `question_${questionId}_note`;
        const note = formData.get(noteKey)?.toString() || "";

        healthAnswers.push({
          question: questionId,
          answered_by: parseInt(driverId, 10),
          answer,
          note: note || "No additional notes",
        });
      }
    }

    if (healthAnswers.length === 0) {
      return { success: false, message: "No health answers provided" };
    }

    const response = await fetch(`${API_URL}/api/profiles/health-answers/bulk-create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if required
              Authorization: `Bearer ${cookies.get("access_token") || ""}`,
      },
      body: JSON.stringify({ health_answers: healthAnswers }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to submit health answers",
      };
    }
    setHealthQuestionsData(Object.fromEntries(formData.entries()))
        goToNextStep()

    return {
      success: true,
      message: "Health answers submitted successfully",
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error:error,
      message: "An error occurred while submitting health answers",
    };
  }
   
    },
    { success: false, message: "" },
  )

  // Fetch health questions from the API
  useEffect(() => {
    async function fetchHealthQuestions() {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/profiles/health-questions/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token") || ""}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch health questions")
        }

        const data = await response.json()
        if (data.success) {
          setHealthQuestions(data.data)
        } else {
          setError(data.message || "Failed to load questions")
        }
      } catch (err) {
        console.log(err)
        setError("An error occurred while fetching questions")
      } finally {
        setLoading(false)
      }
    }

    fetchHealthQuestions()
  }, [])

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
              Please complete the &quot;Personal Info&quot; and &quot;Next of Kin&quot; steps first to enable this section.
            </div>
          ) : loading ? (
            <div className="text-center text-gray-500 font-medium py-8" aria-live="polite">
              Loading questions...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              {error}
            </div>
          ) : healthQuestions.length === 0 ? (
            <div className="text-center text-gray-500 font-medium py-8" aria-live="polite">
              No health questions available.
            </div>
          ) : (
            healthQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.question}</Label>
                <RadioGroup
                  name={`question_${q.id}_answer`}
                  defaultValue={q.answer.toString()}
                  className="flex space-x-4"
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
                  placeholder="Add any relevant notes here (optional)"
                  className="mt-2"
                />
              </div>
            ))
          )}
          {healthQuestionsState?.message && !healthQuestionsState.success && (
            <p className="text-sm text-red-500" aria-live="polite">
              {healthQuestionsState.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" className="border border-magenta text-magenta" onClick={goToPreviousStep}>
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
  )
}