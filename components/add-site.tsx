"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import GradientButton from "@/app/utils/GradientButton";
import {  Save } from "lucide-react";
import { useToast } from "@/app/Context/ToastContext";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

export default function AddSiteForm() {
  const [form, setForm] = useState({
    name: "",
    image: "",
    notes: "",
    postcode: "",
    address: "",
    contact_position: "",
    contact_phone: "",
    contact_email: "",
    radius_m: 200,
    latitude: "",
    longitude: "",
    number_of_allocated_vehicles: 0,
  });
  const { showToast } = useToast();
  const cookies=useCookies()
  const token=cookies.get('access_token')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare the payload for the API
    const payload = {
      name: form.name,
      postcode: form.postcode,
      address: form.address,
      latitude: parseFloat(form.latitude) || undefined, // Convert to number or undefined if empty
      longitude: parseFloat(form.longitude) || undefined, // Convert to number or undefined if empty
      radius_m: parseInt(form.radius_m.toString(), 10), // Ensure integer
      number_of_allocated_vehicles: parseInt(form.number_of_allocated_vehicles.toString(), 10), // Ensure integer
    };

    try {
      const response = await fetch(`${API_URL}/api/sites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the form");
      }

      const result = await response.json();
      showToast("Site added successfully!", "success");
      console.log("API response:", result);

      // Optionally reset the form after successful submission
      setForm({
        name: "",
        image: "",
        notes: "",
        postcode: "",
        address: "",
        contact_position: "",
        contact_phone: "",
        contact_email: "",
        radius_m: 200,
        latitude: "",
        longitude: "",
        number_of_allocated_vehicles: 0,
      });
    } catch (error) {
      showToast("Failed to add site. Please try again.", "error");
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Name</Label>
            <Input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <Label>Image URL</Label>
            <Input name="image" value={form.image} onChange={handleChange} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea name="notes" value={form.notes} onChange={handleChange} />
          </div>
          <div>
            <Label>Postcode</Label>
            <Input name="postcode" value={form.postcode} onChange={handleChange} />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea name="address" value={form.address} onChange={handleChange} />
          </div>
          <div>
            <Label>Position</Label>
            <Input name="contact_position" value={form.contact_position} onChange={handleChange} />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input name="contact_phone" value={form.contact_phone} onChange={handleChange} />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} />
          </div>
          <div>
            <Label>Radius (meters)</Label>
            <Input type="number" name="radius_m" value={form.radius_m} onChange={handleChange} />
          </div>
          <div>
            <Label>Latitude</Label>
            <Input name="latitude" value={form.latitude} onChange={handleChange} />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input name="longitude" value={form.longitude} onChange={handleChange} />
          </div>
          <div>
            <Label>Number of Allocated Vehicles</Label>
            <Input
              type="number"
              name="number_of_allocated_vehicles"
              value={form.number_of_allocated_vehicles}
              onChange={handleChange}
            />
          </div>
          <GradientButton text="Submit" Icon={Save} width="150px" />
        </form>
      </CardContent>
    </Card>
  );
}