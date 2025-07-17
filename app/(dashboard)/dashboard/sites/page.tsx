"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import GradientButton from "@/app/utils/GradientButton";
import {  MoveUpRight, Plus } from "lucide-react";

const shifts = ["Early", "Middle", "Night"];

export default function SiteGrid() {
  const sites = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    name: "Loreum ipsum dummy",
    image: "/5aa1c19d-292a-4f38-9b53-2de4ce0c9bbd.png",
    description: "Loreum ipsum dummy Loreum ipsum dummy Loreum ipsum dummy...",
    badgeCount: 5,
  }));

  return (
    <section className="p-8 h-screen bg-white">
     <div className=" flex justify-between items-center mb-5">
     <div className="">
        <h1 className="text-2xl font-bold">Sites</h1>
        <p className="text-sm text-muted-foreground mb-6">See sites list</p>
      </div>
      <div className="flex justify-end">
        <GradientButton
        text="Add Site"
        Icon={Plus}
        />
      </div>
     </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {sites.map((site) => (
          <Card key={site.id} className="flex flex-col shadow-md justify-between h-full">
            <div className="relative w-full h-36 rounded-t-lg overflow-hidden">
              <Image src={site.image} alt="Bus" fill className="object-cover" />
              <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {site.badgeCount}
              </div>
            </div>

            <CardContent className="space-y-2 p-4 flex flex-col flex-grow">
              <h2 className="text-sm font-semibold">{site.name}</h2>

              <div className="flex flex-wrap gap-2 text-xs">
                {shifts.map((shift) => (
                  <Badge
                    key={shift}
                    className={
                      shift === "Early"
                        ? "bg-yellow-100 text-yellow-800"
                        : shift === "Middle"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-purple-100 text-purple-800"
                    }
                  >
                    {shift}
                  </Badge>
                ))}
              </div>

              <p className="text-xs text-muted-foreground line-clamp-3">
                {site.description} <span className="text-red-500 font-semibold cursor-pointer">See More</span>
              </p>
            </CardContent>

            <CardFooter className="p-4 pt-0">
             <GradientButton
             text="More Details"
             Icon={MoveUpRight}
             width="100%"
             />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
