"use client";

import * as React from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/app/Context/ToastContext";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "./Media/UploadImage";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

// Define interfaces for Stepper props
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

// Stepper Context
const StepperContext = React.createContext<{
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}>({
  currentStep: 0,
  setCurrentStep: () => {},
  totalSteps: 0,
});

// Stepper Component
const Stepper: React.FC<StepperProps> = ({
  totalSteps,
  initialStep = 0,
  children,
}) => {
  const [currentStep, setCurrentStep] = React.useState(initialStep);

  // Debug step changes
  React.useEffect(() => {
    console.log("Current Step:", currentStep);
  }, [currentStep]);

  return (
    <StepperContext.Provider value={{ currentStep, setCurrentStep, totalSteps }}>
      <div className="space-y-6">{children}</div>
    </StepperContext.Provider>
  );
};

// Stepper Tabs Component
const StepperTabs: React.FC<StepperTabsProps> = ({ labels }) => {
  const { currentStep, setCurrentStep, totalSteps } =
    React.useContext(StepperContext);

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

// Stepper Content Component
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

// Stepper Navigation Component
const StepperNavigation: React.FC<StepperNavigationProps> = ({
  className,
}) => {
  const { currentStep, setCurrentStep, totalSteps } =
    React.useContext(StepperContext);
  const { showToast } = useToast();
  const form = useSelector((state: RootState) => state.form);

  const handleNext = () => {
    if (currentStep === 0 && !form.name.trim()) {
      showToast("Please fill in the site name before proceeding.", "error");
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

  return (
    <div className={cn("flex justify-between mt-6", className)}>
      <Button
        variant="outline"
        size="lg"
        onClick={handlePrevious}
        disabled={currentStep === 0}
        className="flex items-center gap-2"
        type="button"
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={handleNext}
        disabled={currentStep === totalSteps - 1}
        className="flex items-center bg-orange gap-2"
        type="button"
      >
        Next
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
};

// Define the form state interface
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

// Initial state for the form
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

// Create the Redux slice
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

// Export actions
export const { updateField, toggleDay, toggle24Hour, resetForm } =
  formSlice.actions;

// Configure the Redux store
const store = configureStore({
  reducer: {
    form: formSlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Debug Component to track state changes
const DebugComponent = () => {
  const form = useSelector((state: RootState) => state.form);
  const { currentStep } = React.useContext(StepperContext);
  const prevStep = React.useRef(currentStep);
  const prevForm = React.useRef(form);

  React.useEffect(() => {
    if (prevStep.current !== currentStep) {
      console.log('🔄 Step changed:', { from: prevStep.current, to: currentStep });
      console.log('📊 Form state when step changed:', form);
      prevStep.current = currentStep;
    }

    const isFormReset = Object.keys(initialState).every(
      (key) => form[key as keyof FormState] === initialState[key as keyof FormState]
    );

    const wasFormReset = !Object.keys(initialState).every(
      (key) => prevForm.current[key as keyof FormState] === initialState[key as keyof FormState]
    );

    if (isFormReset && wasFormReset) {
      console.log('🚨 FORM WAS RESET!', { previousState: prevForm.current, currentState: form });
    }

    prevForm.current = form;
  }, [currentStep, form]);

  return null;
};

function AddSiteForm() {
  const { showToast } = useToast();
  const cookies = useCookies();
  const token = cookies.get("access_token");
  const dispatch = useDispatch<AppDispatch>();
  const form = useSelector((state: RootState) => state.form);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFetchingPostcode, setIsFetchingPostcode] = React.useState(false);

  // Debug form state changes
  React.useEffect(() => {
    console.log("Form State:", form);
  }, [form]);

  // Function to fetch address details from Nominatim API
  const fetchAddressDetails = async (postcode: string) => {
    if (!postcode.trim()) {
      showToast("Please enter a valid postcode.", "error");
      return;
    }

    setIsFetchingPostcode(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          postcode
        )}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            "User-Agent": "YourAppName/1.0 (your.email@example.com)", // Replace with your app details
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address details");
      }

      const data = await response.json();
      if (data.length === 0) {
        showToast("No results found for this postcode.", "error");
        setIsFetchingPostcode(false);
        return;
      }

      const result = data[0];
      const { lat, lon, address } = result;

      // Construct a readable address from address components
      const formattedAddress = [
        address.road || "",
        address.city || address.town || address.village || "",
        address.state || "",
        address.country || "",
      ]
        .filter(Boolean)
        .join(", ");

      // Update form state with fetched details
      dispatch(
        updateField({
          address: formattedAddress,
          latitude: lat,
          longitude: lon,
          radius_m: 200, // Default radius; adjust as needed
        })
      );

      showToast("Address details fetched successfully!", "success");
    } catch (error) {
      showToast("Failed to fetch address details. Please try again.", "error");
      console.error("Error fetching address:", error);
    } finally {
      setIsFetchingPostcode(false);
    }
  };

  // Debounce the fetchAddressDetails function to avoid excessive API calls
  const debouncedFetchAddress = React.useCallback(
    debounce((postcode: string) => fetchAddressDetails(postcode), 500),
    []
  );

  // Handle postcode input changes
  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    console.log(`Updating postcode to ${value}`);
    dispatch(updateField({ postcode: value }));

    // Trigger address fetch for valid postcodes
    const postcodeRegex = /^[A-Z0-9]{2,4}\s?[A-Z0-9]{2,4}$/i; // Simple UK postcode regex
    if (postcodeRegex.test(value)) {
      debouncedFetchAddress(value);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log(`Updating field ${name} to ${value}`);
    dispatch(updateField({ [name]: value }));
  };

  const handleImageUpload = (url: string) => {
    console.log("Image uploaded:", url);
    dispatch(updateField({ image: url }));
    showToast("Image uploaded successfully!", "success");
  };

  const handleDayToggle = (day: string) => {
    console.log("Toggling day:", day);
    dispatch(toggleDay(day));
  };

  const handle24HourToggle = () => {
    console.log("Toggling 24-hour:", !form.is_24_hour);
    dispatch(toggle24Hour());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      postcode: form.postcode,
      address: form.address,
      latitude: Number.parseFloat(form.latitude) || undefined,
      longitude: Number.parseFloat(form.longitude) || undefined,
      radius_m: Number.parseInt(form.radius_m.toString(), 10),
      contact_name: form.contact_name,
      contact_position: form.contact_position,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      number_of_allocated_vehicles: Number.parseInt(
        form.number_of_allocated_vehicles.toString(),
        10
      ),
      number_of_allocated_staff: Number.parseInt(
        form.number_of_allocated_staff.toString(),
        10
      ),
      operational_days: form.operational_days,
      is_24_hour: form.is_24_hour,
      operational_notes: form.operational_notes,
      image: form.image || undefined,
      notes: form.notes || undefined,
    };

    console.log("Submitting payload:", payload);

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
        throw new Error("Failed to submit the form");
      }

      const result = await response.json();
      showToast("Site added successfully!", "success");
      alert("Site added successfully!")
      console.log("API response:", result);
      dispatch(resetForm());
    } catch (error) {
      showToast("Failed to add site. Please try again.", "error");
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <DebugComponent />

      <Stepper totalSteps={3} initialStep={0}>
        <StepperTabs labels={["Site Location", "Site Admin", "Operations"]} />

        <form onSubmit={handleSubmit} className="mt-8">
          <StepperContent>
            {/* Step 1: Site Location Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Site Location Details
                </CardTitle>
                <p className="text-muted-foreground">
                  Provide the basic information and location details for this site.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium flex items-center gap-1"
                    >
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
                    <Label htmlFor="postcode" className="text-sm font-medium">
                      Postcode
                    </Label>
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
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Site Image
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <ImageUploader onUploadSuccess={handleImageUpload} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Site Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter the complete address..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-sm font-medium">
                      Latitude
                    </Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="51.9731"
                      type="text"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-sm font-medium">
                      Longitude
                    </Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="0.4831"
                      type="text"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="radius_m" className="text-sm font-medium">
                      Radius (meters)
                    </Label>
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
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional notes about this site..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Site Admin Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Site Administrator
                </CardTitle>
                <p className="text-muted-foreground">
                  Contact information for the person responsible for this site.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="contact_name"
                      className="text-sm font-medium"
                    >
                      Administrator Name
                    </Label>
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
                    <Label
                      htmlFor="contact_position"
                      className="text-sm font-medium"
                    >
                      Position/Title
                    </Label>
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
                    <Label
                      htmlFor="contact_phone"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Phone Number
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
                    <Label
                      htmlFor="contact_email"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email Address
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

            {/* Step 3: Site Operational Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Operational Details
                </CardTitle>
                <p className="text-muted-foreground">
                  Configure the operational parameters and schedule for this site.
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Operational Days
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select the days when this site will be operational
                  </p>

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
                            "h-12 flex flex-col items-center justify-center gap-1 transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-muted",
                            form.is_24_hour ? "opacity-50 cursor-not-allowed" : ""
                          )}
                        >
                          <span className="text-xs font-medium">
                            {day.slice(0, 3)}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {day.slice(3, 6)}
                          </span>
                        </Button>
                      );
                    })}
                  </div>

                  {form.operational_days.length > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Selected days:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {form.operational_days.map((day) => (
                          <Badge
                            key={day}
                            variant="secondary"
                            className="text-xs px-2 py-1"
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {form.is_24_hour && (
                    <p className="text-sm text-muted-foreground">
                      Operational days are not required for 24-hour sites.
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label
                          htmlFor="is_24_hour"
                          className="text-sm font-medium"
                        >
                          24-Hour Operation
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enable if this site operates around the clock
                      </p>
                    </div>
                    <Switch
                      id="is_24_hour"
                      checked={form.is_24_hour}
                      onCheckedChange={handle24HourToggle}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  {form.is_24_hour && (
                    <div className="mt-3 p-2 bg-primary/10 rounded border-l-4 border-primary">
                      <p className="text-xs text-primary font-medium">
                        ✓ This site will operate 24 hours a day
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="number_of_allocated_vehicles"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Car className="w-4 h-4" />
                      Authorized Vehicles
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
                    <Label
                      htmlFor="number_of_allocated_staff"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Authorized Staff
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
                  <Label
                    htmlFor="operational_notes"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Operational Notes
                  </Label>
                  <Textarea
                    id="operational_notes"
                    name="operational_notes"
                    value={form.operational_notes}
                    onChange={handleChange}
                    placeholder="Additional operational notes, special requirements, or instructions..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.name.trim()}
                  className="min-w-[160px] h-12 text-base font-medium"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Adding Site...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Add Site
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </StepperContent>

          <StepperNavigation className="pt-8" />
        </form>
      </Stepper>
    </div>
  );
}

// Wrap the component with the Redux Provider
export default function AddSiteFormWithProvider() {
  return (
    <Provider store={store}>
      <AddSiteForm />
    </Provider>
  );
}