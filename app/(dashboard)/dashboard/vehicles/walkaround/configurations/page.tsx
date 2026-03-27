"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WalkaroundQuestionScreen from "@/components/walkaround/WalkaroundQuestionScreen";
import WalkaroundCategory from "@/components/walkaround/WalkaroundCategory";

const WalkaroundPage = () => {
    const [activeTab, setActiveTab] = useState("walkaround-questions");

    return (
        <div className="min-h-screen bg-white p-6 relative">
            <div className="mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Vehicle Walkaround Configurations</h1>
                        <p className="text-sm text-gray-500 mb-4">View vehicle walkaround configurations</p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full flex bg-muted h-[50px] px-3 bg-gray-100 rounded-md overflow-hidden mb-4">
                        <TabsTrigger
                            value="walkaround-questions"
                            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
                        >
                            Walkaround Questions
                        </TabsTrigger>
                        <TabsTrigger
                            value="walkaround-category"
                            className="flex-1 justify-center text-gray-500 py-2 rounded-none data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
                        >
                            Walkaround Category
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Walkaround Questions */}
                    <TabsContent value="walkaround-questions">
                        <WalkaroundQuestionScreen />
                    </TabsContent>

                    {/* Tab 2: Walkaround Category */}
                    <TabsContent value="walkaround-category">
                        <WalkaroundCategory />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default WalkaroundPage;
