"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStepper } from "./DriverStepper";
import { useCookies } from "next-client-cookies";
import API_URL from "@/app/utils/ENV";

interface PersonalInfoData {
  driver_name?: string;
  date_of_birth?: string;
  phone?: string;
  address1?: string;
  national_insurance_no?: string;
  have_other_job?: "on" | "off";
}

interface NextOfKinData {
  next_of_kin_name?: string;
  next_of_kin_contact?: string;
  next_of_kin_relationship?: string;
  next_of_kin_address?: string;
}

interface HealthQuestionData {
  [key: string]: string;
}

interface DocumentData {
  [key: string]: string | ProfessionalCompetency;
}

interface ProfessionalCompetency {
  document_name: string;
  has_expiry: boolean;
  description: string;
  expiry_date: string;
  has_document: boolean;
  has_back_side: boolean;
  urls: string[];
  request_status: string;
  has_description: boolean;
  modules: Array<{ module_name: string; description: string; expiry_date: string }>;
}

interface ConfirmationStepProps {
  personalInfoData: PersonalInfoData;
  nextOfKinData: NextOfKinData;
  healthQuestionsData: HealthQuestionData;
  documentsData: DocumentData;
  driverId?: number | null;
}

export function ConfirmationStep({
  personalInfoData,
  nextOfKinData,
  healthQuestionsData,
  documentsData,
  driverId,
}: ConfirmationStepProps) {
  const { goToPreviousStep, disableBack } = useStepper();
  const cookies = useCookies();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const healthQuestionsList = [
    { id: 1, text: "Do you have any medical conditions?" },
    { id: 2, text: "Are you taking any medications?" },
    { id: 3, text: "Do you have any vision problems?" },
    { id: 4, text: "Do you have any history of seizures or blackouts?" },
    { id: 5, text: "Have you ever been diagnosed with diabetes?" },
  ];

  const documentTypes = [
    { id: "d_or_d1_license", label: "D or D1 License" },
    { id: "cpc", label: "CPC" },
    { id: "tacho_card", label: "Tacho Card" },
    { id: "Passport_Right_To_Work", label: "Passport / Right To Work" },
    { id: "proof_of_address", label: "Proof of Address" },
  ];

  const handleSubmit = async () => {
    if (driverId === null || driverId === undefined) {
      setError("Driver ID is missing. Please complete previous steps.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const token = cookies.get("access_token");
    if (!token) {
      setError("Authentication token is missing. Please log in again.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${driverId}/submit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personal_info: personalInfoData,
          next_of_kin: nextOfKinData,
          health_questions: healthQuestionsData,
          documents: documentsData,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to submit application");
      }

      alert("Application submitted successfully!");
    } catch (err) {
      setError(`Error submitting application: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: Confirmation</CardTitle>
        <CardDescription>Review your details and confirm your submission.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 min-h-[200px]">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          <p>
            <strong>Name:</strong> {personalInfoData?.driver_name || "N/A"}
          </p>
          <p>
            <strong>DOB:</strong> {personalInfoData?.date_of_birth || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {personalInfoData?.phone || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {personalInfoData?.address1 || "N/A"}
          </p>
          <p>
            <strong>NI No:</strong> {personalInfoData?.national_insurance_no || "N/A"}
          </p>
          <p>
            <strong>Other Job:</strong> {personalInfoData?.have_other_job === "on" ? "Yes" : "No"}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Next of Kin</h3>
          <p>
            <strong>Name:</strong> {nextOfKinData?.next_of_kin_name || "N/A"}
          </p>
          <p>
            <strong>Contact:</strong> {nextOfKinData?.next_of_kin_contact || "N/A"}
          </p>
          <p>
            <strong>Relationship:</strong> {nextOfKinData?.next_of_kin_relationship || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {nextOfKinData?.next_of_kin_address || "N/A"}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Health Questions</h3>
          {healthQuestionsList.map((q) => (
            <p key={q.id}>
              <strong>{q.text}</strong>{" "}
              {healthQuestionsData?.[`question_${q.id}_answer`] === "true" ? "Yes" : "No"}
              {healthQuestionsData?.[`question_${q.id}_note`] &&
                ` (Note: ${healthQuestionsData[`question_${q.id}_note`]})`}
            </p>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Documents</h3>
          {documentTypes.map((docType) => (
            <p key={docType.id}>
              <strong>{docType.label}:</strong>{" "}
              {(documentsData[docType.id] as ProfessionalCompetency)?.has_document
                ? "Uploaded"
                : documentsData?.[`${docType.id}_reason`]
                ? `Not Provided (Reason: ${documentsData[`${docType.id}_reason`]})`
                : "Not Provided"}
              {(documentsData[docType.id] as ProfessionalCompetency)?.expiry_date &&
                ` (Expiry: ${(documentsData[docType.id] as ProfessionalCompetency).expiry_date})`}
            </p>
          ))}
        </div>
        {error && (
          <p className="text-sm text-red-500 mt-4" aria-live="polite">
            {error}
          </p>
        )}
        <div className="mt-4 text-center text-lg font-medium text-green-600">
          All steps completed! Your application is ready for review.
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          className="border border-magenta text-magenta hover:bg-magenta-50"
          onClick={goToPreviousStep}
          disabled={disableBack || submitting}
        >
          Previous
        </Button>
        <Button
          type="button"
          className="bg-magenta text-white hover:bg-magenta-600"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </Button>
      </CardFooter>
    </Card>
  );
}