export type BadgeVariant =
  | "green"
  | "blue"
  | "gray"
  | "orange"
  | "red"
  | "purple"
  | "cyan"
  | "teal";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  blue:   "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  gray:   "bg-gray-100   text-gray-700   dark:bg-gray-700/40   dark:text-gray-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  red:    "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  cyan:   "bg-cyan-100   text-cyan-800   dark:bg-cyan-900/30   dark:text-cyan-400",
  teal:   "bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-400",
};

// Map DNS record types to badge colours
export const RECORD_TYPE_COLORS: Record<string, BadgeVariant> = {
  A:     "blue",
  AAAA:  "purple",
  CNAME: "teal",
  TXT:   "gray",
  MX:    "orange",
  NS:    "cyan",
  PTR:   "gray",
  SRV:   "green",
  CAA:   "red",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        text-xs font-semibold rounded-full leading-none
        ${BADGE_STYLES[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
