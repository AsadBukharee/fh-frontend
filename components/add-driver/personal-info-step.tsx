"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Phone, MapPin, Hash, CreditCard, FileText, Car, Briefcase } from "lucide-react";
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
    return cleaned.length === 11 ? "" : "Phone number must be exactly 11 digits";
  };

  const validateAccountNo = (accountNo: string) => {
    const cleaned = accountNo.replace(/\D/g, "");
    return cleaned.length === 8 ? "" : "Account number must be exactly 8 digits";
  };

  const validateSortCode = (sortCode: string) => {
    const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/;
    return sortCodeRegex.test(sortCode) ? "" : "Sort code must be in the format XX-XX-XX";
  };

  const validateLicenseNumber = (licenseNumber: string) => {
    // Remove any spaces or special characters for validation
    const cleaned = licenseNumber.replace(/\s+/g, '');
    return cleaned.length === 16 ? "" : "License number must be exactly 16 characters";
  };

  const validateLicenseIssueNumber = (licenseIssueNo: string) => {
    const cleaned = licenseIssueNo.replace(/\D/g, "");
    return cleaned.length === 2 ? "" : "License issue number must be exactly 2 digits";
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
      case "license_number":
        return validateLicenseNumber(value);
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
      formattedValue = value.replace(/\D/g, "").slice(0, name === "phone" ? 11 : name === "account_no" ? 8 : 2);
    } else if (name === "sort_code") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      
      // Limit to 6 digits max
      const limited = digitsOnly.slice(0, 6);
      
      // Auto-format as XX-XX-XX
      if (limited.length === 0) {
        formattedValue = "";
      } else if (limited.length <= 2) {
        formattedValue = limited;
      } else if (limited.length <= 4) {
        formattedValue = `${limited.slice(0, 2)}-${limited.slice(2)}`;
      } else {
        formattedValue = `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4)}`;
      }
    } else if (name === "license_number") {
      // Allow only alphanumeric characters for license number
      formattedValue = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
    } else if (name === "national_insurance_no") {
      // Format National Insurance Number (typically 2 letters, 6 digits, 1 letter)
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
    }

    setFormData({ ...formData, [name]: formattedValue });
    setErrors({ ...errors, [name]: validateField(name as keyof PersonalInfo, formattedValue) });
  };

  const handleSubmit = async () => {
    setIsPending(true);
    setErrors({});

    const rawPersonalInfo: PersonalInfo = { ...formData };

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
    newErrors.license_number = newErrors.license_number || validateLicenseNumber(rawPersonalInfo.license_number);
    newErrors.license_issue_number = newErrors.license_issue_number || validateLicenseIssueNumber(rawPersonalInfo.license_issue_number);

    if (Object.values(newErrors).some((error) => error)) {
      setErrors(newErrors);
      setIsPending(false);
      return;
    }

    const address = `${rawPersonalInfo.address1}, ${rawPersonalInfo.post_code}, UK`;

    const payload: ApiPayload = {
      user_id,
     
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
      setPersonalInfoData(rawPersonalInfo);
      goToNextStep();
    } catch (error: unknown) {
      setErrors({ general: `Error submitting personal information: ${(error as Error).message}` });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="border-none ">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl">
          <span className="text-orange-500">Step 1 : </span>
          <span className="text-gray-900">Personal Information</span>
        </CardTitle>
        <CardDescription className="text-gray-500">Provide your personal details.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[200px]">
        <div className="space-y-1">
          {/* Date of Birth and Driver Age */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">
                Date of Birth
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                  placeholder="mm/dd/yyyy"
                />
              </div>
              {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="driver_age" className="text-sm font-medium text-gray-700">
                Driver Age
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <div className="h-12 pl-10 pr-3 border border-gray-200 rounded-md flex items-center bg-gray-50 text-gray-500">
                  {calculateAge(formData.date_of_birth)}
                </div>
              </div>
            </div>
          </div>

          {/* Phone Number and Address */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  maxLength={11}
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address1" className="text-sm font-medium text-gray-700">
                Address Line 1
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address1"
                  name="address1"
                  placeholder="Address Line 1"
                  value={formData.address1}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.address1 && <p className="text-sm text-red-500">{errors.address1}</p>}
            </div>
          </div>

          {/* Post Code and National Insurance */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="post_code" className="text-sm font-medium text-gray-700">
                Post Code
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="post_code"
                  name="post_code"
                  placeholder="Post Code"
                  value={formData.post_code}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.post_code && <p className="text-sm text-red-500">{errors.post_code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="national_insurance_no" className="text-sm font-medium text-gray-700">
               NI Number
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="national_insurance_no"
                  name="national_insurance_no"
                  placeholder="National Insurance No."
                  value={formData.national_insurance_no}
                  maxLength={9}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.national_insurance_no && <p className="text-sm text-red-500">{errors.national_insurance_no}</p>}
            </div>
          </div>

          {/* Account Number and Sort Code */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account_no" className="text-sm font-medium text-gray-700">
                Account No
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="account_no"
                  name="account_no"
                  placeholder="Account No"
                  maxLength={8}
                  value={formData.account_no}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.account_no && <p className="text-sm text-red-500">{errors.account_no}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_code" className="text-sm font-medium text-gray-700">
                Sort Code
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-90" />
                <Input
                  id="sort_code"
                  name="sort_code"
                  placeholder="Sort Code"
                  maxLength={8}
                  value={formData.sort_code}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.sort_code && <p className="text-sm text-red-500">{errors.sort_code}</p>}
            </div>
          </div>

          {/* License Number and Issue Number */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="license_number" className="text-sm font-medium text-gray-700">
                License No
              </Label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="license_number"
                  name="license_number"
                  placeholder="License No"
                  value={formData.license_number}
                  maxLength={16}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.license_number && <p className="text-sm text-red-500">{errors.license_number}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_issue_number" className="text-sm font-medium text-gray-700">
                License Issue Number
              </Label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 z-1 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="license_issue_number"
                  name="license_issue_number"
                  placeholder="License Issue Number"
                  maxLength={2}
                  value={formData.license_issue_number}
                  onChange={handleInputChange}
                  className="pl-10 h-12 border-gray-200 focus-visible:ring-orange-500"
                />
              </div>
              {errors.license_issue_number && <p className="text-sm text-red-500">{errors.license_issue_number}</p>}
            </div>
          </div>

          {/* Other Jobs Radio */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Do you have any other job</Label>
            <RadioGroup
              name="have_other_jobs"
              onValueChange={(value) => {
                const hasJobs = value === "true";
                setHasOtherJobs(hasJobs);
                setFormData({ ...formData, have_other_jobs: hasJobs, have_other_jobs_note: hasJobs ? formData.have_other_jobs_note : "" });
              }}
              value={formData.have_other_jobs ? "true" : "false"}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="have_other_jobs_yes" className="border-orange-500 text-orange-500" />
                <Label htmlFor="have_other_jobs_yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="have_other_jobs_no" className="border-orange-500 text-orange-500" />
                <Label htmlFor="have_other_jobs_no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Other Jobs Note */}
          {hasOtherJobs && (
            <div className="space-y-2">
              <Label htmlFor="have_other_jobs_note" className="text-sm font-medium text-gray-700">
                Other Jobs Note
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 z-10 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="have_other_jobs_note"
                  name="have_other_jobs_note"
                  placeholder="Provide details about your other job(s)"
                  value={formData.have_other_jobs_note}
                  onChange={handleInputChange}
                  className="pl-10 min-h-[100px] border-gray-200 focus-visible:ring-orange-500"
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
      <CardFooter className="flex justify-end pt-6">
        <Button 
          onClick={handleSubmit} 
          className="text-[#F97316] bg-[#F97316]/20 w-full hover:bg-[#EA580C]/30 font-medium px-8 py-5" 
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save & continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}