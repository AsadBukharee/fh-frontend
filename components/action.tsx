"use server"

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
export async function submitPersonalInfo(
formData: FormData,
): Promise<{ success: boolean; message: string; data?: any }> {
  const rawPersonalInfo = {
    driver_name: formData.get("driver_name"),
    date_of_birth: formData.get("date_of_birth"),
    phone: formData.get("phone"),
    address1: formData.get("address1"),
    account_no: formData.get("account_no"),
    post_code: formData.get("post_code"),
    sort_code: formData.get("sort_code"),
    national_insurance_no: formData.get("national_insurance_no"),
    have_other_job: formData.get("have_other_job") === "on",
  }

  const payload = {
    user_id: 456, // Hardcoded user ID for example
    personal_info: rawPersonalInfo,
    timestamp: new Date().toISOString(),
  }

  // Simulate API call
  const apiResponse = await simulateApiCall(
    {
      driver_id: 123, // Simulated driver ID
      step_completed: "personal_info",
      next_step: "next_of_kin",
      updated_at: new Date().toISOString(),
      ...payload,
    },
    true,
  )

  return apiResponse as { success: boolean; message: string; data?: any }
}

// ==========================================
// 2. NEXT OF KIN API
// ==========================================
export async function submitNextOfKinInfo(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; data?: any }> {
  const driver_id = Number.parseInt(formData.get("driver_id") as string)

  if (!driver_id) {
    return { success: false, message: "Driver ID is missing. Please complete the previous step." }
  }

  // const rawNextOfKin = {
  //   name: formData.get("kin_name"),
  //   contact: formData.get("kin_contact"),
  //   relationship: formData.get("kin_relationship"),
  //   address: formData.get("kin_address"),
  // }

  // const payload = {
  //   driver_id: driver_id,
  //   next_of_kin: rawNextOfKin,
  //   timestamp: new Date().toISOString(),
  // }

  // Simulate API call
  const apiResponse = await simulateApiCall(
    {
      driver_id: driver_id,
      step_completed: "next_of_kin",
      next_step: "health_questions",
      updated_at: new Date().toISOString(),
    },
    true,
  )

  return apiResponse as { success: boolean; message: string; data?: any }
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
export async function submitDocuments(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; message: string; data?: any }> {
  const driver_id = Number.parseInt(formData.get("driver_id") as string) // Get driver_id from hidden input

  if (!driver_id) {
    return { success: false, message: "Driver ID is missing. Please complete the previous steps." }
  }

  const documents: any[] = []
  let uploadedCount = 0
  // let allRequiredUploaded = true

  const documentTypes = ["d_or_d1_license", "cpc", "tacho_card", "Passport_Right_To_Work", "proof_of_address"]

  documentTypes.forEach((type) => {
    const hasDocument = formData.get(`${type}_has_document`) === "on"
    const frontImage = formData.get(`${type}_front_image`) as File | null
    const backImage = formData.get(`${type}_back_image`) as File | null
    const expiryDate = formData.get(`${type}_expiry_date`) as string
    const description = formData.get(`${type}_description`) as string
    const reason = formData.get(`${type}_reason`) as string

    const doc: any = {
      document_type: type,
      has_document: hasDocument,
    }

    if (hasDocument) {
      // Simulate image URLs
      doc.front_image_url = frontImage ? `https://example.com/uploads/${type}_front.jpg` : null
      doc.back_image_url = backImage ? `https://example.com/uploads/${type}_back.jpg` : null
      doc.expiry_date = expiryDate || null
      doc.has_expiry = !!expiryDate
      doc.has_back_side = !!backImage
      doc.description = description || null
      doc.has_description = !!description
      doc.upload_timestamp = new Date().toISOString()
      uploadedCount++
    } else {
      doc.reason = reason || "Not provided"
      if (type === "d_or_d1_license" || type === "Passport_Right_To_Work") {
        // allRequiredUploaded = false // These are typically required
      }
    }
    documents.push(doc)
  })

  // const payload = {
  //   driver_id: driver_id,
  //   documents: documents,
  //   total_documents: uploadedCount,
  //   upload_completed_at: new Date().toISOString(),
  //   all_required_uploaded: allRequiredUploaded,
  // }

  // Simulate API call
  const apiResponse = await simulateApiCall(
    {
      driver_id: driver_id,
      step_completed: "documents",
      profile_status: "completed",
      documents_uploaded: uploadedCount,
      documents_pending_review: uploadedCount,
      estimated_review_time: "2-3 business days",
      next_steps: ["Wait for document verification", "Check email for updates"],
      updated_at: new Date().toISOString(),
    },
    true,
  )

  return apiResponse as { success: boolean; message: string; data?: any }
}
