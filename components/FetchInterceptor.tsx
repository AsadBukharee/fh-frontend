"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, XCircle, Terminal } from "lucide-react";

export default function FetchInterceptor() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorData, setErrorData] = useState<any>(null);

  useEffect(() => {
    const { fetch: originalFetch } = window;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 403) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          console.error("API 403 Error:", data);

          setErrorData(data);
          setIsOpen(true);

          // Still show a toast as a secondary notification
          toast.error("Permission Denied", {
            description: "You do not have permission to perform this action.",
          });
        } catch (e) {
          console.error("API 403 Error (could not parse JSON)");
          setErrorData({ detail: "You do not have permission to perform this action." });
          setIsOpen(true);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-white">
        <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500 w-full" />

        <div className="p-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-pulse">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Access Restricted
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base max-w-[320px]">
              You don&apos;t have the required permissions to perform this action. Please contact your administrator.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 group transition-all hover:bg-gray-100/50">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Error Detail</span>
              </div>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">
                {errorData?.detail || "You do not have permission to perform this action."}
              </p>
            </div>


          </div>

          <DialogFooter className="mt-8 sm:justify-center">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-[200px] h-12 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              Understand
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
