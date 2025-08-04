"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useStepper } from "@/components/ui/stepper";
import { useState } from "react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

// Define types
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





interface PersonalInfoStepProps {
  setDriverId: (id: number) => void;
  setPersonalInfoData: (data: any) => void;
  user_id: number;
}

export function PersonalInfoStep({ setDriverId, setPersonalInfoData, user_id }: PersonalInfoStepProps) {
  const { goToNextStep } = useStepper();
  const [hasOtherJobs, setHasOtherJobs] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cookies=useCookies();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

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
        setError(`Missing required field: ${field.replace(/_/g, " ")}`);
        setIsPending(false);
        return;
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

    try {
      // Make API call
      const response = await fetch(`${API_URL}/api/profiles/driver/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const result: { driver_id?: number; message?: string ,data:{id:number}} = await response.json();

      if (!response.ok) {
        setError(result.message || "Failed to submit personal information");
        setIsPending(false);
        return;
      }

      setDriverId(result.data.id || 123); // Fallback to simulated driver_id
      setPersonalInfoData(Object.fromEntries(formData.entries()));
      goToNextStep();
    } catch (error: unknown) {
      setError(`Error submitting personal information: ${(error as Error).message}`);
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
                <Label htmlFor="driver_name">Driver Name</Label>
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
                    id="driver_name"
                    name="driver_name"
                    placeholder="John Doe"
                    required
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
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
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="have_other_jobs"
                name="have_other_jobs"
                onCheckedChange={(checked) => setHasOtherJobs(!!checked)}
              />
              <Label htmlFor="have_other_jobs">Do you have another job?</Label>
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