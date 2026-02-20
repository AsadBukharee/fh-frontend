"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Loader2, Plus, User, FileText, Lock, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePickerField } from "@/components/ui/DatePicker" // Adjust import path if needed

const formSchema = z.object({
    date: z.date({
        message: "Date is required",
    }),
    odometer: z.string().min(1, "Odometer is required"),
    quantity: z.string().min(1, "Quantity is required"), // Keeping as string for input, verify number later
    vehicle: z.string().min(1, "Vehicle is required"),
    batch: z.string().min(1, "Batch/Invoice # is required"),
    refiller: z.string().min(1, "Refiller is required"),
    notes: z.string().optional(),
})

export default function AddAdBlueTopup() {
    const [open, setOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            odometer: "",
            quantity: "",
            notes: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("Form submitted:", values)
        // Simulate API call
        setTimeout(() => {
            setOpen(false)
            form.reset()
        }, 500)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Add AdBlue Topup
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Add AdBlue Topup</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <DatePickerField
                                            label="Date"
                                            value={field.value ? field.value.toISOString() : undefined}
                                            onDateSelected={(date) => field.onChange(date)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Odometer */}
                        <FormField
                            control={form.control}
                            name="odometer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Odometer <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="e.g 7645 KMS" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Quantity */}
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity Added Liters <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" placeholder="0" className="pl-9" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Vehicle Registration */}
                        <FormField
                            control={form.control}
                            name="vehicle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vehicle Registration</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                {/* Using a wrapper or just SelectTrigger with icon if possible, but SelectTrigger is strict. 
                                                     We can put the icon inside SelectTrigger if we customize it, or just use the Select as is.
                                                     The mocked design shows a building icon. 
                                                 */}
                                                <SelectTrigger className="pl-9 relative">
                                                    <Building2 className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectValue placeholder="Select vehicle" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="LPO-123">LPO-123</SelectItem>
                                            <SelectItem value="LPO-124">LPO-124</SelectItem>
                                            <SelectItem value="LPO-125">LPO-125</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Batch/Invoice # */}
                        <FormField
                            control={form.control}
                            name="batch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Batch/Invoice # <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <SelectTrigger className="pl-9 relative">
                                                    <Building2 className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectValue placeholder="Select Batch" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="4219600">4219600</SelectItem>
                                            <SelectItem value="4219601">4219601</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Refillers */}
                        <FormField
                            control={form.control}
                            name="refiller"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Refillers <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <div className="relative">
                                                <SelectTrigger className="pl-9 relative">
                                                    <User className="absolute left-3 top-2.5 z-10 h-4 w-4 text-muted-foreground z-10" />
                                                    <SelectValue placeholder="Select Refillers" />
                                                </SelectTrigger>
                                            </div>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="John Smith">John Smith</SelectItem>
                                            <SelectItem value="David Joe">David Joe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Optional Notes"
                                            className="resize-none min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-2 pt-4">
                            <Button type="submit" className="w-full bg-orange-200 hover:bg-orange-300 text-orange-700 font-semibold" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                                Add TopUp Record
                            </Button>
                            <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
