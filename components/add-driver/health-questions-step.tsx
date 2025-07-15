"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useStepper } from "@/components/ui/stepper"
import { useActionState } from "react"
import { submitHealthQuestions } from "../action"

interface HealthQuestionsStepProps {
  driverId: number | null
  setHealthQuestionsData: (data: any) => void
}

export function HealthQuestionsStep({ driverId, setHealthQuestionsData }: HealthQuestionsStepProps) {
  const { goToNextStep, goToPreviousStep } = useStepper()

  const [healthQuestionsState, healthQuestionsAction, healthQuestionsPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (driverId === null) {
        return { success: false, message: "Please complete the 'Personal Info' and 'Next of Kin' steps first." }
      }
      formData.append("driver_id", driverId!.toString())
      const result = await submitHealthQuestions(prevState, formData)
      if (result.success) {
        setHealthQuestionsData(Object.fromEntries(formData.entries()))
        goToNextStep()
      }
      return result
    },
    { success: false, message: "" },
  )

  const healthQuestionsList = [
    { id: 1, text: "Do you have any medical conditions?" },
    { id: 2, text: "Are you taking any medications?" },
    { id: 3, text: "Do you have any vision problems?" },
    { id: 4, text: "Do you have any history of seizures or blackouts?" },
    { id: 5, text: "Have you ever been diagnosed with diabetes?" },
  ]

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
          ) : (
            healthQuestionsList.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label>{q.text}</Label>
                <RadioGroup name={`question_${q.id}_answer`} defaultValue="false" className="flex space-x-4">
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
          <Button type="submit" className="bg-magenta text-white" disabled={healthQuestionsPending || driverId === null}>
            {healthQuestionsPending ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
