type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show";

const VARIANTS: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  rescheduled: "bg-purple-100 text-purple-800",
  no_show: "bg-gray-100 text-gray-800",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const className = VARIANTS[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className} capitalize`}>
      {status}
    </span>
  );
}
