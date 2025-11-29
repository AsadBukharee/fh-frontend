"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStepper } from "./DriverStepper";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import { ChevronLeft, ChevronRight, Link2, Mail, MapPin, Phone, User } from "lucide-react";

interface NextOfKinData {
  kin_name: string;
  kin_contact: string;
  kin_relationship: string;
  kin_address: string;
  kin_email: string;
}

interface NextOfKinStepProps {
  driverId: number | null;
  setNextOfKinData: (data: NextOfKinData) => void;
  user_id: number;
  initialNextOfKinData?: NextOfKinData;
}

export function NextOfKinStep({
  user_id,
  driverId,
  setNextOfKinData,
  initialNextOfKinData,
}: NextOfKinStepProps) {
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();
  const cookies = useCookies();

  const [formData, setFormData] = useState<NextOfKinData>(
    () => {
      const savedData = localStorage.getItem(`nextOfKin_${driverId}`);
      return savedData
        ? JSON.parse(savedData)
        : initialNextOfKinData || {
            kin_name: "",
            kin_contact: "",
            kin_relationship: "",
            kin_address: "",
            kin_email: "",
          };
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof NextOfKinData, string>> & { general?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (driverId) {
      localStorage.setItem(`nextOfKin_${driverId}`, JSON.stringify(formData));
    }
  }, [formData, driverId]);

  const validateField = (name: keyof NextOfKinData, value: string) => {
    switch (name) {
      case "kin_name":
        return value.trim() ? "" : "Name is required";
      case "kin_contact":
        return /^\+?\d{10,15}$/.test(value.replace(/\D/g, "")) ? "" : "Invalid phone number (e.g., +447700112233)";
      case "kin_relationship":
        return value.trim() ? "" : "Relationship is required";
      case "kin_address":
        return value.trim() ? "" : "Address is required";
      case "kin_email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email address";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof NextOfKinData, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (driverId === null) {
      setErrors({ general: "Please complete the 'Personal Info' step first." });
      setLoading(false);
      return;
    }

    const token = cookies.get("access_token");
    if (!token) {
      setErrors({ general: "Authentication token is missing. Please log in again." });
      setLoading(false);
      return;
    }

    const newErrors: Partial<Record<keyof NextOfKinData, string>> = {};
    (Object.keys(formData) as (keyof NextOfKinData)[]).forEach((field) => {
      newErrors[field] = validateField(field, formData[field]);
    });

    if (Object.values(newErrors).some((error) => error)) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const payload = {
      next_of_kin_name: formData.kin_name,
      next_of_kin_contact: formData.kin_contact,
      next_of_kin_relationship: formData.kin_relationship,
      next_of_kin_address: formData.kin_address,
      next_of_kin_email: formData.kin_email,
      user_id,
      driver_id: driverId,
    };

    try {
      const res = await fetch(`${API_URL}/api/profiles/driver/${driverId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData?.detail || "Submission failed.");
      }

      setNextOfKinData(formData);
      localStorage.removeItem(`nextOfKin_${driverId}`);
      goToNextStep();
    } catch (err: any) {
      setErrors({ general: err.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-xl">
          <span className="text-orange-500">Step 2</span> : Next of Kin
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          Provide details for your next of kin.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 min-h-[200px] px-0">
          {driverId === null ? (
            <div className="text-center text-red-500 font-medium py-8" aria-live="polite">
              Please complete the &quot;Personal Info&quot; step first to enable this section.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kin_name" className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 z-1 -translate-y-1/2 text-gray-400">
                      <User size={20} />
                    </div>
                    <Input
                      id="kin_name"
                      name="kin_name"
                      placeholder="Enter name"
                      value={formData.kin_name}
                      onChange={handleInputChange}
                      className="pl-10 "
                      required
                    />
                  </div>
                  {errors.kin_name && <p className="text-sm text-red-500">{errors.kin_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kin_contact" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 z-1 -translate-y-1/2 text-gray-400">
                      <Phone size={20} />
                    </div>
                    <Input
                      id="kin_contact"
                      name="kin_contact"
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.kin_contact}
                      onChange={handleInputChange}
                      className="pl-10 "
                      required
                    />
                  </div>
                  {errors.kin_contact && <p className="text-sm text-red-500">{errors.kin_contact}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kin_relationship" className="text-sm font-medium text-gray-700">
                    Relation
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 z-1 -translate-y-1/2 text-gray-400">
                      <Link2 size={20} />
                    </div>
                    <Input
                      id="kin_relationship"
                      name="kin_relationship"
                      placeholder="Enter your relation"
                      value={formData.kin_relationship}
                      onChange={handleInputChange}
                      className="pl-10 "
                      required
                    />
                  </div>
                  {errors.kin_relationship && <p className="text-sm text-red-500">{errors.kin_relationship}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kin_email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 z-1 -translate-y-1/2 text-gray-400">
                      <Mail size={20} />
                    </div>
                    <Input
                      id="kin_email"
                      name="kin_email"
                      type="email"
                      placeholder="Email Address "
                      value={formData.kin_email}
                      onChange={handleInputChange}
                      className="pl-10 "
                      required
                    />
                  </div>
                  {errors.kin_email && <p className="text-sm text-red-500">{errors.kin_email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kin_address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 z-1 -translate-y-1/2 text-gray-400">
                  <MapPin size={20} />
                  </div>
                  <Input
                    id="kin_address"
                    name="kin_address"
                    placeholder="Address"
                    value={formData.kin_address}
                    onChange={handleInputChange}
                    className="pl-10 "
                    required
                  />
                </div>
                {errors.kin_address && <p className="text-sm text-red-500">{errors.kin_address}</p>}
              </div>
            </div>
          )}
          {errors.general && (
            <p className="text-sm text-red-500" aria-live="polite">
              {errors.general}
            </p>
          )}
        </CardContent>
         <CardFooter className="flex justify-between">
         
          
           <div className="grid grid-cols-3 gap-3 w-full">
                     <Button
                       type="button"
                       variant="outline"
                       className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
                       onClick={goToPreviousStep}
                       disabled={disableBack || loading}
                     >
                      <ChevronLeft />
                       Previous
                     </Button>
                   <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 rounded-lg"
            disabled={loading || driverId === null}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
                     <Button
                       type="button"
                       variant="outline"
                       className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
                       onClick={handleSubmit}
                       disabled={loading}
                     >
                       Next & Save
                      <ChevronRight />
                     </Button>
                   </div>
        </CardFooter>
      </form>
    </Card>
  );
  }