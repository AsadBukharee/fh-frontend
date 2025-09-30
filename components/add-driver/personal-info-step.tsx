"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useStepper } from "./DriverStepper";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

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

interface PersonalInfoStepProps {
  setDriverId: (id: number) => void;
  setPersonalInfoData: (data: any) => void;
  user_id: number;
  driver_profile_id?: number;
}

export function PersonalInfoStep({ setDriverId, setPersonalInfoData, user_id, driver_profile_id }: PersonalInfoStepProps) {
  const { goToNextStep } = useStepper();
  const [hasOtherJobs, setHasOtherJobs] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfo, string>> & { general?: string }>({});
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

  const calculateAge = (dob: string): string => {
    if (!dob) return "Select a date";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "Invalid date";
    const today = new Date();
    if (birthDate > today) return "Date of birth cannot be in the future";

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    return parts.length > 0 ? parts.join(", ") : "Less than a day old";
  };

  const validateDateOfBirth = (dob: string): string => {
    if (!dob) return "Date of birth is required";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "Invalid date format";
    if (birthDate > new Date()) return "Date of birth cannot be in the future";
    return "";
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 11 ? "" : "Phone number must be exactly 11 digits (e.g., 01234567890)";
  };

  const validateAccountNo = (accountNo: string) => {
    const cleaned = accountNo.replace(/\D/g, "");
    return cleaned.length === 8 ? "" : "Account number must be exactly 8 digits (e.g., 12345678)";
  };

  const validateSortCode = (sortCode: string) => {
    const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/;
    return sortCodeRegex.test(sortCode) ? "" : "Sort code must be in the format XX-XX-XX (e.g., 12-34-56)";
  };

  const validateLicenseIssueNumber = (licenseIssueNo: string) => {
    const cleaned = licenseIssueNo.replace(/\D/g, "");
    return cleaned.length === 9 ? "" : "License issue number must be exactly 9 digits (e.g., 123456789)";
  };

  const validateField = (name: keyof PersonalInfo, value: string) => {
    switch (name) {
      case "date_of_birth":
        return validateDateOfBirth(value);
      case "phone":
        return validatePhone(value);
      case "account_no":
        return validateAccountNo(value);
      case "sort_code":
        return validateSortCode(value);
      case "license_issue_number":
        return validateLicenseIssueNumber(value);
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "phone" || name === "account_no" || name === "license_issue_number") {
      formattedValue = value.replace(/\D/g, "").slice(0, name === "phone" ? 11 : name === "account_no" ? 8 : 9);
    } else if (name === "sort_code") {
      let cleaned = value.replace(/[^\d-]/g, "");
      if (cleaned.length > 2 && cleaned[2] !== "-") cleaned = cleaned.slice(0, 2) + "-" + cleaned.slice(2);
      if (cleaned.length > 5 && cleaned[5] !== "-") cleaned = cleaned.slice(0, 5) + "-" + cleaned.slice(5);
      formattedValue = cleaned.slice(0, 8);
    }

    setFormData({ ...formData, [name]: formattedValue });
    setErrors({ ...errors, [name]: validateField(name as keyof PersonalInfo, formattedValue) });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setErrors({});

    const formDataFromEvent = new FormData(event.currentTarget);
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

    const newErrors: Partial<Record<keyof PersonalInfo, string>> = {};
    for (const field of requiredFields) {
      if (!rawPersonalInfo[field]) {
        newErrors[field] = `${field.replace(/_/g, " ")} is required`;
      }
    }

    newErrors.date_of_birth = newErrors.date_of_birth || validateDateOfBirth(rawPersonalInfo.date_of_birth);
    newErrors.phone = newErrors.phone || validatePhone(rawPersonalInfo.phone);
    newErrors.account_no = newErrors.account_no || validateAccountNo(rawPersonalInfo.account_no);
    newErrors.sort_code = newErrors.sort_code || validateSortCode(rawPersonalInfo.sort_code);
    newErrors.license_issue_number = newErrors.license_issue_number || validateLicenseIssueNumber(rawPersonalInfo.license_issue_number);

    if (Object.values(newErrors).some((error) => error)) {
      setErrors(newErrors);
      setIsPending(false);
      return;
    }

    const address = `${rawPersonalInfo.address1}, ${rawPersonalInfo.post_code}, UK`;

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
        have_other_jobs_note: rawPersonalInfo.have_other_jobs ? rawPersonalInfo.have_other_jobs_note || "" : "",
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/`, {
        method: driver_profile_id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token") || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const result: { driver_id?: number; message?: string; data: { id: number } } = await response.json();

      if (!response.ok) {
        setErrors({ general: result.message || "Failed to submit personal information" });
        setIsPending(false);
        return;
      }

      const driverId = result.data.id || 123;
      setDriverId(driverId);
      localStorage.setItem("driver_id", driverId.toString());
      setPersonalInfoData(rawPersonalInfo); // Changed to rawPersonalInfo for consistency
      goToNextStep();
    } catch (error: unknown) {
      setErrors({ general: `Error submitting personal information: ${(error as Error).message}` });
      localStorage.removeItem("driver_id");
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="driver_age">Driver Age</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <div className="p-2">{calculateAge(formData.date_of_birth)}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="01234567890"
                    required
                    maxLength={11}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="address1">Address Line 1</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="address1"
                    name="address1"
                    placeholder="123 Main St"
                    required
                    value={formData.address1}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.address1 && <p className="text-sm text-red-500">{errors.address1}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="post_code">Post Code</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="post_code"
                    name="post_code"
                    placeholder="12345"
                    required
                    value={formData.post_code}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.post_code && <p className="text-sm text-red-500">{errors.post_code}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="national_insurance_no">National Insurance No.</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="national_insurance_no"
                    name="national_insurance_no"
                    placeholder="AB123456C"
                    required
                    value={formData.national_insurance_no}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.national_insurance_no && <p className="text-sm text-red-500">{errors.national_insurance_no}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="account_no">Account Number</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="account_no"
                    name="account_no"
                    placeholder="12345678"
                    required
                    maxLength={8}
                    value={formData.account_no}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.account_no && <p className="text-sm text-red-500">{errors.account_no}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="sort_code">Sort Code</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="sort_code"
                    name="sort_code"
                    placeholder="12-34-56"
                    required
                    maxLength={8}
                    value={formData.sort_code}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.sort_code && <p className="text-sm text-red-500">{errors.sort_code}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="license_number">License Number</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="license_number"
                    name="license_number"
                    placeholder="BOL12345678"
                    required
                    value={formData.license_number}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.license_number && <p className="text-sm text-red-500">{errors.license_number}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="license_issue_number">License Issue Number</Label>
                <div className="relative w-full gradient-border cursor-glow">
                  <Input
                    id="license_issue_number"
                    name="license_issue_number"
                    placeholder="123456789"
                    required
                    maxLength={9}
                    value={formData.license_issue_number}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.license_issue_number && <p className="text-sm text-red-500">{errors.license_issue_number}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Do you have another job?</Label>
              <RadioGroup
                name="have_other_jobs"
                onValueChange={(value) => {
                  const hasJobs = value === "true";
                  setHasOtherJobs(hasJobs);
                  setFormData({ ...formData, have_other_jobs: hasJobs, have_other_jobs_note: hasJobs ? formData.have_other_jobs_note : "" });
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
                <div className="relative w-full gradient-border cursor-glow">
                  <Textarea
                    id="have_other_jobs_note"
                    name="have_other_jobs_note"
                    placeholder="Provide details about your other job(s)"
                    value={formData.have_other_jobs_note}
                    onChange={handleInputChange}
                    className="pl-3 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}
          </div>
          {errors.general && (
            <p className="text-sm text-red-500 mt-4" aria-live="polite">
              {errors.general}
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