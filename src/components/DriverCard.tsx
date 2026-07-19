import Image from "next/image";
import { Driver, DriverTier } from "@/lib/types";
import { CarPackageDetails } from "./CarPackageDetails";
import { Star, CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriverCardProps {
  driver?: Driver | null;
}

const tierConfig: Record<DriverTier, { label: string; className: string }> = {
  [DriverTier.BRONZE]: {
    label: "Bronze",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [DriverTier.SILVER]: {
    label: "Silver",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  [DriverTier.GOLD]: {
    label: "Gold",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
};

export const DriverCard = ({ driver }: DriverCardProps) => {
  if (!driver) return null;

  const tier = tierConfig[driver.tier] ?? tierConfig[DriverTier.BRONZE];
  const packageInfo = CarPackageDetails[driver.packageSlug];

  return (
    <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Image
          className="rounded-full shrink-0 object-cover border-2 border-white shadow-sm"
          src={driver.profilePicture}
          alt={driver.name}
          width={48}
          height={48}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {driver.name}
            </p>
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0",
                tier.className,
              )}
            >
              {tier.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-700">
                {driver.currentRating.toFixed(1)}
              </span>
            </div>
            <span>{driver.totalCompletedTrips} trips</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 shrink-0">
          <CarFront className="w-4 h-4 text-gray-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-700">
            {driver.carModel} &middot; {driver.carColor}
          </p>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-mono mt-0.5">
            {driver.carPlate}
          </p>
        </div>
        {packageInfo && (
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-white rounded-md px-2 py-1 border border-gray-200 ml-auto shrink-0">
            {packageInfo.icon}
            <span>{packageInfo.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
