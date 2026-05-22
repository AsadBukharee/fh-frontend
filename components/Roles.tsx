"use client";

import React, { useState, useEffect } from "react";
import { useCookies } from "next-client-cookies";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, UserCheck, Truck, User, Briefcase, UserCog, Shield } from "lucide-react";
import { toast } from "sonner";



const Roles = () => {
    const cookies = useCookies();
    const [roles, setRoles] = useState<string[]>([]);
    const [activeRole, setActiveRole] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // Get roles from localStorage
        const storedRoles = localStorage.getItem("roles");
        let parsedRoles: string[] = [];
        if (storedRoles) {
            try {
                parsedRoles = JSON.parse(storedRoles);
            } catch (e) {
                console.error("Failed to parse roles from localStorage", e);
            }
        }

        // Get active role from cookie
        const currentRole = cookies.get("role") || "";
        setActiveRole(currentRole.toLowerCase());

        // Filter out 'driver' role from the roles list
        const filteredRoles = parsedRoles.filter(
            (r) => r.toLowerCase() !== "driver"
        );

        if (filteredRoles.length > 0) {
            setRoles(filteredRoles);
        } else if (currentRole && currentRole.toLowerCase() !== "driver") {
            setRoles([currentRole]);
        } else {
            setRoles([]);
        }
    }, [cookies]);

    const handleRoleChange = (roleVal: string) => {
        if (!roleVal) return;
        const lowerRole = roleVal.toLowerCase();

        if (lowerRole !== activeRole) {
            cookies.set("role", lowerRole);
            setActiveRole(lowerRole);

            toast.success(`Switched role to ${roleVal}`);

            // Refresh the page to apply new role permissions & layout
            setTimeout(() => {
                window.location.reload();
            }, 400);
        }
    };

    // Prevent SSR Hydration mismatches
    if (!isMounted) {
        return (
            <div className="w-[140px] h-9 bg-gray-50 border border-gray-200 rounded-lg animate-pulse" />
        );
    }

    // If the active role is driver or there are no valid roles, hide the component from the frontend
    if (activeRole === "driver" || roles.length === 0) {
        return null;
    }

    // Find the exact original string representation of the active role from the list
    const currentDisplayRole =
        roles.find((r) => r.toLowerCase() === activeRole) || activeRole || "Select Role";

    // If there are 0 or only 1 role, just display it as a beautiful, high-quality badge
    if (roles.length <= 1) {
        const singleRole = roles[0] || activeRole || "User";
        return (
            <div className="flex items-center gap-1.5 px-3 h-9 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-sm whitespace-nowrap">
                <span className="capitalize">{singleRole}</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <Select value={currentDisplayRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-9 px-3 text-xs font-semibold bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50/10 focus:ring-1 focus:ring-orange-500 transition-all rounded-lg min-w-[140px] shadow-sm flex items-center gap-2">
                    <SelectValue placeholder="Select Role">
                        <div className="flex items-center gap-2">
                            <span className="capitalize truncate max-w-[90px]">
                                {currentDisplayRole}
                            </span>
                        </div>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="text-xs rounded-xl shadow-lg border-gray-100 p-1 bg-white">
                    {roles.map((role) => (
                        <SelectItem
                            key={role}
                            value={role}
                            className="py-1.5 px-2 rounded-lg hover:bg-orange-50 hover:text-orange-950 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <span className="capitalize font-medium">{role}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default Roles;