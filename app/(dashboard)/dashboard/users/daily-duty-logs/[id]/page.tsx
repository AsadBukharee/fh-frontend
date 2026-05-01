"use client"; // ← very important!

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // ← Next.js 13+ App Router

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CalendarDays, AlertCircle, CheckCircle2, Hourglass, Clock3 } from 'lucide-react';

import Incomplete from '@/components/daily-duty/tabs/Incomplete';
import Waiting from '@/components/daily-duty/tabs/Waiting';
import Current from '@/components/daily-duty/tabs/Current';
import Complete from '@/components/daily-duty/tabs/Complete';

const TAB_VALUES = {
  current: "current",
  incomplete: "incomplete",
  "awaiting": "waiting",
  "historical-complete": "complete",
  // you can add more aliases if you want
  "historical-incomplete": "incomplete", // ← support your example URL
} as const;

type TabValue = keyof typeof TAB_VALUES;

export default function DailyLogsPage() {
  const searchParams = useSearchParams();
  const paramTab = searchParams.get("tab");
  const Username=searchParams.get("name")

  // Map URL param → valid tab value (with fallback)
  const initialTab = paramTab 
    ? (TAB_VALUES[paramTab as TabValue] ?? TAB_VALUES.current)
    : TAB_VALUES.current;

  const router = useRouter();
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Logs - {Username && Username}</h1>
      
        </div>
       
      </div>

      <Tabs 
        value={initialTab} 
        onValueChange={handleTabChange} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Current Week
          </TabsTrigger>
          <TabsTrigger value="incomplete" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Incomplete (2)
          </TabsTrigger>
          <TabsTrigger value="waiting" className="gap-2">
            <Hourglass className="h-4 w-4" />
            Waiting
          </TabsTrigger>
          <TabsTrigger value="complete" className="gap-2">
            <Clock className="h-4 w-4" />
            Complete
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Current />
        </TabsContent>

        <TabsContent value="incomplete">
          <Incomplete />
        </TabsContent>

        <TabsContent value="waiting">
          <Waiting />
        </TabsContent>

        <TabsContent value="complete">
          <Complete/>
        </TabsContent>
      </Tabs>
    </div>
  );
}