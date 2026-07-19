import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface TripOverviewCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "error" | "success" | "warning";
}

const variantStyles: Record<string, { iconBg: string; iconColor: string }> = {
  error: { iconBg: "bg-red-50", iconColor: "text-red-600" },
  success: { iconBg: "bg-green-50", iconColor: "text-green-600" },
  warning: { iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  default: { iconBg: "bg-gray-100", iconColor: "text-gray-600" },
};

export const TripOverviewCard = ({
  title,
  description,
  children,
  icon: Icon,
  variant = "default",
}: TripOverviewCardProps) => {
  const { iconBg, iconColor } = variantStyles[variant];

  return (
    <div className="w-full h-full md:min-h-screen flex flex-col bg-white border-l border-gray-100">
      <div className="flex-1 flex flex-col px-6 pt-8 gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-md shrink-0",
                iconBg,
              )}
            >
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 leading-tight">
              {title}
            </h3>
            <p className="text-[0.9375rem] text-gray-500 mt-1.5">
              {description}
            </p>
          </div>
        </div>

        {children && <div className="flex-1">{children}</div>}
      </div>
    </div>
  );
};
