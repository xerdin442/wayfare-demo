import { TripEvents } from "@/lib/contracts/websocket";
import { Trip } from "@/lib/types";
import { Button } from "./ui/button";
import { TripOverviewCard } from "./TripOverviewCard";
import { DriverTripActionRequest } from "@/lib/contracts/websocket";
import { convertSecondsToMinutes } from "@/lib/utils";

interface DriverTripOverviewProps {
  trip?: Trip | null;
  status?: TripEvents | null;
  handleTripAction: (
    action: DriverTripActionRequest["type"],
    request?: boolean,
  ) => void;
  onReset: () => void;
}

export const DriverTripOverview = ({
  trip,
  status,
  handleTripAction,
  onReset,
}: DriverTripOverviewProps) => {
  if (!trip) {
    return (
      <TripOverviewCard
        title="Waiting for a rider..."
        description="Waiting for a rider to request a trip..."
      />
    );
  }

  if (status === TripEvents.DriverTripRequest) {
    return (
      <TripOverviewCard
        title="Trip request received!"
        description="A trip has been requested, check the route and accept the trip if you can take it."
      >
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleTripAction(TripEvents.DriverTripAccept, true)}
          >
            Accept trip
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleTripAction(TripEvents.DriverTripDecline, true)}
          >
            Decline trip
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.TripCompleted) {
    return (
      <TripOverviewCard
        title="Trip completed!"
        description="The trip has been ended"
      >
        <Button onClick={onReset}>Go back</Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.CashOptionPreferred) {
    return (
      <TripOverviewCard
        title="Payment notice"
        description="The rider prefers cash payment, please confirm receipt of payment"
      >
        <Button
          onClick={() => handleTripAction(TripEvents.CashPaymentReceived)}
        >
          Confirm
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverEndTrip) {
    return (
      <TripOverviewCard
        title="Awaiting payment"
        description="Please wait while we confirm rider's payment"
      ></TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverStartTrip) {
    return (
      <TripOverviewCard
        title="Trip started!"
        description={`You'll arrive at your destination in ${convertSecondsToMinutes(trip.selectedFare.route.duration)}`}
      >
        <Button onClick={() => handleTripAction(TripEvents.DriverEndTrip)}>
          End trip
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverConfirmPickup) {
    return (
      <TripOverviewCard
        title="All set!"
        description="You can start the trip now"
      >
        <Button onClick={() => handleTripAction(TripEvents.DriverStartTrip)}>
          Start trip
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverTripAccept) {
    return (
      <TripOverviewCard
        title="Almost there!"
        description="The rider is waiting for you, proceed to pick them up"
      >
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleTripAction(TripEvents.DriverConfirmPickup)}
          >
            Confirm pickup
          </Button>

          <Button onClick={() => handleTripAction(TripEvents.TripCancelled)}>
            Cancel trip
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (
    status === TripEvents.TripCancelled ||
    status === TripEvents.TripAborted
  ) {
    return (
      <TripOverviewCard
        title="Trip cancelled!"
        description="The trip has been cancelled by the rider"
      >
        <Button onClick={onReset}>Go back</Button>
      </TripOverviewCard>
    );
  }
};
