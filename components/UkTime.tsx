import { useEffect, useState } from "react";

// Simple component to show current UK time (London timezone)
export default function UkTime() {
  const getUkTime = () =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Europe/London",
    });

  const [time, setTime] = useState<string>(getUkTime);

  useEffect(() => {
    const interval = setInterval(() => setTime(getUkTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-3 py-1 min-w-[100px] rounded bg-gray-100 text-gray-800 text-md mx-2 text-center" style={{ fontVariantNumeric: "tabular-nums" }}>
      {time}
    </div>
  );
}
