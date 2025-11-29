"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check } from "lucide-react"

// Stepper Context
interface StepperContextType {
  currentStep: number
  totalSteps: number
  goToNextStep: () => void
  goToPreviousStep: () => void
  goToStep: (step: number) => void
  disableBack?: boolean
  completedSteps: Set<number>
}

const StepperContext = React.createContext<StepperContextType | undefined>(undefined)

function useStepper() {
  const context = React.useContext(StepperContext)
  if (!context) {
    throw new Error("useStepper must be used within a StepperProvider")
  }
  return context
}

// Stepper Provider
interface StepperProviderProps {
  initialStep?: number
  totalSteps: number
  disableBack?: boolean
  onStepChange?: (step: number) => void
  children: React.ReactNode
}

function StepperProvider({ initialStep = 0, totalSteps, disableBack = false, onStepChange, children }: StepperProviderProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep)
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())

  const goToNextStep = React.useCallback(() => {
    const nextStep = Math.min(currentStep + 1, totalSteps - 1)
    setCompletedSteps((prev) => new Set([...prev, currentStep]))
    setCurrentStep(nextStep)
    onStepChange?.(nextStep)
  }, [currentStep, totalSteps, onStepChange])

  const goToPreviousStep = React.useCallback(() => {
    if (!disableBack && currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      onStepChange?.(prevStep)
    }
  }, [currentStep, disableBack, onStepChange])

  const goToStep = React.useCallback((step: number) => {
    const targetStep = Math.max(0, Math.min(step, totalSteps - 1))
    if (!disableBack || targetStep >= currentStep || completedSteps.has(targetStep)) {
      setCurrentStep(targetStep)
      onStepChange?.(targetStep)
    }
  }, [currentStep, totalSteps, disableBack, completedSteps, onStepChange])

  const value = React.useMemo(() => ({
    currentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    disableBack,
    completedSteps,
  }), [currentStep, totalSteps, goToNextStep, goToPreviousStep, goToStep, disableBack, completedSteps])

  return <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
}

// Main Stepper Wrapper
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStep?: number
  totalSteps: number
  disableBack?: boolean
  onStepChange?: (step: number) => void
}

function Stepper({ initialStep, totalSteps, disableBack = false, onStepChange, className, children, ...props }: StepperProps) {
  return (
    <StepperProvider initialStep={initialStep} totalSteps={totalSteps} disableBack={disableBack} onStepChange={onStepChange}>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        {children}
      </div>
    </StepperProvider>
  )
}

// Stepper Tabs
interface StepperTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  labels?: string[]
  icons?: React.ReactNode[]
}

function StepperTabs({
  labels,
  className,
  ...props
}: StepperTabsProps) {
  const { currentStep, totalSteps, goToStep } = useStepper();
  const safeLabels = labels ?? Array.from({ length: totalSteps }, (_, i) => `Step ${i + 1}`);

  // Calculate progress percentage (0% → 100%)
  const progress = currentStep > 0 ? ((currentStep) / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={cn("relative w-full", className)} {...props}>
      {/* Background Line (Gray) */}
      <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-300" />

      {/* Progress Line (Red) - Smoothly grows from left */}
      <div
        className="absolute top-5 left-10 h-0.5 bg-[#e53339] transition-all duration-500 ease-in-out origin-left"
        style={{
          right: `${100 - progress}%`,
        }}
      />

      {/* Steps */}
      <div className="relative flex items-center justify-between">
        {safeLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              // onClick={() => goToStep(index)}
              className="z-10 flex flex-col items-center gap-3 focus:outline-none"
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-[#e53339] border-[#e53339]"
                    : isCurrent
                      ? "bg-white border-[#e53339]"
                      : "bg-white border-gray-300"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-[#e53339]" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-300" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors duration-300",
                  isCurrent ? "text-[#e53339]" : isCompleted ? "text-black" : "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stepper Content
interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode[]
}

function StepperContent({ children, className, ...props }: StepperContentProps) {
  const { currentStep } = useStepper()
  return (
    <Card className={cn("p-6", className)} {...props}>
      <div className="animate-in fade-in-50 duration-300">
        {children[currentStep]}
      </div>
    </Card>
  )
}

// Stepper Navigation
interface StepperNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  disableBack?: boolean
  nextLabel?: string
  previousLabel?: string
  showSaveButton?: boolean
  saveLabel?: string
  onSave?: () => void
  onNext?: () => void
  onPrevious?: () => void
}

function StepperNavigation({ 
  className, 
  disableBack: disableBackProp,
  nextLabel = "Next",
  previousLabel = "Previous",
  showSaveButton = false,
  saveLabel = "Save & Continue",
  onSave,
  onNext,
  onPrevious,
  ...props 
}: StepperNavigationProps) {
  const { currentStep, totalSteps, goToNextStep, goToPreviousStep, disableBack: disableBackContext } = useStepper()
  const disableBack = disableBackProp ?? disableBackContext ?? false
  const isLastStep = currentStep === totalSteps - 1

  const handleNext = () => {
    onNext?.()
    goToNextStep()
  }

  const handlePrevious = () => {
    onPrevious?.()
    goToPreviousStep()
  }

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {showSaveButton && (
        <Button
          type="button"
          onClick={onSave}
          className="w-full bg-orange hover:bg-orange/90 text-white"
        >
          {saveLabel}
        </Button>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={disableBack || currentStep === 0}
          className="bg-magenta hover:bg-magenta/90 text-white"
        >
          {previousLabel}
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-orange hover:bg-orange/90 text-white"
          disabled={isLastStep}
        >
          {isLastStep ? "Finish" : nextLabel}
        </Button>
      </div>
    </div>
  )
}

// Exports
export {
  Stepper,
  StepperTabs,
  StepperContent,
  StepperNavigation,
  useStepper,
}