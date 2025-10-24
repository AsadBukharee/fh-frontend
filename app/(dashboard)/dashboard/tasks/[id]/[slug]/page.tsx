'use client'
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";

const Page = () => {
  const tasks = [
    { type: 'PMI', description: 'Complete vehicle inspection for fleet', priority: 'High', assignedBy: 'Jenny Wilson', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'In Progress', notes: 'Dummy text' },
    { type: 'MOT', description: 'Complete vehicle inspection for fleet', priority: 'Medium', assignedBy: 'Harry Porter', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'Not Viewed', notes: 'Dummy text' },
    { type: 'Tyre Checks', description: 'Complete vehicle inspection for fleet', priority: 'High', assignedBy: 'John Wick', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'Viewed', notes: 'Dummy text' },
    { type: 'PMI', description: 'Complete vehicle inspection for fleet', priority: 'Low', assignedBy: 'Irman Khan', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'In Progress', notes: 'Dummy text' },
    { type: 'Driver Codes', description: 'Complete vehicle inspection for fleet', priority: 'High', assignedBy: 'Petter David', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'In Progress', notes: 'Dummy text' },
    { type: 'Driver Document', description: 'Complete vehicle inspection for fleet', priority: 'Medium', assignedBy: 'Raja Rumaan', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'Viewed', notes: 'Dummy text' },
    { type: 'Invoicing', description: 'Complete vehicle inspection for fleet', priority: 'Medium', assignedBy: 'Asad Naqi', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'Viewed', notes: 'Dummy text' },
    { type: 'Dispatch Order', description: 'Complete vehicle inspection for fleet', priority: 'High', assignedBy: 'Hassan Shah', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'Not Viewed', notes: 'Dummy text' },
    { type: 'Delivery Order', description: 'Complete vehicle inspection for fleet', priority: 'Low', assignedBy: 'Shoaib Khan', dateAssigned: '10/23/2025', deadLine: '10/29/2025', status: 'Not Viewed', notes: 'Dummy text' },
  ];

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold">Task Management</h2>
      <p className="text-muted-foreground">View, filter, and manage tasks across all types and priorities</p>
      <div className="flex gap-4 mt-4 mb-6">
        <Input placeholder="Search tasks, types, assignees..." className="max-w-sm" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="not-viewed">Not Viewed</SelectItem>
          </SelectContent>
        </Select>
        <Button className="ml-auto bg-orange-500 hover:bg-orange-600">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Task
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned by</TableHead>
            <TableHead>Date Assigned</TableHead>
            <TableHead>Dead Line</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Reassign Task</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task, index) => (
            <TableRow key={index}>
              <TableCell>{task.type}</TableCell>
              <TableCell>{task.description}</TableCell>
              <TableCell>{task.priority}</TableCell>
              <TableCell>{task.assignedBy}</TableCell>
              <TableCell>{task.dateAssigned}</TableCell>
              <TableCell>{task.deadLine}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    task.status === 'In Progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : task.status === 'Viewed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {task.status}
                </span>
              </TableCell>
              <TableCell>{task.notes}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">Select Opt...</Button>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Page;