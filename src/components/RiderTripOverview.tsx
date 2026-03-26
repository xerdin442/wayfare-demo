import { DriverList } from "./DriversList";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { DriverCard } from "./DriverCard";
import { TripEvents } from "@/lib/contracts";
import { TripPreview, Driver, RouteFare, PaymentSession } from "@/lib/types";
import {
  convertSecondsToMinutes,
  convertMetersToKilometers,
} from "@/lib/utils";
import { TripOverviewCard } from "./TripOverviewCard";

interface RiderTripOverviewProps {
  trip: TripPreview | null;
  status: TripEvents | null;
  assignedDriver?: Driver | null;
  paymentSession?: PaymentSession | null;
  onPackageSelect: (carPackage: RouteFare) => void;
  onCancel: () => void;
}

export const RiderTripOverview = ({
  trip,
  status,
  assignedDriver,
  paymentSession,
  onPackageSelect,
  onCancel,
}: RiderTripOverviewProps) => {
  if (!trip || !trip.tripID) {
    return (
      <TripOverviewCard
        title="Start a trip"
        description="Click on the map to set a destination"
      />
    );
  }

  if (status === TripEvents.PaymentSessionCreated && paymentSession) {
    return (
      <TripOverviewCard
        title="Payment Required"
        description="Please complete the payment to confirm your trip"
      >
        <div className="flex flex-col gap-4">
          <DriverCard driver={assignedDriver} />

          <div className="text-sm text-gray-500">
            <p>
              Amount: {paymentSession.amount} {paymentSession.currency}
            </p>
            <p>Trip ID: {paymentSession.tripID}</p>
          </div>

          <Button className="w-full">Payment Button</Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.NoDriversFound) {
    return (
      <TripOverviewCard
        title="No drivers found"
        description="No drivers found for your trip, please try again later"
      >
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Go back
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverAssigned) {
    return (
      <TripOverviewCard
        title="Driver assigned!"
        description="Your driver is on the way, waiting for payment confirmation to show..."
      >
        <div className="flex flex-col space-y-3 justify-center items-center mb-4">
          {/* <p>Driver: {trip.id}</p> */}
        </div>
        <Button variant="destructive" className="w-full" onClick={onCancel}>
          Cancel current trip
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.TripCompleted) {
    return (
      <TripOverviewCard
        title="Trip completed!"
        description="Your trip is completed, thank you for using our service!"
      >
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Go back
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.TripCancelled) {
    return (
      <TripOverviewCard
        title="Trip cancelled!"
        description="Your trip is cancelled, please try again later"
      >
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Go back
        </Button>
      </TripOverviewCard>
    );
  }

  if (!assignedDriver) {
    return (
      <TripOverviewCard
        title="Looking for a driver"
        description="Your trip is confirmed! We're matching you with a driver, it should not take long."
      >
        <div className="flex flex-col space-y-3 justify-center items-center mb-4">
          <Skeleton className="h-31.25 w-62.5 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-62.5" />
            <Skeleton className="h-4 w-50" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          {trip?.duration && (
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Arriving in: {convertSecondsToMinutes(trip?.duration)} at your
              destination ({convertMetersToKilometers(trip?.distance ?? 0)})
            </h3>
          )}

          <Button variant="destructive" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (trip.rideFares && trip.rideFares.length >= 0 && !trip.tripID) {
    return (
      <DriverList
        trip={trip}
        onPackageSelect={onPackageSelect}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Card className="w-full md:max-w-125 z-9999 flex-[0.3]">
      No trip ride fares, please refresh the page
    </Card>
  );
};
