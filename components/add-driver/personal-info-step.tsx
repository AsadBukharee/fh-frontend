"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useStepper } from "@/components/ui/stepper";
import { useState, useEffect } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

// Define types
interface PersonalInfo {
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

interface DriverProfileResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
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
}

interface PersonalInfoStepProps {
  setDriverId: (id: number) => void;
  setPersonalInfoData: (data: any) => void;
  user_id: number;
  driver_profile_id?: number; // Optional prop for driver profile ID
}

export function PersonalInfoStep({ setDriverId, setPersonalInfoData, user_id, driver_profile_id }: PersonalInfoStepProps) {
  const { goToNextStep } = useStepper();
  const [hasOtherJobs, setHasOtherJobs] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonalInfo>({
    date_of_birth: "",
    phone: "",
    address1: "",
    post_code: "",
    account_no: "",
    sort_code: "",
    national_insurance_no: "",
    license_number: "",
    license_issue_number: "",
    have_other_jobs: false,
    have_other_jobs_note: "",
  });
  const cookies = useCookies();

  // Retrieve driver ID from localStorage or use driver_profile_id on mount
  useEffect(() => {
    const storedDriverId = localStorage.getItem("driver_id");
    if (driver_profile_id) {
      // If driver_profile_id is provided, prioritize it
      fetchDriverProfile(driver_profile_id);
    } else if (storedDriverId) {
      // If no driver_profile_id but stored ID exists, use it
      const id = parseInt(storedDriverId, 10);
      if (!isNaN(id)) {
        setDriverId(id);
        fetchDriverProfile(id);
      } else {
        localStorage.removeItem("driver_id"); // Clear invalid ID
        setError("Invalid driver ID stored. Please submit the form again.");
      }
    }
  }, [driver_profile_id, setDriverId]);

  // Fetch driver profile data by ID
  const fetchDriverProfile = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${id}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token") || ""}`,
        },
      });

      const result: DriverProfileResponse = await response.json();

      if (response.ok && result.success) {
        const { data } = result;
        // Extract address1 and post_code from combined address
        const [address1, post_code] = data.address.split(", ");
        setFormData({
          date_of_birth: data.date_of_birth || "",
          phone: data.phone || "",
          address1: address1 || "",
          post_code: post_code?.replace(", UK", "") || "",
          account_no: data.account_no || "",
          sort_code: data.sort_code || "",
          national_insurance_no: data.national_insurance_no || "",
          license_number: data.license_number || "",
          license_issue_number: data.license_issue_number || "",
          have_other_jobs: data.have_other_jobs || false,
          have_other_jobs_note: data.have_other_jobs_note || "",
        });
        setHasOtherJobs(data.have_other_jobs || false);
        setDriverId(data.id);
        localStorage.setItem("driver_id", data.id.toString()); // Ensure localStorage is updated
      } else {
        setError(result.message || "Failed to fetch driver profile");
        localStorage.removeItem("driver_id"); // Clear stale ID
      }
    } catch (error: unknown) {
      setError(`Error fetching driver profile: ${(error as Error).message}`);
      localStorage.removeItem("driver_id"); // Clear on error
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const formDataFromEvent = new FormData(event.currentTarget);

    // Extract form data
    const rawPersonalInfo: PersonalInfo = {
      date_of_birth: formDataFromEvent.get("date_of_birth") as string,
      phone: formDataFromEvent.get("phone") as string,
      address1: formDataFromEvent.get("address1") as string,
      post_code: formDataFromEvent.get("post_code") as string,
      account_no: formDataFromEvent.get("account_no") as string,
      sort_code: formDataFromEvent.get("sort_code") as string,
      national_insurance_no: formDataFromEvent.get("national_insurance_no") as string,
      license_number: formDataFromEvent.get("license_number") as string,
      license_issue_number: formDataFromEvent.get("license_issue_number") as string,
      have_other_jobs: formDataFromEvent.get("have_other_jobs") === "true",
      have_other_jobs_note: formDataFromEvent.get("have_other_jobs_note") as string,
    };

    // Validate required fields
    const requiredFields: (keyof PersonalInfo)[] = [
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
        setError(`Missing required field: ${field.replace(/_/g, " ")}`);
        setIsPending(false);
        return;
      }
    }

    // Combine address1 and post_code
    const address = `${rawPersonalInfo.address1}, ${rawPersonalInfo.post_code}, UK`;

    // Construct API payload
    const payload: ApiPayload = {
      user_id,
      personal_info: {
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
        have_other_jobs_note: rawPersonalInfo.have_other_jobs
          ? rawPersonalInfo.have_other_jobs_note || ""
          : "",
      },
      timestamp: new Date().toISOString(),
    };

    try {
      // Submit to API
      const response = await fetch(`${API_URL}/api/profiles/driver/`, {
        method: driver_profile_id ? "PUT" : "POST", // Use PUT if updating existing profile
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const result: { driver_id?: number; message?: string; data: { id: number } } = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to submit personal information");
        setIsPending(false);
        return;
      }

      const driverId = result.data.id || 123; // Fallback ID
      setDriverId(driverId);
      localStorage.setItem("driver_id", driverId.toString()); // Store driver ID in localStorage
      setPersonalInfoData(Object.fromEntries(formDataFromEvent.entries()));
      goToNextStep();
    } catch (error: unknown) {
      setError(`Error submitting personal information: ${(error as Error).message}`);
      localStorage.removeItem("driver_id"); // Clear on error
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Personal Information</CardTitle>
        <CardDescription>Provide your personal details.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="min-h-[200px]">
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1234567890"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="address1">Address Line 1</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="address1"
                    name="address1"
                    placeholder="123 Main St"
                    required
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="post_code">Post Code</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="post_code"
                    name="post_code"
                    placeholder="12345"
                    required
                    value={formData.post_code}
                    onChange={(e) => setFormData({ ...formData, post_code: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="national_insurance_no">National Insurance No.</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="national_insurance_no"
                    name="national_insurance_no"
                    placeholder="AB123456C"
                    required
                    value={formData.national_insurance_no}
                    onChange={(e) => setFormData({ ...formData, national_insurance_no: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="account_no">Account Number</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="account_no"
                    name="account_no"
                    placeholder="12345678"
                    required
                    value={formData.account_no}
                    onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sort_code">Sort Code</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="sort_code"
                    name="sort_code"
                    placeholder="12-34-56"
                    required
                    value={formData.sort_code}
                    onChange={(e) => setFormData({ ...formData, sort_code: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="license_number">License Number</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="license_number"
                    name="license_number"
                    placeholder="BOL12345678"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="license_issue_number">License Issue Number</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Input
                    id="license_issue_number"
                    name="license_issue_number"
                    placeholder="987654321"
                    required
                    value={formData.license_issue_number}
                    onChange={(e) => setFormData({ ...formData, license_issue_number: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Do you have another job?</Label>
              <RadioGroup
                name="have_other_jobs"
                onValueChange={(value) => {
                  setHasOtherJobs(value === "true");
                  setFormData({ ...formData, have_other_jobs: value === "true" });
                }}
                value={formData.have_other_jobs ? "true" : "false"}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="have_other_jobs_yes" />
                  <Label htmlFor="have_other_jobs_yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="have_other_jobs_no" />
                  <Label htmlFor="have_other_jobs_no">No</Label>
                </div>
              </RadioGroup>
            </div>
            {hasOtherJobs && (
              <div className="space-y-1">
                <Label htmlFor="have_other_jobs_note">Other Jobs Note</Label>
                <div
                  className="relative w-full gradient-border cursor-glow"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
                  }}
                >
                  <Textarea
                    id="have_other_jobs_note"
                    name="have_other_jobs_note"
                    placeholder="Provide details about your other job(s)"
                    value={formData.have_other_jobs_note}
                    onChange={(e) => setFormData({ ...formData, have_other_jobs_note: e.target.value })}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-500" aria-live="polite">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" className="bg-magenta text-white" disabled={isPending}>
            {isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}