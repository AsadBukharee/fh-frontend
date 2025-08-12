import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Eye, Info, MoreHorizontal, RefreshCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const page = () => {
  const maintenanceData = [
    // Compliance & Legal
    {
      category: "Compliance & Legal",
      items: [
        {
          checkType: "MOT",
          status: "Upcoming",
          statusColor: "bg-orange-100 text-orange-700",
          vehicleNo: "GN4-7N",
          progress: 85,
          progressColor: "bg-purple-600",
          timeframe: "203 Days",
          dueDate: "Due 17/01/2025",
          priority: "Normal",
          priorityColor: "bg-orange-100 text-orange-700",
          ActionText: "Review",
        },
        {
          checkType: "Registration",
          status: "Due Next",
          statusColor: "bg-red-100 text-red-700",
          vehicleNo: "GN4-7N",
          progress: 95,
          progressColor: "bg-purple-600",
          timeframe: "17 Days",
          dueDate: "Due 6/01/2025",
          priority: "High",
          priorityColor: "bg-red-100 text-red-700",
          ActionText: "Review",
        },
        {
          checkType: "Vehicle Excise",
          status: "Overdue (Awaiting for 6 days)",
          statusColor: "bg-red-100 text-red-700",
          vehicleNo: "GN4-7N",
          progress: 100,
          progressColor: "bg-red-600",
          timeframe: "6 days ago",
          dueDate: "Due 17/01/2025",
          priority: "High",
          priorityColor: "bg-red-100 text-red-700",
          ActionText: "Review",
        },
        {
          checkType: "Vehicle Insurance",
          status: "Upcoming",
          statusColor: "bg-orange-100 text-orange-700",
          vehicleNo: "GN4-7N",
          progress: 75,
          progressColor: "bg-purple-600",
          timeframe: "127 Days",
          dueDate: "Due 6/01/2025",
          priority: "Normal",
          priorityColor: "bg-orange-100 text-orange-700",
          ActionText: "Book",
        },
      ],
    },
    // Maintenance
    {
      category: "Maintenance",
      items: [
        {
          checkType: "Tire Maintenance",
          status: "Due Next",
          statusColor: "bg-red-100 text-red-700",
          vehicleNo: "GN4-7N",
          progress: 90,
          progressColor: "bg-purple-600",
          timeframe: "17 Days",
          dueDate: "Due 6/01/2025",
          priority: "High",
          priorityColor: "bg-red-100 text-red-700",
          ActionText: "Review",
        },
        {
          checkType: "Engine Service",
          status: "Booked",
          statusColor: "bg-blue-100 text-blue-700",
          vehicleNo: "GN4-7N",
          progress: 60,
          progressColor: "bg-blue-600",
          timeframe: "30 Days",
          dueDate: "Booked 16/01/2025",
          priority: "Medium",
          priorityColor: "bg-green-100 text-green-700",
          ActionText: "Complete",
        },
        {
          checkType: "Tachograph Calibration",
          status: "Booked",
          statusColor: "bg-blue-100 text-blue-700",
          vehicleNo: "GN4-7N",
          progress: 60,
          progressColor: "bg-blue-600",
          timeframe: "30 Days",
          dueDate: "Booked 16/01/2025",
          priority: "Medium",
          priorityColor: "bg-green-100 text-green-700",
          ActionText: "Complete",
        },
        {
          checkType: "Labor Test",
          status: "Booked",
          statusColor: "bg-green-100 text-green-700",
          vehicleNo: "GN4-7N",
          progress: 45,
          progressColor: "bg-green-600",
          timeframe: "60 Days",
          dueDate: "Booked 16/01/2025",
          priority: "Low",
          priorityColor: "bg-green-100 text-green-700",
          ActionText: "Complete",
        },
        {
          checkType: "Annual Service",
          status: "Overdue (Awaiting for 6 days)",
          statusColor: "bg-red-100 text-red-700",
          vehicleNo: "GN4-7N",
          progress: 100,
          progressColor: "bg-red-600",
          timeframe: "6 days ago",
          dueDate: "Due 17/01/2025",
          priority: "High",
          priorityColor: "bg-red-100 text-red-700",
          ActionText: "Review",
        },
      ],
    },
    // Open & Renewals
    {
      category: "Open & Renewals",
      items: [
        {
          checkType: "Vehicle Tachograph",
          status: "Due Next",
          statusColor: "bg-red-100 text-red-700",
          vehicleNo: "GN4-7N",
          progress: 85,
          progressColor: "bg-purple-600",
          timeframe: "2 Days",
          dueDate: "Due 17/01/2025",
          priority: "High",
          priorityColor: "bg-red-100 text-red-700",
          ActionText: "Review",
        },
      ],
    },
  ];

  const geticon = (color: string, text: string) => {
    if (text === "Review") {
      return RefreshCcw;
    } else {
      return Info;
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Vehicle Maintenance & Compliance Overview
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Table Header */}
          <div className="grid grid-cols-7 mb-2 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            <div>Check Type</div>
            <div>Status</div>
            <div>Vehicle No.</div>
            <div>Progress</div>
            <div>Shedule</div>
            <div>Details</div>
            <div>Actions</div>
          </div>

          {/* Table Content */}
          <div className="divide-y divide-gray-200">
            {maintenanceData.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Category Header */}
                <div className="p-4 bg-purple-50 ">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-purple-900 rounded-sm"></div>
                    <span className="font-medium w-[200px] text-purple-900">
                      {section.category}
                    </span>
                    <div className="w-full h-1 bg-gray-300 rounded-sm"></div>
                  </div>
                </div>

                {/* Category Items */}
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-gray-50"
                  >
                    {/* Check Type */}
                    <div className="font-medium text-sm text-gray-900">
                      {item.checkType}
                    </div>

                    {/* Status */}
                    <div>
                      <Badge
                        className={`${item.statusColor} text-xs border-0 font-medium`}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {/* Vehicle No */}
                    <div className=" text-sm text-gray-700">{item.vehicleNo}</div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Progress
                          value={item.progress}
                          className="h-2"
                          bgcolor={item.progressColor}
                        />
                      </div>
                      <span className="text-xs text-gray-600 min-w-[60px]">
                        {item.timeframe}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className="text-sm text-gray-700">{item.dueDate}</div>

                    {/* Priority */}
                    <div className="flex justify-center items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-gray-600" size={20} />
                          </TooltipTrigger>
                          <TooltipContent className={item.priorityColor}>
                            <p className={`${item.priorityColor}`}>
                              {item.priority}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                
                        size="sm"
                        className={`h-fit w-fit py-1 px-2 ${item.priorityColor}`}
                      >
                        {(() => {
                          const Icon = geticon(
                            item.priorityColor,
                            item.ActionText
                          );
                          return <Icon size={16} className="mr-1" />;
                        })()}
                        {item.ActionText}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
