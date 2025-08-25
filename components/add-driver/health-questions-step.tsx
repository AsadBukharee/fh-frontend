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
  const cookies = useCookies()
  const [answers, setAnswers] = useState<Record<number, string>>({}) // Track Yes/No answers
  const [notes, setNotes] = useState<Record<number, string>>({}) // Track notes
  const [validationError, setValidationError] = useState<string | null>(null)

  const [healthQuestionsState, healthQuestionsAction, healthQuestionsPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (driverId === null) {
        return { success: false, message: "Please complete the 'Personal Info' and 'Next of Kin' steps first." }
      }

      // 🚨 Validate notes if "Yes" is selected
      for (const q of healthQuestions) {
        const ans = formData.get(`question_${q.id}_answer`)
        const note = formData.get(`question_${q.id}_note`)?.toString().trim()
        if (ans === "true" && !note) {
          return { success: false, message: `Notes are required for: "${q.question}"` }
        }
      }

      formData.append("driver_id", driverId!.toString())
      try {
        const driverId = formData.get("driver_id")?.toString()
        if (!driverId) {
          return { success: false, message: "Driver ID is required" }
        }

        const healthAnswers = []
        for (const [key, value] of formData.entries()) {
          const questionMatch = key.match(/question_(\d+)_answer/)
          if (questionMatch) {
            const questionId = parseInt(questionMatch[1], 10)
            const answer = value === "true"
            const noteKey = `question_${questionId}_note`
            const note = formData.get(noteKey)?.toString() || ""

            healthAnswers.push({
              question: questionId,
              answered_by: parseInt(driverId, 10),
              answer,
              note: note || "No additional notes",
            })
          }
        }

        if (healthAnswers.length === 0) {
          return { success: false, message: "No health answers provided" }
        }

        const response = await fetch(`${API_URL}/api/profiles/health-answers/bulk-create/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token") || ""}`,
          },
          body: JSON.stringify({ health_answers: healthAnswers }),
        })

        const result = await response.json()
        if (!response.ok) {
          return { success: false, message: result.message || "Failed to submit health answers" }
        }

        setHealthQuestionsData(Object.fromEntries(formData.entries()))
        goToNextStep()

        return { success: true, message: "Health answers submitted successfully", data: result.data }
      } catch (error) {
        return { success: false, error, message: "An error occurred while submitting health answers" }
      }
    },
    { success: false, message: "" },
  )

  // Fetch questions
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
            <div className="text-center text-red-500 font-medium py-8">Please complete the &quot;Personal Info&quot; and &quot;Next of Kin&quot; steps first.</div>
          ) : loading ? (
            <div className="text-center text-gray-500 font-medium py-8">Loading questions...</div>
          ) : error ? (
            <div className="text-center text-red-500 font-medium py-8">{error}</div>
          ) : healthQuestions.length === 0 ? (
            <div className="text-center text-gray-500 font-medium py-8">No health questions available.</div>
          ) : (
            healthQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.question}</Label>
                <RadioGroup
                  name={`question_${q.id}_answer`}
                  defaultValue={q.answer?.toString()}
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
                  className={`mt-2 ${answers[q.id] === "true" && !notes[q.id] ? "border-red-500" : ""}`}
                  required={answers[q.id] === "true"}
                  value={notes[q.id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))
          )}
          {(healthQuestionsState?.message && !healthQuestionsState.success) || validationError ? (
            <p className="text-sm text-red-500">{healthQuestionsState.message || validationError}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={goToPreviousStep}>
            Previous
          </Button>
          <Button type="submit" disabled={healthQuestionsPending || driverId === null || loading || !!error}>
            {healthQuestionsPending ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
