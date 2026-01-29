export function formatToDDMMYYYY(
  value: unknown,
  fallback: string = "--/--/----"
): string {
  if (!value) return fallback;

  let date: Date;

  // Already a Date
  if (value instanceof Date) {
    date = value;
  }
  // Timestamp (number or numeric string)
  else if (
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value))
  ) {
    date = new Date(Number(value));
  }
  // ISO / date string
  else if (typeof value === "string") {
    // Check for DD/MM/YYYY format
    const dmyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const [_, d, m, y] = dmyMatch;
      date = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      date = new Date(value);
    }
  } else {
    return fallback;
  }

  if (isNaN(date.getTime())) return fallback;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}
