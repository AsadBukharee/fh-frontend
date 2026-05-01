import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

describe("components/ui/form", () => {
  it("renders validation error message and aria-invalid when an error is present", async () => {
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
    });

    function TestForm() {
      const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { name: "" },
      });

      React.useEffect(() => {
        // Deterministically test the error rendering behavior without relying on
        // React Hook Form's async submit/validation promise mechanics.
        form.setError("name", { type: "manual", message: "Name is required" });
      }, [form]);

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <input aria-label="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button type="button">No-op</button>
          </form>
        </Form>
      );
    }

    render(<TestForm />);

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});

