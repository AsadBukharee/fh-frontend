"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Users, Droplets, Warehouse } from "lucide-react"
import AddAdBlueTopup from "./AddAdBlueTopup"

const dummyData = [
    {
        date: "19/02/2026",
        vehicle: "LPO-123",
        odometer: "7874 MPH",
        qty: 3,
        refiller: "John Smith",
        batch: "4219600",
        remaining: "15 L",
    },
    {
        date: "19/02/2026",
        vehicle: "LPO-123",
        odometer: "6594 KMS",
        qty: 13,
        refiller: "David Joe",
        batch: "4219600",
        remaining: "15 L",
    },
    {
        date: "19/02/2026",
        vehicle: "LPO-123",
        odometer: "7874 MPH",
        qty: 10,
        refiller: "Parker Will",
        batch: "4219600",
        remaining: "15 L",
    },
]

export default function AdBluePage() {
    return (
        <div className="min-h-screen bg-white p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-semibold">AdBlue Tracker</h1>
                    <p className="text-sm text-gray-500">
                        Fleet AdBlue Management System
                    </p>
                </div>

                <AddAdBlueTopup />
            </div>

            {/* Filters */}
            <Card className="mb-6 rounded-xl shadow-sm">
                <CardContent className="p-6 grid grid-cols-6 gap-4">
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="All Vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">LPO-123</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="All Refillers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">John</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input type="date" defaultValue="2023-11-01" />
                    <Input type="date" defaultValue="2023-11-01" />

                    <Input placeholder="Search Batch/Invoice No" />

                    <Button className="bg-orange-100 text-orange-600 hover:bg-orange-200">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                <Card className="rounded-xl shadow-sm">
                    <CardContent className="flex justify-between items-center p-6">
                        <div>
                            <p className="text-sm text-gray-500">Total Records</p>
                            <p className="text-2xl font-semibold text-orange-500">3</p>
                        </div>
                        <Users className="text-gray-400" />
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent className="flex justify-between items-center p-6">
                        <div>
                            <p className="text-sm text-gray-500">Total Litres Used</p>
                            <p className="text-2xl font-semibold text-pink-600">16L</p>
                        </div>
                        <Droplets className="text-gray-400" />
                    </CardContent>
                </Card>

                <Card className="rounded-xl shadow-sm">
                    <CardContent className="flex justify-between items-center p-6">
                        <div>
                            <p className="text-sm text-gray-500">Current Stock</p>
                            <p className="text-2xl font-semibold text-pink-600">15L</p>
                        </div>
                        <Warehouse className="text-gray-400" />
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="rounded-xl shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Vehicle Reg</TableHead>
                                <TableHead>Odometer</TableHead>
                                <TableHead>Qty Added L</TableHead>
                                <TableHead>Refiller</TableHead>
                                <TableHead>Batch/Invoice #</TableHead>
                                <TableHead>Remaining L</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {dummyData.map((item, index) => (
                                <TableRow key={index} className="hover:bg-gray-50">
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.vehicle}</TableCell>

                                    <TableCell>
                                        <Badge className="bg-orange-100 text-orange-600">
                                            {item.odometer}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>{item.qty}</TableCell>
                                    <TableCell>{item.refiller}</TableCell>

                                    <TableCell>
                                        <Badge className="bg-orange-100 text-orange-600">
                                            {item.batch}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>
                                        <Badge className="bg-green-100 text-green-600">
                                            {item.remaining}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-gray-500">
                                        Lorem Ipsum...
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4 border-t bg-gray-50 text-sm">
                        <div className="flex items-center gap-2">
                            Row Per Page
                            <Select defaultValue="10">
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost">Previous</Button>
                            <Button className="bg-orange-500 text-white h-8 w-8 p-0">
                                1
                            </Button>
                            <Button variant="ghost">2</Button>
                            <Button variant="ghost">3</Button>
                            <span>...</span>
                            <Button variant="ghost">68</Button>
                            <Button variant="ghost">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}