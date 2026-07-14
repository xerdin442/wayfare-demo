import { CarPackageSelect } from "./CarPackageSelect";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { DriverCard } from "./DriverCard";
import { TripEvents } from "@/lib/contracts/websocket";
import { RideFare } from "@/lib/types";
import {
  convertSecondsToMinutes,
  convertMetersToKilometers,
} from "@/lib/utils";
import { TripOverviewCard } from "./TripOverviewCard";
import { useState } from "react";
import CheckoutDetails from "./CheckoutDetails";
import { useRiderTripStore } from "@/lib/store/riderTrip";

interface RiderTripOverviewProps {
  handleStartTrip: (fare: RideFare) => void;
  handleCheckout: (rating: number, comment?: string, tip?: number) => void;
  handleCashPayment: () => void;
  handleCancelTrip: () => void;
  onReset: () => void;
}

export const RiderTripOverview = ({
  handleStartTrip,
  handleCheckout,
  handleCancelTrip,
  handleCashPayment,
  onReset,
}: RiderTripOverviewProps) => {
  const [amount, setAmount] = useState<number>();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>();
  const [driverTip, setDriverTip] = useState<number>();
  const [checkoutPreferred, setCheckoutPreferred] = useState<boolean>(false);

  const {
    tripOverview: trip,
    tripStatus: status,
    assignedDriver,
  } = useRiderTripStore();

  if (!trip) {
    return (
      <TripOverviewCard
        title="Where to?"
        description="Search or pick a recent location to get started"
      />
    );
  }

  if (status === TripEvents.TripCancelled) {
    return (
      <TripOverviewCard
        title="Trip cancelled!"
        description="The driver has cancelled the trip. Find another driver or try again later."
      >
        <Button variant="outline" className="w-full" onClick={onReset}>
          Go back
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.PaymentSuccess) {
    return (
      <TripOverviewCard
        title="Trip completed!"
        description="Your trip has ended. Thank you for choosing Wayfare!"
      >
        <Button variant="outline" className="w-full" onClick={onReset}>
          Go back
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.PaymentFailed) {
    return (
      <TripOverviewCard
        title="Payment failed!"
        description="Your payment failed, please try another method"
      >
        <Button className="w-full mt-2.5" onClick={handleCashPayment}>
          Pay with cash
        </Button>
      </TripOverviewCard>
    );
  }

  if (
    status === TripEvents.AwaitingWebhookStatus ||
    status === TripEvents.CashOptionPreferred
  ) {
    return (
      <TripOverviewCard
        title="Processing..."
        description="Please wait while we confirm your payment"
      ></TripOverviewCard>
    );
  }

  if (status === TripEvents.PaymentRequired) {
    return (
      <TripOverviewCard
        title="Payment Required"
        description="Rate your experience and select a payment method to complete your trip"
      >
        <div className="flex flex-col gap-4">
          {checkoutPreferred && (
            <CheckoutDetails
              setRating={setRating}
              setComment={setComment}
              setDriverTip={setDriverTip}
            />
          )}

          <div className="text-sm text-gray-500">
            <p>Amount to pay: {amount}</p>
          </div>

          <Button
            className="w-full"
            disabled={checkoutPreferred && rating === 0}
            onClick={
              checkoutPreferred
                ? () => handleCheckout(rating, comment, driverTip)
                : () => setCheckoutPreferred(true)
            }
          >
            {checkoutPreferred ? "Go to checkout" : "Pay online"}
          </Button>

          <Button
            className="w-full mt-2.5"
            disabled={checkoutPreferred}
            onClick={handleCashPayment}
          >
            Pay with cash
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.NoDriversFound) {
    return (
      <TripOverviewCard
        title="No Drivers Found"
        description="There are no drivers available right now. Please try again later"
      >
        <Button variant="outline" className="w-full" onClick={onReset}>
          Go back
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverAssigned) {
    return (
      <TripOverviewCard
        title="Driver Found!"
        description="Your driver is on the way, please wait for them to arrive."
      >
        <DriverCard driver={assignedDriver} />
        <Button
          variant="destructive"
          className="w-full mt-2.5"
          onClick={handleCancelTrip}
        >
          Cancel trip
        </Button>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverArrival) {
    return (
      <TripOverviewCard
        title="Driver Arrived"
        description="Your driver has arrived at the pickup location"
      ></TripOverviewCard>
    );
  }

  if (status === TripEvents.TripStarted) {
    return (
      <TripOverviewCard
        title="Trip Started"
        description="Your trip has started, please enjoy your ride"
      ></TripOverviewCard>
    );
  }

  if (amount && !assignedDriver) {
    return (
      <TripOverviewCard
        title="Searching..."
        description="We're connecting you with a driver, hang tight..."
      >
        <div className="flex flex-col space-y-3 justify-center items-center mb-4">
          <Skeleton className="h-31.25 w-62.5 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-62.5" />
            <Skeleton className="h-4 w-50" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Arriving in {convertSecondsToMinutes(trip.duration)} at your
            destination ({convertMetersToKilometers(trip.distance)})
          </h3>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              handleCancelTrip();
              setAmount(0);
            }}
          >
            Cancel
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (!amount && trip.rideFares.length > 0) {
    return (
      <CarPackageSelect
        trip={trip}
        onPackageSelect={handleStartTrip}
        setAmount={setAmount}
        onCancel={onReset}
      />
    );
  }
};
