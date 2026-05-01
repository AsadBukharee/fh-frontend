"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Save, MapPin, User, Building2, Car, Clock, Users, Phone, Mail,
  FileText, Camera, ChevronLeft, ChevronRight, CheckCircle,
  AlertCircle, Copy, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useToast } from "@/app/Context/ToastContext";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import ImageUploader from "../Media/UploadImage";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface OpeningHour {
  day_of_week: DayOfWeek;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  is_open_24_hours: boolean;
}

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
  max_staff_allowed: number;
  operational_notes: string;
  hours: OpeningHour[];
}

const initialHours: OpeningHour[] = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i as DayOfWeek,
  opens_at: "09:00:00",
  closes_at: "17:00:00",
  is_closed: i >= 5,
  is_open_24_hours: false,
}));

const initialState: FormState = {
  name: "", image: "", notes: "", postcode: "", address: "",
  contact_name: "", contact_position: "", contact_phone: "", contact_email: "",
  radius_m: 200, latitude: "", longitude: "",
  number_of_allocated_vehicles: 0, max_staff_allowed: 0,
  operational_notes: "", hours: initialHours
};

type Action =
  | { type: "UPDATE_FIELD"; payload: Partial<FormState> }
  | { type: "SET_HOURS"; payload: OpeningHour[] }
  | { type: "RESET" };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, ...action.payload };
    case "SET_HOURS":
      return { ...state, hours: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AddSiteForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const cookies = useCookies();
  const token = cookies.get("access_token");

  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isFetchingPostcode, setIsFetchingPostcode] = React.useState(false);

  // === Validation Errors (for real-time feedback) ===
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // === Postcode lookup ===
  const fetchAddress = async (postcode: string) => {
    if (!postcode.trim()) return;
    setIsFetchingPostcode(true);
    setErrors(prev => ({ ...prev, postcode: "", coordinates: "" }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(postcode)}&format=json&addressdetails=1&limit=1&countrycodes=gb`);
      const data = await res.json();
      if (!data[0]) throw new Error("Not found");
      const { lat, lon, address } = data[0];
      const formatted = [address.road, address.suburb || address.hamlet || address.village || address.town || address.city, address.postcode]
        .filter(Boolean).join(", ");
      dispatch({ type: "UPDATE_FIELD", payload: { address: formatted, latitude: lat, longitude: lon, postcode: postcode.toUpperCase() } });
      showToast("Address found!", "success");
    } catch {
      setErrors(prev => ({ ...prev, postcode: "Invalid or not found postcode" }));
      showToast("Postcode not found", "error");
    } finally {
      setIsFetchingPostcode(false);
    }
  };

  // === Time Picker ===
  const TimePicker = ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => {
    const [open, setOpen] = React.useState(false);
    const times = Array.from({ length: 48 }, (_, i) => {
      const h = Math.floor(i / 2).toString().padStart(2, "0");
      const m = i % 2 === 0 ? "00" : "30";
      return `${h}:${m}:00`;
    });

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")} disabled={disabled}>
            <Clock className="mr-2 h-4 w-4" />
            {value ? format(new Date(`2024-01-01 ${value}`), "HH:mm") : "Pick time"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Command>
            <CommandInput placeholder="Search time..." />
            <CommandEmpty>No time found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {times.map((t) => (
                <CommandItem key={t} onSelect={() => { onChange(t); setOpen(false); }}>
                  {format(new Date(`2024-01-01 ${t}`), "HH:mm")}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const updateDay = (day: DayOfWeek, changes: Partial<OpeningHour>) => {
    const newHours = state.hours.map(h => h.day_of_week === day ? { ...h, ...changes } : h);
    dispatch({ type: "SET_HOURS", payload: newHours });
  };

  const copyToAll = (day: DayOfWeek) => {
    const source = state.hours.find(h => h.day_of_week === day)!;
    const newHours = state.hours.map(h => ({
      ...h,
      opens_at: source.opens_at,
      closes_at: source.closes_at,
      is_closed: source.is_closed,
      is_open_24_hours: source.is_open_24_hours,
    }));
    dispatch({ type: "SET_HOURS", payload: newHours });
  };

  // === FULL STEP VALIDATION ===
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!state.name.trim()) newErrors.name = "Site name is required";
      if (!state.image) newErrors.image = "Site image is required";
      if (!state.postcode.trim()) newErrors.postcode = "Postcode is required";
      if (!state.address.trim()) newErrors.address = "Address is required";
      if (!state.latitude || !state.longitude) newErrors.coordinates = "Valid postcode with GPS is required";
      if (state.radius_m < 1) newErrors.radius = "Radius must be at least 1 meter";
    }

    if (currentStep === 1) {
      const hasContact = state.contact_name.trim() || state.contact_phone.trim() || state.contact_email.trim();
      if (!hasContact) newErrors.contact = "At least one contact method required (name, phone or email)";
    }

    if (currentStep === 2) {
      const hasOpenDay = state.hours.some(h => !h.is_closed || h.is_open_24_hours);
      if (!hasOpenDay) newErrors.hours = "At least one day must be open or 24h";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // === Submit ===
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const siteRes = await fetch(`${API_URL}/api/sites/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: state.name,
          image: state.image,
          postcode: state.postcode || undefined,
          address: state.address,
          latitude: parseFloat(state.latitude),
          longitude: parseFloat(state.longitude),
          radius_m: state.radius_m,
          contact_name: state.contact_name || undefined,
          contact_position: state.contact_position || undefined,
          contact_phone: state.contact_phone || undefined,
          contact_email: state.contact_email || undefined,
          number_of_allocated_vehicles: state.number_of_allocated_vehicles,
          max_staff_allowed: state.max_staff_allowed,
          operational_notes: state.operational_notes || undefined,
          notes: state.notes || undefined,
        }),
      });

      if (!siteRes.ok) {
        const err = await siteRes.json();
        throw new Error(err.message || "Failed to create site");
      }

      const site = await siteRes.json();

      // Save hours
      const payload = state.hours.map(h => ({
        day_of_week: h.day_of_week,
        opens_at: h.is_open_24_hours || h.is_closed ? null : h.opens_at,
        closes_at: h.is_open_24_hours || h.is_closed ? null : h.closes_at,
        is_closed: h.is_closed,
        is_open_24_hours: h.is_open_24_hours,
      }));

      await fetch(`${API_URL}/api/sites/${site.id}/hours/bulk/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }).catch(() => showToast("Hours may need manual update", "info"));

      showToast("Site created successfully!", "success");
      setSubmitSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      showToast(err.message || "Failed to create site", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Site Created Successfully!</h2>
            <p className="text-muted-foreground mb-8">Your site <strong>{state.name}</strong> has been added.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { dispatch({ type: "RESET" }); setSubmitSuccess(false); setCurrentStep(0); setErrors({}); }} variant="outline">
                Add Another Site
              </Button>
              <Button onClick={() => router.push('/sites')}>
                View All Sites
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {/* <h1 className="text-3xl font-bold">Add New Site</h1> */}
          <Badge variant="outline">{currentStep + 1} / 3</Badge>
        </div>

        <div className="flex justify-between border-b">
          {["Site Details", "Contact", "Hours & Resources"].map((label, i) => (
            <button
              key={i}
              onClick={() => validateCurrentStep() && setCurrentStep(i)}
              className={cn("pb-4 px-2 flex items-center gap-2 text-sm font-medium transition-all",
                currentStep === i ? "text-orange border-b-2 border-orange" : "text-muted-foreground",
                currentStep > i && "text-green-600"
              )}
            >
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                currentStep === i ? "bg-orange text-white" : currentStep > i ? "bg-green-100 text-green-700" : "bg-muted"
              )}>
                {currentStep > i ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </span>
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1 */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Site Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Site Name <span className="text-red-600">*</span></Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 z-10 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={state.name}
                    onChange={e => { dispatch({ type: "UPDATE_FIELD", payload: { name: e.target.value } }); setErrors(prev => ({ ...prev, name: "" })); }}
                    className={cn("pl-10", errors.name && "border-red-500")}
                    placeholder="e.g. London Depot"
                  />
                </div>
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label>Postcode <span className="text-red-600">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 z-10 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={state.postcode}
                    onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { postcode: e.target.value.toUpperCase() } })}
                    onBlur={e => e.target.value.trim() && fetchAddress(e.target.value)}
                    className={cn("pl-10 uppercase", errors.postcode && "border-red-500")}
                    placeholder="SW1A 1AA"
                  />
                  {isFetchingPostcode && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                </div>
                {errors.postcode && <p className="text-sm text-red-600 mt-1">{errors.postcode}</p>}
                {errors.coordinates && <p className="text-sm text-red-600 mt-1">{errors.coordinates}</p>}
              </div>
            </div>

            <div>
              <Label>Site Image <span className="text-red-600">*</span></Label>
              <div className={cn("border-2 border-dashed rounded-lg p-6 text-center", errors.image ? "border-red-500 bg-red-50" : "border-gray-300")}>
                {state.image ? (
                  <div className="space-y-3">
                    <img src={state.image} alt="Site" className="mx-auto h-32 object-cover rounded" />
                    <Button size="sm" variant="destructive" onClick={() => dispatch({ type: "UPDATE_FIELD", payload: { image: "" } })}>Remove</Button>
                  </div>
                ) : (
                  <div>
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <ImageUploader onUploadSuccess={(url) => { dispatch({ type: "UPDATE_FIELD", payload: { image: url } }); setErrors(prev => ({ ...prev, image: "" })); }} />
                    <p className="text-sm text-muted-foreground mt-2">Upload a photo of the site</p>
                  </div>
                )}
              </div>
              {errors.image && <p className="text-sm text-red-600 mt-2">{errors.image}</p>}
            </div>

            <div>
              <Label>Full Address <span className="text-red-600">*</span></Label>
              <Textarea
                rows={3}
                value={state.address}
                onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { address: e.target.value } })}
                className={errors.address && "border-red-500"}
                placeholder="123 High Street..."
              />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>

            <div>
              <Label>Geofence Radius (meters) <span className="text-red-600">*</span></Label>
              <Input
                type="number"
                min="1"
                value={state.radius_m}
                onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { radius_m: Number(e.target.value) || 0 } })}
                className={errors.radius && "border-red-500"}
              />
              {errors.radius && <p className="text-sm text-red-600 mt-1">{errors.radius}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Site Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Contact Name</Label>
              <Input value={state.contact_name} onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { contact_name: e.target.value } })} placeholder="John Doe" />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={state.contact_position} onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { contact_position: e.target.value } })} placeholder="Site Manager" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" value={state.contact_phone} onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { contact_phone: e.target.value } })} placeholder="+44 7123 456789" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={state.contact_email} onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { contact_email: e.target.value } })} placeholder="site@example.com" />
            </div>
            {errors.contact && <p className="col-span-2 text-sm text-red-600">{errors.contact}</p>}
          </CardContent>
        </Card>
      )}

      {/* STEP 3 */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Opening Hours & Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.hours && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.hours}
              </div>
            )}

            <div className="space-y-4">
              {state.hours.map((hour) => (
                <div key={hour.day_of_week} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className="w-28 font-medium">{dayNames[hour.day_of_week]}</div>

                  <Switch
                    checked={!hour.is_closed && !hour.is_open_24_hours}
                    onCheckedChange={(open) => updateDay(hour.day_of_week, { is_closed: !open, is_open_24_hours: false })}
                  />
                  <span className="text-sm">Open</span>

                  <Switch
                    checked={hour.is_open_24_hours}
                    onCheckedChange={(v) => updateDay(hour.day_of_week, { is_open_24_hours: v, is_closed: v ? false : hour.is_closed })}
                  />
                  <span className="text-sm">24h</span>

                  {!hour.is_closed && !hour.is_open_24_hours && (
                    <>
                      <TimePicker value={hour.opens_at!} onChange={(v) => updateDay(hour.day_of_week, { opens_at: v })} />
                      <span>to</span>
                      <TimePicker value={hour.closes_at!} onChange={(v) => updateDay(hour.day_of_week, { closes_at: v })} />
                    </>
                  )}

                  {(hour.is_closed || hour.is_open_24_hours) && (
                    <Badge variant="outline" className={hour.is_open_24_hours ? "bg-green-50 text-green-700" : "bg-gray-100"}>
                      {hour.is_open_24_hours ? "Open 24 hours" : "Closed"}
                    </Badge>
                  )}

                  <Button size="icon" variant="ghost" onClick={() => copyToAll(hour.day_of_week)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label><Car className="inline w-4 h-4 mr-1" /> Authorized Vehicles</Label>
                <Input type="number" min="0" value={state.number_of_allocated_vehicles} onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { number_of_allocated_vehicles: Number(e.target.value) || 0 } })} />
              </div>
              <div>
                <Label><Users className="inline w-4 h-4 mr-1" /> Max Staff Allowed</Label>
                <Input type="number" min="0" value={state.max_staff_allowed} onChange={e => dispatch({ type: "UPDATE_FIELD", payload: { max_staff_allowed: Number(e.target.value) || 0 } })} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-10">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(s => s - 1)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {currentStep === 2 ? (
          <Button
            onClick={() => validateCurrentStep() && setConfirmOpen(true)}
            disabled={isSubmitting}
            className="gap-2 bg-orange hover:bg-orange/90"
          >
            {isSubmitting ? <> <Loader2 className="h-4 w-4 animate-spin" /> Creating... </> : <> <Save className="h-4 w-4" /> Create Site </>}
          </Button>
        ) : (
          <Button
            onClick={() => validateCurrentStep() && setCurrentStep(s => s + 1)}
            className="gap-2"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Site?</AlertDialogTitle>
            <AlertDialogDescription>
              Create <strong>{state.name}</strong> with the provided details?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Yes, Create Site</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}