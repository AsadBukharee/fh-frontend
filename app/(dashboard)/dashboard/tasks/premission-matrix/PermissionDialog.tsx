// components/permission/PermissionDialog.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Shield, Loader2, Check } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface User {
  id: number;
  full_name: string;
}

interface TaskType {
  id: number;
  name: string;
}

interface PermissionDialogProps {
  open: boolean;
  editMode: boolean;
  submitting: boolean;
  selectedGrantor: number | null;
  selectedTarget: number | null;
  selectedLevel: string;
  selectedTaskType: number | null;
  taskTypes: TaskType[];
  onClose: () => void;
  onSave: () => void;
  onGrantorChange: (v: number) => void;
  onTargetChange: (v: number) => void;
  onLevelChange: (v: string) => void;
  onTaskTypeChange: (v: number | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Searchable User Picker – local filter, absolute dropdown          */
/* ------------------------------------------------------------------ */
const UserSearchPicker: React.FC<{
  value: number | null;
  onChange: (v: number) => void;
  placeholder: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cookies = useCookies();
  const token = cookies.get("access_token") ?? "";

  /* ---- Load *all* users once when dialog opens (or first focus) ---- */
  useEffect(() => {
    if (!open) return;                     // only fetch when dropdown is opened
    if (allUsers.length > 0) return;       // already cached

    setLoading(true);
    fetch(`${API_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const list: User[] =
          json?.data?.results
            ?.filter((u: any) => u.is_active)
            .map((u: any) => ({ id: u.id, full_name: u.full_name })) ?? [];
        setAllUsers(list);
      })
      .catch(() => setAllUsers([]))
      .finally(() => setLoading(false));
  }, [open, token, allUsers.length]);

  /* ---- Local filter ------------------------------------------------ */
  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allUsers.filter((u) => u.full_name.toLowerCase().includes(q));
  }, [search, allUsers]);

  /* ---- Show selected name in the input ----------------------------- */
  const selectedUser = useMemo(
    () => allUsers.find((u) => u.id === value) ?? null,
    [allUsers, value]
  );

  const displayValue = selectedUser?.full_name ?? (open ? search : "");

  return (
    <div className="relative">
      {/* ---------- Input (styled like shadcn Input) ---------- */}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={displayValue}
        disabled={disabled}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
          ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
          placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed
          disabled:opacity-50
        `}
      />

      {/* ---------- Absolute dropdown (only when open) ---------- */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <CommandList className="max-h-60 overflow-auto p-1">
              {loading ? (
                <CommandItem disabled className="flex items-center justify-center py-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading users…
                </CommandItem>
              ) : filtered.length === 0 ? (
                <CommandItem disabled className="text-muted-foreground">
                  {search ? "No users match" : "Start typing…"}
                </CommandItem>
              ) : (
                <CommandGroup>
                  {filtered.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={u.id.toString()}
                      onSelect={() => {
                        onChange(u.id);
                        setSearch("");
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          value === u.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      {u.full_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}

      {/* Click-outside overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Level & Task-Type (unchanged)                                     */
/* ------------------------------------------------------------------ */
const levelOptions = [
  { value: "view", label: "View Only", icon: Eye, color: "text-emerald-600" },
  { value: "edit", label: "View & Edit", icon: Pencil, color: "text-orange-600" },
  { value: "all", label: "Full Access (View, Edit, Delete)", icon: Shield, color: "text-purple-600" },
];

/* ------------------------------------------------------------------ */
/*  Main Dialog                                                       */
/* ------------------------------------------------------------------ */
export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  open,
  editMode,
  submitting,
  selectedGrantor,
  selectedTarget,
  selectedLevel,
  selectedTaskType,
  taskTypes,
  onClose,
  onSave,
  onGrantorChange,
  onTargetChange,
  onLevelChange,
  onTaskTypeChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit Permission" : "Add New Permission"}</DialogTitle>
          <DialogDescription>
            {editMode
              ? "Update the permission level for this user relationship"
              : "Create a new permission by selecting the grantor, target user, and access level"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ---------- Grantor ---------- */}
          <div className="space-y-2">
            <Label htmlFor="grantor">Grantor User *</Label>
            <UserSearchPicker
              value={selectedGrantor}
              onChange={onGrantorChange}
              placeholder="Search grantor…"
              disabled={editMode}
            />
            <p className="text-xs text-gray-500">User who grants permission</p>
          </div>

          {/* ---------- Target ---------- */}
          <div className="space-y-2">
            <Label htmlFor="target">Target User *</Label>
            <UserSearchPicker
              value={selectedTarget}
              onChange={onTargetChange}
              placeholder="Search target…"
              disabled={editMode}
            />
            <p className="text-xs text-gray-500">User who receives permission</p>
          </div>

          {/* ---------- Permission Level ---------- */}
          <div className="space-y-2">
            <Label htmlFor="level">Permission Level *</Label>
            <Select value={selectedLevel} onValueChange={onLevelChange}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className={`w-4 h-4 ${opt.color}`} />
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---------- Task Type ---------- */}
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type (Optional)</Label>
            <Select
              value={selectedTaskType?.toString() ?? "null"}
              onValueChange={(v) => onTaskTypeChange(v === "null" ? null : Number(v))}
            >
              <SelectTrigger id="taskType">
                <SelectValue placeholder="All task types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">All task types</SelectItem>
                {taskTypes.map((tt) => (
                  <SelectItem key={tt.id} value={tt.id.toString()}>
                    {tt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Leave empty to apply to all task types
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={submitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? "Saving…" : editMode ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};