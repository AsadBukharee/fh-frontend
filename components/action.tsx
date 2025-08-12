"use server"

import API_URL from "@/app/utils/ENV"
import { cookies } from "next/headers"

// Helper to simulate API delay
const simulateApiCall = async (data: any, success: boolean, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (success) {
        resolve({ success: true, data, message: "Operation successful" })
      } else {
        resolve({ success: false, message: "Simulated API error", error_code: "SIMULATED_ERROR" })
      }
    }, delay)
  })
}

// ==========================================
// 1. PERSONAL INFO API (✅ FIXED)
// ==========================================
// Define the shape of the personal info data
interface PersonalInfo {
  driver_name: string;
  date_of_birth: string;
  phone: string;
  address1: string;
  post_code: string;
  account_no: string;
  sort_code: string;
  national_insurance_no: string;
  license_number: string;
  license_issue_number: string;
  have_other_jobs: boolean;
  have_other_jobs_note: string;
}

// Define the shape of the API payload
interface ApiPayload {
  user_id: number;
  personal_info: {
    driver_name: string;
    date_of_birth: string;
    phone: string;
    address: string;
    account_no: string;
    sort_code: string;
    post_code: string;
    national_insurance_no: string;
    license_number: string;
    license_issue_number: string;
    have_other_jobs: boolean;
    have_other_jobs_note: string;
  };
  timestamp: string;
}

// Define the shape of the response
interface SubmitResponse {
  success: boolean;
  message: string;
  data?: {
    driver_id: number;
    step_completed: string;
    next_step: string;
    updated_at: string;
  };
}

export async function submitPersonalInfo(
  formData: FormData,
  user_id: number
): Promise<SubmitResponse> {
  try {
    // Extract form data with type assertion
    const rawPersonalInfo: PersonalInfo = {
      driver_name: formData.get("driver_name") as string,
      date_of_birth: formData.get("date_of_birth") as string,
      phone: formData.get("phone") as string,
      address1: formData.get("address1") as string,
      post_code: formData.get("post_code") as string,
      account_no: formData.get("account_no") as string,
      sort_code: formData.get("sort_code") as string,
      national_insurance_no: formData.get("national_insurance_no") as string,
      license_number: formData.get("license_number") as string,
      license_issue_number: formData.get("license_issue_number") as string,
      have_other_jobs: formData.get("have_other_jobs") === "on",
      have_other_jobs_note: formData.get("have_other_jobs_note") as string,
    };

    // Validate required fields
    const requiredFields: (keyof PersonalInfo)[] = [
      "driver_name",
      "date_of_birth",
      "phone",
      "address1",
      "post_code",
      "account_no",
      "sort_code",
      "national_insurance_no",
      "license_number",
      "license_issue_number",
    ];

    for (const field of requiredFields) {
      if (!rawPersonalInfo[field]) {
        return {
          success: false,
          message: `Missing required field: ${field.replace(/_/g, " ")}`,
        };
      }
    }

    // Combine address1 and post_code to match API payload
    const address = `${rawPersonalInfo.address1}, ${rawPersonalInfo.post_code}, UK`;

    // Construct API payload
    const payload: ApiPayload = {
      user_id,
      personal_info: {
        driver_name: rawPersonalInfo.driver_name,
        date_of_birth: rawPersonalInfo.date_of_birth,
        phone: rawPersonalInfo.phone,
        address, // Combined address field
        account_no: rawPersonalInfo.account_no,
        sort_code: rawPersonalInfo.sort_code,
        post_code: rawPersonalInfo.post_code,
        national_insurance_no: rawPersonalInfo.national_insurance_no,
        license_number: rawPersonalInfo.license_number,
        license_issue_number: rawPersonalInfo.license_issue_number,
        have_other_jobs: rawPersonalInfo.have_other_jobs,
        have_other_jobs_note: rawPersonalInfo.have_other_jobs
          ? rawPersonalInfo.have_other_jobs_note || ""
          : "",
      },
      timestamp: new Date().toISOString(),
    };

    // Make API call
    const response = await fetch(`${API_URL}/api/profiles/driver/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await cookies()).get('access_token')}`
      },
      body: JSON.stringify(payload),
    });

    const result: { driver_id?: number; message?: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to submit personal information",
      };
    }

    return {
      success: true,
      message: "Personal information submitted successfully",
      data: {
        driver_id: result.driver_id || 123, // Fallback to simulated driver_id
        step_completed: "personal_info",
        next_step: "next_of_kin",
        updated_at: new Date().toISOString(),
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: `Error submitting personal information: ${(error as Error).message}`,
    };
  }
}

// ==========================================
// 2. NEXT OF KIN API
// ==========================================


export async function submitNextOfKinInfo(prevState: any, formData: FormData) {
  try {
    const driverId = formData.get("driver_id")?.toString();
    if (!driverId) {
      return { success: false, message: "Driver ID is required." };
    }

    // Prepare the payload from formData
    const payload = {
      next_of_kin_name: formData.get("kin_name")?.toString() || "",
      next_of_kin_relationship: formData.get("kin_relationship")?.toString() || "",
      next_of_kin_contact: formData.get("kin_contact")?.toString() || "",
      next_of_kin_email: formData.get("kin_email")?.toString() || "", // Note: Add kin_email to form if needed
      next_of_kin_address: formData.get("kin_address")?.toString() || "",
    };

    // Make the POST request
    const response = await fetch(`${API_URL}/api/profiles/driver/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
           Authorization: `Bearer ${(await cookies()).get('access_token')}`
        
      },
      body: JSON.stringify({ ...payload, driver_id: driverId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to submit next of kin information.",
      };
    }

    const data = await response.json();
    return { success: true, message: "Next of kin information submitted successfully.", data };
  } catch (error) {
    console.error("Error submitting next of kin info:", error);
    return { success: false, message: "An error occurred while submitting the information." };
  }
}

// ==========================================
// 3. HEALTH QUESTIONS API
// ==========================================
export async function submitHealthQuestions(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; data?: any }> {
  const driver_id = Number.parseInt(formData.get("driver_id") as string) // Get driver_id from hidden input

  if (!driver_id) {
    return { success: false, message: "Driver ID is missing. Please complete the previous steps." }
  }

  const healthQuestions: any[] = []
  let answeredCount = 0

  // Example questions - in a real app, these would come from a database
  const questions = [
    { id: 1, text: "Do you have any medical conditions?" },
    { id: 2, text: "Are you taking any medications?" },
    { id: 3, text: "Do you have any vision problems?" },
  ]

  questions.forEach((q) => {
    const answer = formData.get(`question_${q.id}_answer`) === "true"
    const note = formData.get(`question_${q.id}_note`) as string
    healthQuestions.push({
      question_id: q.id,
      question_text: q.text,
      answer: answer,
      note: note || "",
    })
    answeredCount++
  })

  // const payload = {
  //   driver_id: driver_id,
  //   health_questions: healthQuestions,
  //   completed_at: new Date().toISOString(),
  //   total_questions: questions.length,
  //   answers_provided: answeredCount,
  // }

  // Simulate API call
  const apiResponse = await simulateApiCall(
    {
      driver_id: driver_id,
      step_completed: "health_questions",
      next_step: "documents",
      health_assessment_status: "pending_review",
      questions_answered: answeredCount,
      flagged_questions: healthQuestions.filter((q) => q.answer).length,
      updated_at: new Date().toISOString(),
    },
    true,
  )

  return apiResponse as { success: boolean; message: string; data?: any }
}

// ==========================================
// 4. DOCUMENTS API
// ==========================================

interface ProfessionalCompetency {
  driver: number;
  document_name: string;
  has_expiry: boolean;
  description: string;
  expiry_date: string;
  has_document: boolean;
  has_back_side: boolean;
  urls: string[];
  request_status: string;
  has_description: boolean;
  modules: { module_name: string; description: string; expiry_date: string }[];
}
// types/professionalCompetency.ts
export interface Module {
  module_name: string;
  description: string;
  expiry_date: string;
}



interface ServerProfessionalCompetency extends ProfessionalCompetency {
  driver: number;
}

export async function submitDocuments({
  driverId,
  competencies,
}: {
  driverId: number;
  competencies: { [key: string]: ProfessionalCompetency };
}) {
  try {
    // Prepare the payload for the bulk API
    const professional_competencies: ServerProfessionalCompetency[] = Object.values(competencies)
      .filter((competency) => competency.has_document || competency.description) // Only include competencies with data
      .map((competency) => ({
        driver: driverId,
        document_name: competency.document_name,
        has_expiry: competency.has_expiry,
        description: competency.description,
        expiry_date: competency.expiry_date || "",
        has_document: competency.has_document,
        has_back_side: competency.has_back_side,
        urls: competency.urls.filter((url) => url), // Remove empty URLs
        request_status: competency.request_status,
        has_description: competency.has_description,
        modules: competency.modules || [],
      }));

    // Make the API call
    const response = await fetch(`${process.env.API_BASE_URL}/api/profiles/professional-competency/bulk-create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if required (e.g., Authorization: Bearer <token>)
      },
      body: JSON.stringify({ professional_competencies }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to submit documents.",
      };
    }

    // Revalidate cache if needed

    return {
      success: true,
      message: "Documents submitted successfully.",
    };
  } catch (error) {
    console.error("Error submitting documents:", error);
    return {
      success: false,
      message: "An error occurred while submitting documents.",
    };
  }
}