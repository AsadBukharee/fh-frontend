"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Save,
  MapPin,
  User,
  Building2,
  Car,
  Loader2,
  Clock,
  Users,
  Phone,
  Mail,
  FileText,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/app/Context/ToastContext";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "../Media/UploadImage";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

// === STEPPER INTERFACES ===
interface StepperProps {
  totalSteps: number;
  initialStep?: number;
  children: React.ReactNode;
}

interface StepperTabsProps {
  labels: string[];
}

interface StepperContentProps {
  children: React.ReactNode;
}

interface StepperNavigationProps {
  className?: string;
}

// === STEPPER CONTEXT ===
const StepperContext = React.createContext<{
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}>({
  currentStep: 0,
  setCurrentStep: () => {},
  totalSteps: 0,
});

// === STEPPER COMPONENT ===
const Stepper: React.FC<StepperProps> = ({ totalSteps, initialStep = 0, children }) => {
  const [currentStep, setCurrentStep] = React.useState(initialStep);

  React.useEffect(() => {
    console.log("Current Step:", currentStep);
  }, [currentStep]);

  return (
    <StepperContext.Provider value={{ currentStep, setCurrentStep, totalSteps }}>
      <div className="space-y-6">{children}</div>
    </StepperContext.Provider>
  );
};

// === STEPPER TABS ===
const StepperTabs: React.FC<StepperTabsProps> = ({ labels }) => {
  const { currentStep, setCurrentStep, totalSteps } = React.useContext(StepperContext);

  return (
    <div className="flex items-center justify-between border-b border-border">
      {labels.map((label, index) => (
        <div
          key={index}
          className={cn(
            "flex-1 text-center py-3 cursor-pointer transition-all",
            currentStep === index
              ? "border-b-2 border-orange text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
            index >= totalSteps && "pointer-events-none opacity-50"
          )}
          onClick={() => setCurrentStep(index)}
        >
          <div className="flex items-center flex-col justify-center gap-2">
            <span
              className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                currentStep === index
                  ? "bg-orange text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
            <span className="text-sm">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// === STEPPER CONTENT ===
const StepperContent: React.FC<StepperContentProps> = ({ children }) => {
  const { currentStep } = React.useContext(StepperContext);
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="relative min-h-[400px]">
      {childrenArray.map((child, index) => (
        <div
          key={`step-${index}`}
          className={cn(
            "w-full transition-opacity duration-300",
            currentStep === index
              ? "relative opacity-100 visible z-10"
              : "absolute opacity-0 invisible z-0 pointer-events-none inset-0"
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// === REDUX FORM STATE ===
interface FormState {
  name: string;
  image: string;
  notes: string;
  postcode: string;
  address: string;
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  contact_email: string;
  radius_m: number;
  latitude: string;
  longitude: string;
  number_of_allocated_vehicles: number;
  number_of_allocated_staff: number;
  operational_days: string[];
  is_24_hour: boolean;
  operational_notes: string;
}

const initialState: FormState = {
  name: "",
  image: "",
  notes: "",
  postcode: "",
  address: "",
  contact_name: "",
  contact_position: "",
  contact_phone: "",
  contact_email: "",
  radius_m: 200,
  latitude: "",
  longitude: "",
  number_of_allocated_vehicles: 0,
  number_of_allocated_staff: 0,
  operational_days: [],
  is_24_hour: false,
  operational_notes: "",
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    updateField: (state, action: PayloadAction<Partial<FormState>>) => {
      return { ...state, ...action.payload };
    },
    toggleDay: (state, action: PayloadAction<string>) => {
      const day = action.payload;
      const days = state.operational_days.includes(day)
        ? state.operational_days.filter((d) => d !== day)
        : [...state.operational_days, day];
      state.operational_days = days;
    },
    toggle24Hour: (state) => {
      state.is_24_hour = !state.is_24_hour;
      if (state.is_24_hour) {
        state.operational_days = [];
      }
    },
    resetForm: () => initialState,
  },
});

export const { updateField, toggleDay, toggle24Hour, resetForm } = formSlice.actions;

const store = configureStore({
  reducer: {
    form: formSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// === VALIDATION HELPER ===
const validateStep = (step: number, form: FormState, showToast: any): boolean => {
  const REGEX = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[0-9]{7,15}$/,
    postcode: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  };

  // Step 0: Site Location
  if (step === 0) {
    if (!form.name.trim()) {
      showToast("Site name is required.", "error");
      return false;
    }
    if (form.postcode && !REGEX.postcode.test(form.postcode)) {
      showToast("Please enter a valid UK postcode format.", "error");
      return false;
    }
    if (form.radius_m && form.radius_m < 1) {
      showToast("Radius must be at least 1 meter.", "error");
      return false;
    }
  }

  // Step 1: Site Admin
  if (step === 1) {
    if (form.contact_email && !REGEX.email.test(form.contact_email)) {
      showToast("Please enter a valid email address.", "error");
      return false;
    }
    if (form.contact_phone && !REGEX.phone.test(form.contact_phone)) {
      showToast("Please enter a valid phone number (7-15 digits).", "error");
      return false;
    }
  }

  // Step 2: Operations
  if (step === 2) {
    if (!form.is_24_hour && form.operational_days.length === 0) {
      showToast("Please select at least one operational day or enable 24-hour operation.", "error");
      return false;
    }
    if (form.number_of_allocated_vehicles < 0) {
      showToast("Number of vehicles cannot be negative.", "error");
      return false;
    }
    if (form.number_of_allocated_staff < 0) {
      showToast("Number of staff cannot be negative.", "error");
      return false;
    }
  }

  return true;
};

// === STEPPER NAVIGATION ===
const StepperNavigation: React.FC<StepperNavigationProps> = ({ className }) => {
  const { currentStep, setCurrentStep, totalSteps } = React.useContext(StepperContext);
  const { showToast } = useToast();
  const form = useSelector((state: RootState) => state.form);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateStep(currentStep, form, showToast)) {
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  return (
    <>
      <div className={cn("flex justify-between mt-6", className)}>
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          type="button"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </Button>

        {currentStep === totalSteps - 1 ? (
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={!form.name.trim()}
            className="flex items-center bg-orange gap-2"
          >
            <Save className="w-5 h-5" />
            Add Site
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            className="flex items-center bg-orange gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange" />
              Confirm Site Creation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to add this site?</p>
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p><strong>Site Name:</strong> {form.name}</p>
                {form.postcode && <p><strong>Postcode:</strong> {form.postcode}</p>}
                {form.contact_name && <p><strong>Contact:</strong> {form.contact_name}</p>}
                <p><strong>Operation:</strong> {form.is_24_hour ? "24/7" : `${form.operational_days.length} days`}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form="site-form"
              className="bg-orange hover:bg-orange/90"
            >
              Confirm & Add Site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// === DEBUG COMPONENT ===
const DebugComponent = () => {
  const form = useSelector((state: RootState) => state.form);
  const { currentStep } = React.useContext(StepperContext);
  const prevStep = React.useRef(currentStep);
  const prevForm = React.useRef(form);

  React.useEffect(() => {
    if (prevStep.current !== currentStep) {
      console.log("Step changed:", { from: prevStep.current, to: currentStep });
      console.log("Form state:", form);
      prevStep.current = currentStep;
    }

    const isReset = Object.keys(initialState).every(
      (key) => form[key as keyof FormState] === initialState[key as keyof FormState]
    );

    const wasReset = !Object.keys(initialState).every(
      (key) => prevForm.current[key as keyof FormState] === initialState[key as keyof FormState]
    );

    if (isReset && wasReset) {
      console.log("FORM WAS RESET!");
    }

    prevForm.current = form;
  }, [currentStep, form]);

  return null;
};

// === MAIN FORM COMPONENT ===
function AddSiteForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const dispatch = useDispatch<AppDispatch>();
  const form = useSelector((state: RootState) => state.form);
  const [isFetchingPostcode, setIsFetchingPostcode] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // === POSTCODE FETCH ===
  const fetchAddressDetails = async (postcode: string) => {
    if (!postcode.trim()) {
      showToast("Please enter a valid postcode.", "error");
      return;
    }

    setIsFetchingPostcode(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(postcode)}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            "User-Agent": "YourAppName/1.0 (your.email@example.com)",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      if (data.length === 0) {
        showToast("No results found for this postcode.", "error");
        return;
      }

      const result = data[0];
      const { lat, lon, address } = result;

      const formattedAddress = [
        address.road || "",
        address.city || address.town || address.village || "",
        address.state || "",
        address.country || "",
      ]
        .filter(Boolean)
        .join(", ");

      dispatch(
        updateField({
          address: formattedAddress,
          latitude: lat,
          longitude: lon,
          radius_m: 200,
        })
      );

      showToast("Address fetched successfully!", "success");
    } catch (error) {
      showToast("Failed to fetch address. Try again.", "error");
      console.error(error);
    } finally {
      setIsFetchingPostcode(false);
    }
  };

  const debouncedFetchAddress = React.useCallback(
    debounce((postcode: string) => fetchAddressDetails(postcode), 500),
    []
  );

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    dispatch(updateField({ postcode: value }));

    const postcodeRegex = /^[A-Z0-9]{2,4}\s?[A-Z0-9]{2,4}$/i;
    if (postcodeRegex.test(value)) {
      debouncedFetchAddress(value);
    }
  };

  // === INPUT HANDLERS ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch(updateField({ [name]: value }));
  };

  const handleImageUpload = (url: string) => {
    dispatch(updateField({ image: url }));
    showToast("Image uploaded!", "success");
  };

  const handleDayToggle = (day: string) => {
    dispatch(toggleDay(day));
  };

  const handle24HourToggle = () => {
    dispatch(toggle24Hour());
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleClose = () => {
    setSubmitSuccess(false);
    setSubmitError(null);
    dispatch(resetForm());
  };

  // === FORM SUBMIT ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("SUBMITTING FORM...");

    // Validate all steps before submission
    for (let step = 0; step < 3; step++) {
      if (!validateStep(step, form, showToast)) {
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      name: form.name,
      postcode: form.postcode,
      address: form.address,
      latitude: form.latitude ? Number.parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? Number.parseFloat(form.longitude) : undefined,
      radius_m: Number(form.radius_m),
      contact_name: form.contact_name,
      contact_position: form.contact_position,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      number_of_allocated_vehicles: Number(form.number_of_allocated_vehicles),
      number_of_allocated_staff: Number(form.number_of_allocated_staff),
      operational_notes: form.operational_notes,
      image: form.image || undefined,
      notes: form.notes || undefined,
    };

    try {
      const response = await fetch(`${API_URL}/api/sites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = error.message || error.detail || "Failed to add site.";
        throw new Error(msg);
      }

      const result = await response.json();
      const site_id = result.id;

      // === Update Hours ===
      try {
        const hoursRes = await fetch(`${API_URL}/api/sites/${site_id}/hours/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const hours = await hoursRes.json();

        const updatedHours = hours.map((hour: any) => {
          const isOperational = form.is_24_hour || form.operational_days.includes(hour.day_label);
          return form.is_24_hour
            ? { id: hour.id, is_open_24_hours: true, is_closed: false, opens_at: null, closes_at: null }
            : isOperational
            ? { id: hour.id, is_open_24_hours: false, is_closed: false, opens_at: "09:00:00", closes_at: "17:00:00" }
            : { id: hour.id, is_open_24_hours: false, is_closed: true, opens_at: null, closes_at: null };
        });

        await fetch(`${API_URL}/api/sites/${site_id}/hours/bulk/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedHours),
        });
      } catch (err) {
        showToast("Site created, but hours may need manual setup.", "info");
      }

      showToast("Site added successfully!", "success");
      dispatch(resetForm());
      setSubmitSuccess(true);
    } catch (error: any) {
      const msg = error.message || "Failed to add site.";
      setSubmitError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === SUCCESS UI ===
  if (submitSuccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Site Added Successfully!</CardTitle>
            <p className="text-muted-foreground">Your site is ready to use.</p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleClose} className="gap-2">
              <X className="h-4 w-4" /> Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === ERROR UI ===
  if (submitError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Failed to Add Site</CardTitle>
            <p className="text-muted-foreground">{submitError}</p>
          </CardHeader>
          <CardContent className="flex justify-center space-x-4">
            <Button onClick={handleClose} variant="outline">Cancel</Button>
            <Button onClick={() => setSubmitError(null)} className="gap-2">
              <Save className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === MAIN FORM ===
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <DebugComponent />

      <Stepper totalSteps={3}>
        <StepperTabs labels={["Site Location", "Site Admin", "Operations"]} />

        <form
          id="site-form"
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className="mt-8"
        >
          <StepperContent>
            {/* Step 1: Site Location */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Site Location Details
                </CardTitle>
                <p className="text-muted-foreground">Provide location info.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Site Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter site name"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <div className="relative">
                      <Input
                        id="postcode"
                        name="postcode"
                        value={form.postcode}
                        onChange={handlePostcodeChange}
                        placeholder="CM7 4AZ"
                        className="h-11"
                        disabled={isFetchingPostcode}
                      />
                      {isFetchingPostcode && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Site Image
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <ImageUploader onUploadSuccess={handleImageUpload} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Site Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter address..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="radius_m">Radius (miles)</Label>
                    <Input
                      id="radius_m"
                      name="radius_m"
                      type="number"
                      value={form.radius_m}
                      onChange={handleChange}
                      min="1"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional notes..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Site Admin */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Site Administrator
                </CardTitle>
                <p className="text-muted-foreground">Contact person details.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Name</Label>
                    <Input
                      id="contact_name"
                      name="contact_name"
                      value={form.contact_name}
                      onChange={handleChange}
                      placeholder="Imran Ali"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_position">Position</Label>
                    <Input
                      id="contact_position"
                      name="contact_position"
                      value={form.contact_position}
                      onChange={handleChange}
                      placeholder="Site Manager"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      type="tel"
                      value={form.contact_phone}
                      onChange={handleChange}
                      placeholder="+44 938747 8383"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={form.contact_email}
                      onChange={handleChange}
                      placeholder="person@company.com"
                      className="h-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Operations */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Operational Details
                </CardTitle>
                <p className="text-muted-foreground">Set schedule and resources.</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Operational Days
                  </Label>
                  <p className="text-sm text-muted-foreground">Select active days</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => {
                      const isSelected = form.operational_days.includes(day);
                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDayToggle(day)}
                          disabled={form.is_24_hour}
                          className={cn(
                            "h-12 flex flex-col gap-1",
                            isSelected && "bg-primary text-primary-foreground",
                            form.is_24_hour && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="text-xs font-medium">{day.slice(0, 3)}</span>
                        </Button>
                      );
                    })}
                  </div>

                  {form.operational_days.length > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Selected:</p>
                      <div className="flex flex-wrap gap-1">
                        {form.operational_days.map((day) => (
                          <Badge key={day} variant="secondary" className="text-xs">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="is_24_hour">24-Hour Operation</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Site runs 24/7</p>
                    </div>
                    <Switch
                      id="is_24_hour"
                      checked={form.is_24_hour}
                      onCheckedChange={handle24HourToggle}
                    />
                  </div>
                  {form.is_24_hour && (
                    <div className="mt-3 p-2 bg-primary/10 rounded border-l-4 border-primary">
                      <p className="text-xs text-primary font-medium">24-hour operation enabled</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Car className="w-4 h-4" /> Authorized Vehicles
                    </Label>
                    <Input
                      id="number_of_allocated_vehicles"
                      name="number_of_allocated_vehicles"
                      type="number"
                      value={form.number_of_allocated_vehicles}
                      onChange={handleChange}
                      min="0"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> Authorized Staff
                    </Label>
                    <Input
                      id="number_of_allocated_staff"
                      name="number_of_allocated_staff"
                      type="number"
                      value={form.number_of_allocated_staff}
                      onChange={handleChange}
                      min="0"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Operational Notes
                  </Label>
                  <Textarea
                    id="operational_notes"
                    name="operational_notes"
                    value={form.operational_notes}
                    onChange={handleChange}
                    placeholder="Special instructions..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </StepperContent>

          <StepperNavigation className="pt-8" />
        </form>
      </Stepper>
    </div>
  );
}

// === EXPORT WITH PROVIDER ===
export default function AddSiteFormWithProvider() {
  return (
    <Provider store={store}>
      <AddSiteForm />
    </Provider>
  );
}