"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Stepper Context
interface StepperContextType {
  currentStep: number
  totalSteps: number
  goToNextStep: () => void
  goToPreviousStep: () => void
  goToStep: (step: number) => void
  disableBack?: boolean // Added to context
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
  disableBack?: boolean // Added prop
  children: React.ReactNode
}

function StepperProvider({ initialStep = 0, totalSteps, disableBack = false, children }: StepperProviderProps) {
  const [currentStep, setCurrentStep] = React.useState(initialStep)

  const goToNextStep = React.useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }, [totalSteps])

  const goToPreviousStep = React.useCallback(() => {
    if (!disableBack) {
      setCurrentStep((prev) => Math.max(prev - 1, 0))
    }
  }, [disableBack])

  const goToStep = React.useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)))
  }, [totalSteps])

  const value = React.useMemo(() => ({
    currentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    disableBack,
  }), [currentStep, totalSteps, goToNextStep, goToPreviousStep, goToStep, disableBack])

  return <StepperContext.Provider value={value}>{children}</StepperContext.Provider>
}

// Main Stepper Wrapper
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStep?: number
  totalSteps: number
  disableBack?: boolean // Added prop
}

function Stepper({ initialStep, totalSteps, disableBack = false, className, children, ...props }: StepperProps) {
  return (
    <StepperProvider initialStep={initialStep} totalSteps={totalSteps} disableBack={disableBack}>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        {children}
      </div>
    </StepperProvider>
  )
}

// Stepper Tabs
interface StepperTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  labels?: string[]
}

function StepperTabs({ labels, className, ...props }: StepperTabsProps) {
  const { currentStep, totalSteps, goToStep, disableBack } = useStepper()

  return (
    <div className={cn("flex items-center justify-between gap-4", className)} {...props}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <button
            type="button"
            role="tab"
            aria-selected={currentStep === index}
            aria-controls={`stepper-panel-${index}`}
            onClick={() => {
              if (!disableBack || index >= currentStep) {
                goToStep(index)
              }
            }}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 group",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
            disabled={disableBack && index < currentStep} // Disable clicking on previous steps if disableBack is true
          >
            <div className={cn(
              "flex size-8 items-center justify-center rounded-full border-2",
              currentStep === index
                ? "border-orange bg-orange text-orange-foreground"
                : "border-input bg-background text-muted-foreground group-hover:border-orange group-hover:text-orange"
            )}>
              {index + 1}
            </div>
            {labels?.[index] && (
              <span className={cn(
                "text-sm font-medium text-center",
                currentStep === index
                  ? "text-orange"
                  : "text-muted-foreground group-hover:text-foreground"
              )}>
                {labels[index]}
              </span>
            )}
          </button>

          {index < totalSteps - 1 && (
            <div className={cn("h-0.5 flex-1 rounded-full", currentStep > index ? "bg-orange" : "bg-muted")} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Stepper Content
interface StepperContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode[]
}

function StepperContent({ children, className, ...props }: StepperContentProps) {
  const { currentStep } = useStepper()
  return (
    <Card className={cn("p-6", className)} {...props}>
      {children[currentStep]}
    </Card>
  )
}

// Stepper Navigation
interface StepperNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  disableBack?: boolean // Added prop
}

function StepperNavigation({ className, disableBack: disableBackProp, ...props }: StepperNavigationProps) {
  const { currentStep, totalSteps, goToNextStep, goToPreviousStep, disableBack: disableBackContext } = useStepper()
  const disableBack = disableBackProp ?? disableBackContext ?? false // Use prop if provided, otherwise context

  return (
    <div className={cn("flex justify-end gap-2", className)} {...props}>
      <Button
        variant="outline"
        onClick={goToPreviousStep}
        disabled={disableBack || currentStep === 0}
        className="bg-magenta text-white"
      >
        Previous
      </Button>
      <Button
        onClick={goToNextStep}
        className="bg-orange text-white"
        disabled={currentStep === totalSteps - 1}
      >
        {currentStep === totalSteps - 1 ? "Finish" : "Next"}
      </Button>
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