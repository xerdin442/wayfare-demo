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
import {
  MapPinned,
  Clock,
  Route,
  CarFront,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  CreditCard,
  Banknote,
  Dot,
} from "lucide-react";

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
        description="Search for a destination to get started"
        icon={Search}
      />
    );
  }

  if (status === TripEvents.TripCancelled) {
    return (
      <TripOverviewCard
        title="Trip cancelled"
        description="Your trip has been cancelled. You can request another ride whenever you're ready."
        icon={XCircle}
        variant="error"
      >
        <div className="pt-4">
          <Button variant="outline" className="w-full" onClick={onReset}>
            Find another ride
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.PaymentSuccess) {
    return (
      <TripOverviewCard
        title="Payment confirmed"
        description="Thanks for riding with Wayfare! We hope you enjoyed your trip."
        icon={CheckCircle2}
        variant="success"
      >
        <div className="pt-4">
          <Button variant="outline" className="w-full" onClick={onReset}>
            Done
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.PaymentFailed) {
    return (
      <TripOverviewCard
        title="Payment failed"
        description="We couldn't process your payment. Please try again or use an alternative method."
        icon={ShieldAlert}
        variant="error"
      >
        <div className="flex flex-col gap-2 pt-4">
          <Button className="w-full" onClick={handleCashPayment}>
            <Banknote className="w-4 h-4 mr-2" />
            Pay with cash
          </Button>
          <Button variant="outline" className="w-full" onClick={onReset}>
            Cancel
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (
    status === TripEvents.AwaitingWebhookStatus ||
    status === TripEvents.CashOptionPreferred
  ) {
    return (
      <TripOverviewCard
        title="Processing payment"
        description="Please wait a moment while we confirm your payment. This shouldn't take long."
        icon={Loader2}
      >
        <div className="flex justify-center pt-4">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.PaymentRequired) {
    return (
      <TripOverviewCard
        title="Payment"
        description="Rate your trip and choose how you'd like to pay"
        icon={CreditCard}
      >
        <div className="flex flex-col gap-3 pt-2">
          {!checkoutPreferred ? (
            <>
              <Button
                className="w-full"
                onClick={() => setCheckoutPreferred(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay online
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleCashPayment}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Pay with cash
              </Button>
            </>
          ) : (
            <>
              <CheckoutDetails
                setRating={setRating}
                setComment={setComment}
                setDriverTip={setDriverTip}
              />
              <div className="text-sm text-gray-500 text-center">
                Amount: ₦{(amount ?? 0) / 100}
              </div>
              <Button
                className="w-full"
                disabled={rating === 0}
                onClick={() => handleCheckout(rating, comment, driverTip)}
              >
                Confirm payment
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setCheckoutPreferred(false)}
              >
                Back
              </Button>
            </>
          )}
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.NoDriversFound) {
    return (
      <TripOverviewCard
        title="No drivers nearby"
        description="There aren't any drivers available in your area right now. Please try again in a few minutes."
        icon={AlertTriangle}
        variant="warning"
      >
        <div className="pt-4">
          <Button variant="outline" className="w-full" onClick={onReset}>
            Try again
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverAssigned) {
    return (
      <TripOverviewCard
        title="Your driver is on the way"
        description=""
        icon={CarFront}
      >
        <div className="flex flex-col gap-4">
          {trip && (
            <div className="flex flex-col gap-1 py-2">
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center shrink-0 pt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                  <div className="w-px h-6 bg-gray-200 my-0.5" />
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100" />
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  <div>
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      Pickup
                    </p>
                    <p className="text-sm text-gray-900 leading-tight truncate">
                      Your current location
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      Destination
                    </p>
                    <p className="text-sm text-gray-900 leading-tight truncate">
                      Drop-off point
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DriverCard driver={assignedDriver} />

          <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{convertSecondsToMinutes(trip?.duration ?? 0)}</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <Route className="w-4 h-4" />
              <span>{convertMetersToKilometers(trip?.distance ?? 0)}</span>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancelTrip}
          >
            Cancel trip
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.DriverArrival) {
    return (
      <TripOverviewCard
        title="Driver has arrived"
        description="Your driver is at the pickup point. Please head outside to meet them."
        icon={MapPinned}
      >
        <div className="flex flex-col gap-4 pt-2">
          <DriverCard driver={assignedDriver} />
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancelTrip}
          >
            Cancel trip
          </Button>
        </div>
      </TripOverviewCard>
    );
  }

  if (status === TripEvents.TripStarted) {
    return (
      <TripOverviewCard title="On your way" description="" icon={CarFront}>
        <div className="flex flex-col gap-4">
          {trip && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {convertSecondsToMinutes(trip.duration)}
                </span>
              </div>
              <Dot className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {convertMetersToKilometers(trip.distance)}
                </span>
              </div>
            </div>
          )}
          {assignedDriver && <DriverCard driver={assignedDriver} />}
        </div>
      </TripOverviewCard>
    );
  }

  if (amount && !assignedDriver) {
    return (
      <TripOverviewCard
        title="Finding your ride"
        description="Hang tight, we're connecting you with a nearby driver..."
      >
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="flex flex-col items-start gap-3 pt-4 pb-2">
            <Skeleton className="h-32 w-64 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-60" />
              <Skeleton className="h-4 w-50" />
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-4/5 h-11 text-base mx-auto"
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
