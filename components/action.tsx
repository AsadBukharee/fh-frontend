"use server";

import API_URL from "@/app/utils/ENV";
import { cookies } from "next/headers";

// Helper: Simulated delay
const simulateApiCall = async (data: any, success: boolean, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (success) {
        resolve({ success: true, data, message: "Operation successful" });
      } else {
        resolve({ success: false, message: "Simulated API error", error_code: "SIMULATED_ERROR" });
      }
    }, delay);
  });
};

// ==========================================
// 1. PERSONAL INFO API (✅ With Debug Logs)
// ==========================================
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

export async function submitPersonalInfo(formData: FormData, user_id: number): Promise<SubmitResponse> {
  console.log("[DEBUG] submitPersonalInfo called");
  console.log("[DEBUG] user_id:", user_id);
  console.log("[DEBUG] API_URL:", API_URL);

  try {
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

    console.log("[DEBUG] Raw form data:", rawPersonalInfo);

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
        console.warn(`[DEBUG] Missing field: ${field}`);
        return {
          success: false,
          message: `Missing required field: ${field.replace(/_/g, " ")}`,
        };
      }
    }

    const address = `${rawPersonalInfo.address1}, ${rawPersonalInfo.post_code}, UK`;

    const payload: ApiPayload = {
      user_id,
      personal_info: {
        driver_name: rawPersonalInfo.driver_name,
        date_of_birth: rawPersonalInfo.date_of_birth,
        phone: rawPersonalInfo.phone,
        address,
        account_no: rawPersonalInfo.account_no,
        sort_code: rawPersonalInfo.sort_code,
        post_code: rawPersonalInfo.post_code,
        national_insurance_no: rawPersonalInfo.national_insurance_no,
        license_number: rawPersonalInfo.license_number,
        license_issue_number: rawPersonalInfo.license_issue_number,
        have_other_jobs: rawPersonalInfo.have_other_jobs,
        have_other_jobs_note: rawPersonalInfo.have_other_jobs ? rawPersonalInfo.have_other_jobs_note || "" : "",
      },
      timestamp: new Date().toISOString(),
    };

    console.log("[DEBUG] API payload:", payload);

    const token = (await cookies()).get("access_token");
    console.log("[DEBUG] Access token present:", !!token?.value);

    const response = await fetch(`${API_URL}/api/profiles/driver/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token?.value || ""}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[DEBUG] Response status:", response.status);

    const result = await response.json();
    console.log("[DEBUG] API result:", result);

    if (!response.ok) {
      console.error("[DEBUG] API error response:", result);
      return {
        success: false,
        message: result.message || "Failed to submit personal information",
      };
    }

    return {
      success: true,
      message: "Personal information submitted successfully",
      data: {
        driver_id: result.driver_id || 123,
        step_completed: "personal_info",
        next_step: "next_of_kin",
        updated_at: new Date().toISOString(),
      },
    };
  } catch (error: unknown) {
    console.error("[DEBUG] submitPersonalInfo ERROR:", error);
    return {
      success: false,
      message: `Error submitting personal information: ${(error as Error).message}`,
    };
  }
}

// ==========================================
// 2. NEXT OF KIN API (With Debug Logs)
// ==========================================
export async function submitNextOfKinInfo(prevState: any, formData: FormData) {
  console.log("[DEBUG] submitNextOfKinInfo called");

  try {
    const driverId = formData.get("driver_id")?.toString();
    console.log("[DEBUG] Driver ID:", driverId);

    if (!driverId) {
      return { success: false, message: "Driver ID is required." };
    }

    const payload = {
      next_of_kin_name: formData.get("kin_name")?.toString() || "",
      next_of_kin_relationship: formData.get("kin_relationship")?.toString() || "",
      next_of_kin_contact: formData.get("kin_contact")?.toString() || "",
      next_of_kin_email: formData.get("kin_email")?.toString() || "",
      next_of_kin_address: formData.get("kin_address")?.toString() || "",
      driver_id: driverId,
    };

    console.log("[DEBUG] Payload:", payload);

    const token = (await cookies()).get("access_token");
    console.log("[DEBUG] Access token present:", !!token?.value);

    const response = await fetch(`${API_URL}/api/profiles/driver/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token?.value || ""}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[DEBUG] Response status:", response.status);

    const data = await response.json();
    console.log("[DEBUG] Response data:", data);

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to submit next of kin information.",
      };
    }

    return { success: true, message: "Next of kin info submitted successfully", data };
  } catch (error) {
    console.error("[DEBUG] submitNextOfKinInfo ERROR:", error);
    return { success: false, message: "An error occurred while submitting." };
  }
}

// ==========================================
// 3. HEALTH QUESTIONS API (With Debug Logs)
// ==========================================
export async function submitHealthQuestions(prevState: any, formData: FormData) {
  console.log("[DEBUG] submitHealthQuestions called");

  const driver_id = Number.parseInt(formData.get("driver_id") as string);
  console.log("[DEBUG] Driver ID:", driver_id);

  if (!driver_id) return { success: false, message: "Driver ID missing" };

  const healthQuestions: any[] = [];
  const questions = [
    { id: 1, text: "Do you have any medical conditions?" },
    { id: 2, text: "Are you taking any medications?" },
    { id: 3, text: "Do you have any vision problems?" },
  ];

  questions.forEach((q) => {
    const answer = formData.get(`question_${q.id}_answer`) === "true";
    const note = formData.get(`question_${q.id}_note`) as string;
    healthQuestions.push({ question_id: q.id, question_text: q.text, answer, note: note || "" });
  });

  console.log("[DEBUG] Health questions payload:", healthQuestions);

  const apiResponse = await simulateApiCall(
    {
      driver_id,
      step_completed: "health_questions",
      next_step: "documents",
      health_assessment_status: "pending_review",
      questions_answered: healthQuestions.length,
      flagged_questions: healthQuestions.filter((q) => q.answer).length,
      updated_at: new Date().toISOString(),
    },
    true
  );

  console.log("[DEBUG] Simulated API response:", apiResponse);
  return apiResponse as { success: boolean; message: string; data?: any };
}

// ==========================================
// 4. DOCUMENTS API (With Debug Logs)
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

export async function submitDocuments({
  driverId,
  competencies,
}: {
  driverId: number;
  competencies: { [key: string]: ProfessionalCompetency };
}) {
  console.log("[DEBUG] submitDocuments called");
  console.log("[DEBUG] driverId:", driverId);
  console.log("[DEBUG] competencies keys:", Object.keys(competencies));

  try {
    const professional_competencies = Object.values(competencies)
      .filter((c) => c.has_document || c.description)
      .map((c) => ({
        ...c,
        driver: driverId,
        urls: c.urls.filter(Boolean),
      }));

 console.log(
  "[DEBUG] Payload:",
  professional_competencies.map((c) => ({
    modules: c.modules.map((m) => m), // Return the module object itself
  }))
);
professional_competencies.forEach((c, index) => {
  if (c.modules.length > 0) {
    console.log(`[DEBUG] Competency ${index + 1} Modules:`, c.modules);
    // Or for deeper inspection:
    console.dir(c.modules, { depth: null });
  }
});
const token = (await cookies()).get("access_token")?.value;

    const response = await fetch(`${API_URL}/api/profiles/professional-competency/bulk-create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
       },
      body: JSON.stringify({ professional_competencies }),
    });

    console.log("[DEBUG] Response status:", response.status);
    const result = await response.json();
    console.log("[DEBUG] API response:", result);

    if (!response.ok) return { success: false, message: result.message || "Failed to submit documents." };

    return { success: true, message: "Documents submitted successfully." };
  } catch (error) {
    console.error("[DEBUG] submitDocuments ERROR:", error);
    return { success: false, message: "Error submitting documents." };
  }
}
