"use client";

import React, { useState, useEffect } from "react";
import { useStepper } from "./DriverStepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Badge } from "@/components/ui/badge";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface Contract {
  id: number;
  name: string;
  description: string;
  users: Array<{
    id: number;
    email: string;
    full_name: string;
  }>;
  shifts: Array<{
    id: number;
    name: string;
    hours_from: string;
    hours_to: string;
    rate_per_hours: number;
  }>;
}

interface Site {
  id: number;
  name: string;
}

interface EmploymentDetailsStepProps {
  driverId: number | null;
  setEmploymentData: (data: any) => void;
  user_id: number | null
}

export const EmploymentDetailsStep: React.FC<EmploymentDetailsStepProps> = ({
  driverId,
  user_id,
  setEmploymentData,
}) => {
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const cookies = useCookies();
  const { goToNextStep, goToPreviousStep, disableBack } = useStepper();

  // Employment form state
  const [formData, setFormData] = useState({

    contract_id: null as number | null,
    assigned_sites: [] as number[], // Array of site IDs
  });

  const [contractsOpen, setContractsOpen] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(false);

  useEffect(() => {
    if (driverId) {
      // Load existing driver data
      loadDriverData();
    }
    // Load contracts and sites
    loadContracts();
    loadSites();
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/profiles/driver/${driverId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (response.ok) {
        const driverData = await response.json();
        // Update form data with existing driver data
        if (driverData.contract_signing_date) {
          setFormData(prev => ({
            ...prev,
            contract_signing_date: new Date(driverData.contract_signing_date),
          }));
        }
        if (driverData.rota_start_date) {
          setFormData(prev => ({
            ...prev,
            rota_start_date: new Date(driverData.rota_start_date),
          }));
        }
        if (driverData.contract?.id) {
          setFormData(prev => ({
            ...prev,
            contract_id: driverData.contract.id,
          }));
        }
        if (driverData.site && Array.isArray(driverData.site)) {
          setFormData(prev => ({
            ...prev,
            assigned_sites: driverData.site.map((site: any) => site.id),
          }));
        }
      }
    } catch (error) {
      console.error("Error loading driver data:", error);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/staff/contracts/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (response.ok) {
        const contractsData = await response.json();
        setContracts(contractsData);
      }
    } catch (error) {
      console.error("Error loading contracts:", error);
    }
  };

  const loadSites = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sites/list-names/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      });
      if (response.ok) {
        const sitesData = await response.json();
        setSites(sitesData.data || []);
      }
    } catch (error) {
      console.error("Error loading sites:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContractSelect = (contractId: number | null) => {
    setFormData(prev => ({ ...prev, contract_id: contractId }));
    setContractsOpen(false);
  };

  const handleSiteToggle = (siteId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_sites: prev.assigned_sites.includes(siteId)
        ? prev.assigned_sites.filter(id => id !== siteId)
        : [...prev.assigned_sites, siteId]
    }));
  };

  const removeSite = (siteId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_sites: prev.assigned_sites.filter(id => id !== siteId)
    }));
  };

  const getSelectedContract = () => {
    return contracts.find(contract => contract.id === formData.contract_id);
  };

  const getSelectedSites = () => {
    return sites.filter(site => formData.assigned_sites.includes(site.id));
  };

  // Assign contract API call
  const assignContract = async (userId: number, contractId: number) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/assign-contract/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          contract_id: contractId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign contract");
      }

      return await response.json();
    } catch (error) {
      console.error("Error assigning contract:", error);
      throw error;
    }
  };

  // Assign sites API call
  const assignSites = async (userId: number, siteIds: number[]) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/allocate-sites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          site_ids: siteIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign sites");
      }

      return await response.json();
    } catch (error) {
      console.error("Error assigning sites:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverId || !user_id) {
      alert("Please complete personal information first");
      return;
    }

    // Validation
    if (!formData.contract_id) {
      alert("Please select a contract");
      return;
    }

    setLoading(true);
    setAssigning(true);

    try {

      // Update driver profile with employment details


      // Assign contract if selected
      if (formData.contract_id) {
        await assignContract(user_id, formData.contract_id);
      }

      // Assign sites if selected
      if (formData.assigned_sites.length > 0) {
        await assignSites(user_id, formData.assigned_sites);
      }

      goToNextStep();

    } catch (error: any) {
      console.error("Error saving employment details:", error);
      alert(`Failed to save employment details: ${error.message || "Please try again."}`);
    } finally {
      setLoading(false);
      setAssigning(false);
    }
  };

  const handleNext = async () => {
    // Call the same submit handler
    const mockEvent = { preventDefault: () => { } } as React.FormEvent;
    await handleSubmit(mockEvent);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-500">Employment Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide employment information for the driver
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">


          {/* Contract Assigned */}
          <div className="space-y-2">
            <Label htmlFor="contract">Contract Assigned</Label>
            <Popover open={contractsOpen} onOpenChange={setContractsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={contractsOpen}
                  className="w-full justify-between"
                >
                  {formData.contract_id
                    ? getSelectedContract()?.name
                    : "Select a contract..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search contracts..." />
                  <CommandList>
                    <CommandEmpty>No contracts found.</CommandEmpty>
                    <CommandGroup>
                      {contracts.map((contract) => (
                        <CommandItem
                          key={contract.id}
                          value={contract.name}
                          onSelect={() => handleContractSelect(contract.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.contract_id === contract.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{contract.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {contract?.description?.slice(0, 30)}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {formData.contract_id && (
              <div className="mt-2 p-3 border border-gray-300 rounded-md bg-white">
                <p className="text-sm font-medium text-orange-500">
                  Selected Contract: {getSelectedContract()?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getSelectedContract()?.description}
                </p>
                <div className="mt-2">
                  <p className="text-xs font-medium text-orange-500">Available Shifts:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getSelectedContract()?.shifts.slice(0, 5).map((shift) => (
                      <Badge key={shift.id} variant="outline" className="text-xs">
                        {shift.name} ({shift.hours_from} - {shift.hours_to})
                      </Badge>
                    ))}
                    {getSelectedContract() && getSelectedContract()!.shifts.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{getSelectedContract()!.shifts.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Sites */}
          <div className="space-y-2">
            <Label htmlFor="sites">Assigned Sites</Label>
            <Popover open={sitesOpen} onOpenChange={setSitesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sitesOpen}
                  className="w-full justify-between"
                >
                  <span>
                    {formData.assigned_sites.length > 0
                      ? `${formData.assigned_sites.length} site(s) selected`
                      : "Select sites..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search sites..." />
                  <CommandList>
                    <CommandEmpty>No sites found.</CommandEmpty>
                    <CommandGroup>
                      {sites.map((site) => (
                        <CommandItem
                          key={site.id}
                          value={site.name}
                          onSelect={() => handleSiteToggle(site.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.assigned_sites.includes(site.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {site.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Selected Sites Display */}
            {formData.assigned_sites.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Selected Sites:</p>
                <div className="flex flex-wrap gap-2">
                  {getSelectedSites().map((site) => (
                    <Badge
                      key={site.id}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {site.name}
                      <button
                        type="button"
                        onClick={() => removeSite(site.id)}
                        className="ml-2 rounded-full outline-none hover:bg-muted-foreground/20"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
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
              type="button"
              variant="outline"
              className="bg-yellow-50 border-none text-yellow-600 hover:bg-yellow-100 h-12 rounded-lg"
              onClick={handleNext}
              disabled={loading || assigning || driverId === null || !user_id}
            >
              Save & Next
              <ChevronRight />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};