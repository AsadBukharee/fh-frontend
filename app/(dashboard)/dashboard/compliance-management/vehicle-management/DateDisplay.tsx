import { useState } from "react";


// Date Display Component
interface DateDisplayProps {
  date: string | null;
  compareDate?: string | null;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  isEditable?: boolean;
  showTBC?: boolean;
  fieldType?: string;
  warningDays?: number;
  hoverText?: string;
  showExpiryText?: boolean;
  showBookedText?: boolean;
  isBooking?: boolean;
  isBlackText?: boolean;
  isNextMOTFrom?: boolean;
}
export const shouldShowTBC = (
  value: string | null | undefined,
  fieldType?: string,
): boolean => {
  if (
    !value ||
    value === "TBC" ||
    value === "NA" ||
    value === "null" ||
    value === "null null"
  ) {
    return true;
  }

  // For MOT/PMI booked dates, show TBC if they're empty or invalid
  if (fieldType === "booking" && (!value.trim() || value === "")) {
    return true;
  }

  return false;
};

// Format date helper
export const formatDate = (
  s: string | null | undefined,
  showTBC: boolean = true,
): string => {
  if (shouldShowTBC(s)) {
    return showTBC ? "TBC" : "NA";
  }

  return s ?? (showTBC ? "TBC" : "NA");
};
// Date status utility function
export const getDateStatus = (
  dateString: string | null,
  compareDate?: string | null,
): "green" | "yellow" | "red" | "gray" => {
  if (shouldShowTBC(dateString)) {
    return "gray";
  }

  try {
    let date: Date;

    // Parse UK date format DD/MM/YYYY
    if (dateString && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString!);
    }

    if (isNaN(date.getTime())) return "gray";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // For comparison with another date (e.g., "Book Next From" date)
    if (compareDate && !shouldShowTBC(compareDate)) {
      let compareDateObj: Date;

      // Parse compare date if it's in UK format
      if (compareDate.includes("/")) {
        const parts = compareDate.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          compareDateObj = new Date(year, month, day);
        } else {
          compareDateObj = new Date(compareDate);
        }
      } else {
        compareDateObj = new Date(compareDate);
      }

      compareDateObj.setHours(0, 0, 0, 0);

      const todayTime = today.getTime();
      const targetTime = targetDate.getTime();
      const compareTime = compareDateObj.getTime();

      // If we're past the target date (expired)
      if (targetTime < todayTime) return "red";

      // If today is on or after the "book from" date
      if (todayTime >= compareTime) {
        // And target date is within 7 days
        if (diffDays <= 7) return "yellow";
        // Just reached "book from" date but still >7 days away
        return "green";
      }

      // Not yet at "book from" date
      return "green";
    }

    // Standard expiry logic
    if (diffDays < 0) return "red"; // Expired
    if (diffDays <= 7) return "yellow"; // Within 7 days
    return "green"; // More than 7 days away
  } catch (error) {
    return "gray";
  }
};
const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  compareDate,
  className = "",
  children,
  onClick,
  isEditable = false,
  showTBC = true,
  fieldType,
  warningDays = 60,
  hoverText,
  showExpiryText = true,
  showBookedText = false,
  isBooking = false,
  isBlackText = false,
  isNextMOTFrom = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const shouldShowTBCValue = shouldShowTBC(date, fieldType);

  const getCustomStatus = (): "green" | "yellow" | "red" | "gray" => {
    if (shouldShowTBCValue) return "gray";

    if (!date) return "gray";

    try {
      let dateObj: Date;

      if (date.includes("/")) {
        const parts = date.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }

      if (isNaN(dateObj.getTime())) return "gray";

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDate = new Date(dateObj);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (
        isNextMOTFrom &&
        compareDate &&
        !shouldShowTBC(compareDate, "booking")
      ) {
        return "gray";
      }

      if (fieldType === "mot_expiry") {
        if (diffDays < 0) return "red";
        if (diffDays <= warningDays) return "yellow";
        return "green";
      }

      if (fieldType === "pmi_expiry") {
        if (diffDays < 0) return "red";
        if (diffDays <= 10) return "red";
        return "green";
      }

      if (isBooking || fieldType === "booking") {
        if (diffDays < 0) return "red";
        if (diffDays <= 10) return "red";
        return "green";
      }

      if (fieldType === "insurance_expiry") {
        if (diffDays < 0) return "red";
        if (diffDays <= 60) return "yellow";
        return "green";
      }

      if (fieldType === "tax_expiry") {
        if (diffDays < 0) return "red";
        if (diffDays <= 45) return "yellow";
        return "green";
      }

      return getDateStatus(date, compareDate);
    } catch (error) {
      return "gray";
    }
  };

  const getDisplayText = (): string => {
    if (shouldShowTBCValue) {
      return showTBC ? "TBC" : "NA";
    }

    if (
      isNextMOTFrom &&
      compareDate &&
      !shouldShowTBC(compareDate, "booking")
    ) {
      return "Booked";
    }

    if (!date) return showTBC ? "TBC" : "NA";

    try {
      let dateObj: Date;

      if (date.includes("/")) {
        const parts = date.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }

      if (isNaN(dateObj.getTime())) return date;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDate = new Date(dateObj);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (isBooking || showBookedText) {
        if (diffDays < 0) {
          const daysAgo = Math.abs(diffDays);
          return `Booked - ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
        }

        if (diffDays === 0) {
          return "Booked - Today";
        }

        return `Booked - ${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
      }

      if (showExpiryText) {
        if (diffDays < 0) {
          const daysAgo = Math.abs(diffDays);
          return `Expiry - ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
        }

        if (diffDays === 0) {
          return "Expiry - Today";
        }

        return `Expiry - ${diffDays} day${diffDays !== 1 ? "s" : ""} left`;
      }

      return formatDate(date, false);
    } catch {
      return date;
    }
  };

  const getHoverText = (): string => {
    if (hoverText) return hoverText;

    if (shouldShowTBCValue) return "To be confirmed";

    if (!date) return "No date set";

    try {
      let dateObj: Date;

      if (date.includes("/")) {
        const parts = date.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
        } else {
          dateObj = new Date(date);
        }
      } else {
        dateObj = new Date(date);
      }

      if (isNaN(dateObj.getTime())) return date;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const targetDate = new Date(dateObj);
      targetDate.setHours(0, 0, 0, 0);

      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (fieldType === "mot_expiry") {
        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return "Expires today";
        return `${diffDays} days to expiry`;
      }

      if (fieldType === "pmi_expiry") {
        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return "Expires today";
        return `${diffDays} days to expiry`;
      }

      if (fieldType === "insurance_expiry") {
        if (diffDays < 0) return "Insurance expired";
        if (diffDays <= 5 && diffDays >= 0)
          return `${diffDays} days to insurance expiry`;
        if (diffDays === 0) return "Insurance expires today";
        return `${diffDays} days to insurance expiry`;
      }

      if (fieldType === "tax_expiry") {
        if (diffDays < 0) return "Tax expired";
        if (diffDays <= 5 && diffDays >= 0)
          return `${diffDays} days to tax expiry`;
        if (diffDays === 0) return "Tax expires today";
        return `${diffDays} days to tax expiry`;
      }

      if (isBooking || fieldType === "booking") {
        if (diffDays < 0) return "Check overdue";
        if (diffDays <= 3 && diffDays >= 0)
          return `${diffDays} days left to next check`;
        if (diffDays === 0) return "Check due today";
        return `${diffDays} days left to next check`;
      }

      return formatDate(date, false);
    } catch {
      return date;
    }
  };

  const finalStatus = getCustomStatus();

  const statusClasses = {
    green: "text-green-700 bg-green-50 hover:bg-green-100",
    yellow: "text-yellow-700 bg-yellow-50 hover:bg-yellow-100",
    red: "text-red-700 bg-red-50 hover:bg-red-100",
    gray: "text-gray-500 bg-gray-50 hover:bg-gray-100",
  };

  const blackTextClass = "text-gray-900 bg-gray-50 hover:bg-gray-100";

  let displayText: React.ReactNode = children;
  if (!children) {
    displayText = getDisplayText();
  }

  return (
    <div
      className={`px-3 py-4 text-sm rounded min-h-[44px] flex items-center whitespace-nowrap transition-colors ${isEditable ? "cursor-pointer" : "cursor-default"
        } ${isBlackText ? blackTextClass : statusClasses[finalStatus]} ${className}`}
      onClick={isEditable ? onClick : undefined}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      title={
        isHovering ? getHoverText() : isEditable ? "Double-click to edit" : ""
      }
    >
      {displayText}
    </div>
  );
};
export default DateDisplay;
