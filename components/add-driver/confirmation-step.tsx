"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    if (!driverId) {
      setError("Driver ID missing. Complete previous steps first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const token = cookies.get("access_token");
    if (!token) {
      setError("Missing authentication token. Please log in again.");
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
      if (!response.ok) throw new Error(result.message || "Submission failed");

      alert("Application submitted successfully!");
    } catch (err) {
      setError(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-muted shadow-md rounded-lg bg-white dark:bg-neutral-900 transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold text-primary">
          Step 5: Confirmation
        </CardTitle>
        <CardDescription>
          Review all entered information carefully before submitting.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <Section title="Personal Information">
          <DataRow label="Name" value={personalInfoData?.driver_name} />
          <DataRow label="Date of Birth" value={personalInfoData?.date_of_birth} />
          <DataRow label="Phone" value={personalInfoData?.phone} />
          <DataRow label="Address" value={personalInfoData?.address1} />
          <DataRow label="NI Number" value={personalInfoData?.national_insurance_no} />
          <DataRow
            label="Have Other Job"
            value={personalInfoData?.have_other_job === "on" ? "Yes" : "No"}
          />
        </Section>

        <Separator />

        <Section title="Next of Kin">
          <DataRow label="Name" value={nextOfKinData?.next_of_kin_name} />
          <DataRow label="Contact" value={nextOfKinData?.next_of_kin_contact} />
          <DataRow label="Relationship" value={nextOfKinData?.next_of_kin_relationship} />
          <DataRow label="Address" value={nextOfKinData?.next_of_kin_address} />
        </Section>

        <Separator />

        <Section title="Health Questions">
          {healthQuestionsList.map((q) => {
            const answer = healthQuestionsData?.[`question_${q.id}_answer`] === "true" ? "Yes" : "No";
            const note = healthQuestionsData?.[`question_${q.id}_note`];
            return (
              <div
                key={q.id}
                className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-muted/40 last:border-none"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">{q.text}</span>
                <span className="flex items-center gap-2">
                  <Badge variant={answer === "Yes" ? "default" : "secondary"}>{answer}</Badge>
                  {note && (
                    <span className="text-sm text-muted-foreground">(Note: {note})</span>
                  )}
                </span>
              </div>
            );
          })}
        </Section>

        <Separator />

        <Section title="Documents">
          {documentTypes?.map((docType) => {
const doc = (documentsData?.[docType.id] as ProfessionalCompetency) || {};
           const status = doc?.has_document
  ? "Uploaded"
  : documentsData?.[`${docType.id}_reason`]
  ? `Not Provided (Reason: ${documentsData[`${docType.id}_reason`]})`
  : "Not Provided";


            return (
              <div
                key={docType.id}
                className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-muted/40 last:border-none"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {docType.label}
                </span>
                <span className="flex items-center gap-2">
                  <Badge
                    variant={doc?.has_document ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {status}
                  </Badge>
                  {doc?.expiry_date && (
                    <span className="text-sm text-muted-foreground">
                      Expiry: {doc.expiry_date}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </Section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="text-center text-green-600 font-medium">
          ✅ All steps completed. Ready for submission.
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={disableBack || submitting}
        >
          Previous
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Application"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper section block
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-primary">{title}</h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

// Helper data row
function DataRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
      <span className="text-gray-600 dark:text-gray-400">{value || "N/A"}</span>
    </div>
  );
}
