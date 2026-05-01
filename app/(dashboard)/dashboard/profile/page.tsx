"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCookies } from "next-client-cookies";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  BadgeCheck,
  Edit,
  Save,
  X,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Pencil,
  FileText,
  Loader2,
  Camera,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useToast } from "@/app/Context/ToastContext";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ── Helper Components (Matching Driver Profile Style) ── */

function FieldCell({
  label,
  value,
  highlight,
  email,
  truncate = false,
}: {
  label: string;
  value: string | React.ReactNode;
  highlight?: "orange" | "pink" | "yellow" | "green" | "gray";
  email?: boolean;
  truncate?: boolean;
}) {
  const badgeClasses: Record<string, string> = {
    orange: "bg-orange-100 text-orange-700 border border-orange-200",
    pink: "bg-rose-100 text-rose-700 border border-rose-200",
    yellow: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    green: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  const renderValue = () => {
    if (highlight) {
      return (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold w-fit",
            badgeClasses[highlight]
          )}
        >
          {value}
        </span>
      );
    }

    const textValue = typeof value === "string" ? value : "";
    const displayValue = textValue || "—";
    const isTruncated = truncate && textValue.length > 25;
    const finalDisplayValue = isTruncated ? textValue.substring(0, 25) + "..." : displayValue;

    const content = (
      <span className={cn(
        "text-sm font-medium truncate",
        email ? "text-orange-500" : "text-gray-800"
      )}>
        {finalDisplayValue}
      </span>
    );

    if (isTruncated) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help w-fit max-w-full overflow-hidden">
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-slate-900 text-white border-none">
            <p className="text-xs">{textValue}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      {renderValue()}
    </div>
  );
}

function VDivider() {
  return <div className="hidden sm:block w-px self-stretch bg-gray-100 mx-1" />;
}

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors"
          >
            edit
            <Pencil className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ── Interfaces ── */

interface Site {
  id: number;
  name: string;
  status: string;
  image: string | null;
}

interface Contract {
  id: number;
  name: string;
  description: string;
}

interface UserData {
  id: number;
  email: string;
  full_name: string;
  display_name: string;
  parent_rota_completed: boolean;
  child_rota_completed: boolean;
  contract_signing_date: string;
  rota_start_date: string | null;
  paid_holidays: number;
  is_active: boolean;
  contract: Contract | null;
  role: string;
  site: Site[];
  shifts_count: number;
  avatar: string | null;
}

/* ── Main Component ── */

export default function ProfilePage() {
  const cookies = useCookies();
  const { showToast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile-detail";

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    display_name: "",
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const userId = cookies.get("user_id");
  const accessToken = cookies.get("access_token");

  const fetchUserData = useCallback(async () => {
    if (!userId || !accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const result = await response.json();
      if (result.success) {
        setUserData(result.data);
        setEditFormData({
          full_name: result.data.full_name,
          display_name: result.data.display_name,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Error loading profile data", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken, showToast]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !accessToken) return;

    try {
      setUpdating(true);
      const response = await fetch(`${API_URL}/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const result = await response.json();
      if (result.success) {
        showToast("Profile updated successfully", "success");
        setUserData(result.data);
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Error updating profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !accessToken) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload the image
      const uploadResponse = await fetch(`${API_URL}/media/upload_image/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload image");

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.image || uploadResult.url;

      if (!imageUrl) throw new Error("Image URL not returned from server");

      // 2. Update user profile with new avatar URL
      const updateResponse = await fetch(`${API_URL}/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ avatar: imageUrl }),
      });

      if (!updateResponse.ok) throw new Error("Failed to update profile image");

      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        showToast("Profile image updated successfully", "success");
        setUserData(updateResult.data);
      }
    } catch (error) {
      console.error("Error updating profile image:", error);
      showToast("Error updating profile image", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#F15A29]" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
          <p className="text-gray-700 text-lg font-medium">Profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container p-8 space-y-8 bg-white min-h-screen animate-in fade-in duration-500">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="flex justify-start w-full gap-8 bg-[#f9f9f9] py-8 px-6">
            <TabsTrigger 
              value="profile-detail" 
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F] transition-colors"
            >
              <User size={16} /> Profile Details
            </TabsTrigger>
            <TabsTrigger 
              value="employment-details" 
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 data-[state=active]:text-[#F15A29] data-[state=active]:bg-[#F15A291F] transition-colors"
            >
              <FileText size={16} /> Employment & Sites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile-detail" className="space-y-8">
            <SectionCard title="Basic Details" onEdit={() => setIsEditDialogOpen(true)}>
              <div className="flex gap-5">
                {/* LEFT: Avatar column */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px]">
                  <div className="relative group">
                    <div className={cn(
                      "w-16 h-16 rounded-full overflow-hidden ring-2 ring-white shadow-md bg-gray-50",
                      uploadingAvatar && "opacity-50"
                    )}>
                      {userData.avatar ? (
                        <img
                          src={userData.avatar}
                          alt={userData.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#F15A29] bg-orange-50 font-bold text-xl">
                          {userData.full_name?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Overlay */}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>

                    {/* Status Badge */}
                    <span className={cn(
                      "absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border border-white shadow-sm",
                      userData.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    )}>
                      {userData.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400 font-medium">#{userData.id}</p>
                    <p className="text-[10px] font-bold text-gray-900 uppercase">{userData.role}</p>
                  </div>
                </div>

                {/* RIGHT: Fields Grid */}
                <div className="flex-1 min-w-0 flex flex-col gap-5">
                  {/* Row 1 */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                    <div className="flex-1"><FieldCell label="First Name" value={userData.full_name.split(' ')[0] || "—"} /></div>
                    <VDivider />
                    <div className="flex-1"><FieldCell label="Last Name" value={userData.full_name.split(' ').slice(1).join(' ') || "—"} /></div>
                    <VDivider />
                    <div className="flex-1"><FieldCell label="Display Name" value={userData.display_name || "—"} /></div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                    <div className="flex-1"><FieldCell label="Email Address" value={userData.email} email truncate /></div>
                    <VDivider />
                    <div className="flex-1"><FieldCell label="Signed Date" value={new Date(userData.contract_signing_date).toLocaleDateString()} highlight="green" /></div>
                    <VDivider />
                    <div className="flex-1"><FieldCell label="Shifts Count" value={`${userData.shifts_count} Shifts`} highlight="orange" /></div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Account Statistics">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center space-y-1">
                    <Clock className="w-5 h-5 text-[#F15A29] mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{userData.shifts_count}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Total Shifts</p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center space-y-1">
                    <Calendar className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{userData.paid_holidays}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Paid Holidays</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Profile Status">
                <div className="flex items-center gap-4 h-full">
                  <div className={cn(
                    "p-4 rounded-2xl border flex-1 text-center",
                    userData.is_active ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"
                  )}>
                    <CheckCircle className={cn("w-6 h-6 mx-auto mb-2", userData.is_active ? "text-emerald-500" : "text-gray-400")} />
                    <p className="text-sm font-bold text-gray-900">{userData.is_active ? "System Access Active" : "Access Restricted"}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Status managed by administration</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          <TabsContent value="employment-details" className="space-y-8">
             <SectionCard title="Assigned Sites">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userData.site && userData.site.length > 0 ? (
                    userData.site.map((site) => (
                      <div key={site.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/30 group hover:bg-white hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                          {site.image ? (
                            <img src={site.image} alt={site.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                              <Building2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{site.name}</p>
                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1.5 py-0",
                            site.status === 'active' ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-50"
                          )}>
                            {site.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm">No sites assigned to this profile.</p>
                    </div>
                  )}
               </div>
             </SectionCard>

             <SectionCard title="Contract Details">
                {userData.contract ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-magenta/10 rounded-2xl">
                        <FileText className="w-6 h-6 text-magenta" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{userData.contract.name}</h3>
                        <p className="text-xs text-gray-500">Signed on {new Date(userData.contract_signing_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Separator className="bg-gray-100" />
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      "{userData.contract.description}"
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">No contract details available for this account.</p>
                  </div>
                )}
             </SectionCard>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white ring-0 outline-none rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Profile</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Update your account display details. These changes will reflect across the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-xs font-bold uppercase text-gray-400 tracking-wider">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="rounded-xl border-gray-200 focus:ring-[#F15A29]/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-xs font-bold uppercase text-gray-400 tracking-wider">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editFormData.display_name}
                    onChange={(e) => setEditFormData({ ...editFormData, display_name: e.target.value })}
                    placeholder="Enter your display name"
                    className="rounded-xl border-gray-200 focus:ring-[#F15A29]/20"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="rounded-xl flex-1 border-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-gradient-to-r from-orange to-magenta text-white shadow-lg shadow-orange/20 rounded-xl flex-[2] hover:opacity-90"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Update Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
