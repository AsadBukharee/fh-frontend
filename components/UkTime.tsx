import { useEffect, useState } from "react";

// Simple component to show current UK time (London timezone)
export default function UkTime() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      // UK time zone is Europe/London
      const ukTime = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Europe/London",
      });
      setTime(ukTime);
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-3 py-1 rounded bg-gray-100 text-gray-800 text-md mx-2">
      {time}
    </div>
  );
}
