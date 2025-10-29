"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import ExportButton from "@/app/utils/ExportButton";
import { Badge } from "@/components/ui/badge";

const Page = () => {
  const users = [
    {
      id: 1,
      name: "Jenny Wilson",
      permissions: {
        shoaibAli: ["view", "edit"],
        hassanShah: null,
        mahadShah: ["view"],
        rajaUsman: ["view"],
        asadShah: ["view"],
      },
    },
    {
      id: 2,
      name: "Harry Porter",
      permissions: {
        shoaibAli: ["view", "edit"],
        hassanShah: ["view"],
        mahadShah: null,
        rajaUsman: ["edit"],
        asadShah: null,
      },
    },
    {
      id: 3,
      name: "John Wick",
      permissions: {
        shoaibAli: null,
        hassanShah: ["view", "edit"],
        mahadShah: ["edit"],
        rajaUsman: ["edit"],
        asadShah: ["delete"],
      },
    },
    {
      id: 4,
      name: "Imran Khan",
      permissions: {
        shoaibAli: ["edit"],
        hassanShah: ["delete"],
        mahadShah: ["view", "edit", "delete"],
        rajaUsman: ["edit"],
        asadShah: ["edit"],
      },
    },
    {
      id: 5,
      name: "Petter David",
      permissions: {
        shoaibAli: ["edit"],
        hassanShah: ["edit"],
        mahadShah: ["edit"],
        rajaUsman: ["delete"],
        asadShah: ["edit"],
      },
    },
    {
      id: 6,
      name: "Raja Usman",
      permissions: {
        shoaibAli: ["delete"],
        hassanShah: ["edit"],
        mahadShah: ["view"],
        rajaUsman: ["view", "edit", "delete"],
        asadShah: ["view"],
      },
    },
    {
      id: 7,
      name: "Asad Naqvi",
      permissions: {
        shoaibAli: ["delete"],
        hassanShah: ["delete"],
        mahadShah: ["edit"],
        rajaUsman: null,
        asadShah: ["edit"],
      },
    },
    {
      id: 8,
      name: "Hassan Shah",
      permissions: {
        shoaibAli: ["view"],
        hassanShah: ["view"],
        mahadShah: ["delete"],
        rajaUsman: ["view"],
        asadShah: ["delete"],
      },
    },
    {
      id: 9,
      name: "Shoaib Khan",
      permissions: {
        shoaibAli: ["view"],
        hassanShah: ["view"],
        mahadShah: ["view"],
        rajaUsman: ["view"],
        asadShah: ["view"],
      },
    },
  ];

  const renderPermissionIcons = (permissions: any[] | null) => {
    if (!permissions)
      return <span className="text-muted-foreground">None</span>;
    return permissions.map((perm: React.Key | null | undefined) => {
      switch (perm) {
        case "view":
          return (
            <Badge
              key={perm}
              className="bg-green-100 mr-1 py-2 cursor-pointer  text-green-800 "
            >
              {" "}
              <Eye size={14} className=" text-green-600 inline-block " />{" "}
            </Badge>
          );
        case "edit":
          return (
            <Badge
              key={perm}
              className="bg-blue-100 py-2 mr-1 cursor-pointer text-blue-800 "
            >
              {" "}
              <Pencil size={14} className=" text-blue-600 inline-block " />{" "}
            </Badge>
          );
        case "delete":
          return (
            <Badge
              key={perm}
              className="bg-red-100 py-2 mr-1 cursor-pointer text-red-800 "
            >
              {" "}
              <Trash2 size={14} className=" text-red-600 inline-block " />{" "}
            </Badge>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="container mx-auto bg-white p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="">
          <h2 className="text-2xl font-bold">
            Task List View/Edit Permissions{" "}
          </h2>
          <span className="text-sm text-muted-foreground">
            Other Permissions Allowed
          </span>
        </div>
        <ExportButton data={users} fileName="task_list_users" />
      </div>
      <div className="mb-4 w-[300px] relative">
        <Search
          className="w-4 h-4 z-10 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 "
          aria-hidden="true"
        />
        <Input
          // ref={inputRef}
          placeholder="Search"
          className="pl-10 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          // value={searchTerm}
          // onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          // onKeyDown={handleKeyDown}
          aria-label="Search menu items"
          autoComplete="off"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Shoaib Ali</TableHead>
            <TableHead>Hassan Shah</TableHead>
            <TableHead>Mahad Shah</TableHead>
            <TableHead>Raja Usman</TableHead>
            <TableHead>Asad Shah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                {renderPermissionIcons(user.permissions.shoaibAli)}
              </TableCell>
              <TableCell>
                {renderPermissionIcons(user.permissions.hassanShah)}
              </TableCell>
              <TableCell>
                {renderPermissionIcons(user.permissions.mahadShah)}
              </TableCell>
              <TableCell>
                {renderPermissionIcons(user.permissions.rajaUsman)}
              </TableCell>
              <TableCell>
                {renderPermissionIcons(user.permissions.asadShah)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <span className="text-muted-foreground">Row Page 01 &gt;</span>
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <span className="text-muted-foreground">...</span>
          <Button variant="outline" size="sm">
            67
          </Button>
          <Button variant="outline" size="sm">
            68
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
