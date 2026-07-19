import { Clock } from "lucide-react";
import { TripOverview, RideFare } from "@/lib/types";
import { convertSecondsToMinutes, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { CarPackageDetails } from "./CarPackageDetails";

interface CarPackageSelectProps {
  trip: TripOverview;
  onPackageSelect: (fare: RideFare) => void;
  setAmount: (amount: number) => void;
  onCancel: () => void;
}

export function CarPackageSelect({
  trip,
  onPackageSelect,
  setAmount,
  onCancel,
}: CarPackageSelectProps) {
  return (
    <div className="flex items-center justify-center p-4 min-h-screen bg-gray-200">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">Select your desired ride</h2>
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-6">
          <Clock className="w-4 h-4 text-black" />
          <span>
            You&apos;ll arrive in{" "}
            <span className="text-black font-semibold">
              {convertSecondsToMinutes(trip.duration)}
            </span>
          </span>
        </div>
        <div className="space-y-4">
          {trip.rideFares.map((fare, idx) => {
            const Icon = CarPackageDetails[fare.packageSlug].icon;
            const price = fare.amount && `₦${fare.amount / 100}`;

            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                  "hover:border-primary hover:bg-primary/5",
                )}
                onClick={() => {
                  onPackageSelect(fare);
                  setAmount(fare.amount);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">{Icon}</div>
                  <div>
                    <h3 className="font-medium">
                      {CarPackageDetails[fare.packageSlug].name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {CarPackageDetails[fare.packageSlug].description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-xl tracking-[-0.015em]">
                    {price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <Button className="w-full h-11 text-base" onClick={onCancel}>
            Back to Map
          </Button>
        </div>
      </div>
    </div>
  );
}
