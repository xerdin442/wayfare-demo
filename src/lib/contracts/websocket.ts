import { Coordinate, Driver, RatingRequiredData, RegionBounds, Trip } from "../types";

export enum TripEvents {
  NoDriversFound = "trip.event.no_drivers_found",
  DriverAssigned = "trip.event.driver_assigned",
  DriverArrival = "trip.event.driver_arrival",
  RegionBoundsRequest = "trip.cmd.region_bounds_request",
  TripCancelled = "trip.cmd.cancelled",
  TripCompleted = "trip.cmd.completed",
  TripAborted = "trip.cmd.aborted",
  TripStarted = "trip.cmd.started",
  TripRated = "trip.cmd.rated",
  TripRatingRequired = "trip.event.rating_required",
  DriverTripRequest = "driver.event.trip_request",
  DriverLocationUpdate = "driver.cmd.location_update",
  DriverConfirmPickup = "driver.cmd.confirm_pickup",
  DriverTripAccept = "driver.cmd.trip_accept",
  DriverTripDecline = "driver.cmd.trip_decline",
  DriverStartTrip = "driver.cmd.start_trip",
  DriverEndTrip = "driver.cmd.end_trip",
  PaymentRequired = "trip.event.payment_required",
  AwaitingWebhookStatus = "payment.event.awaiting_webhook_status",
  PaymentSuccess = "payment.event.success",
  PaymentFailed = "payment.event.failed",
  CashPaymentReceived = "payment.event.cash_payment_received",
  CashOptionPreferred = "payment.event.cash_option_preferred"
}

export type ServerWsResponse =
  | DriverAssignedResponse
  | DriverLocationResponse
  | DriverArrivalResponse
  | DriverTripAvailableResponse
  | NoDriversFoundResponse
  | RegionBoundsResponse
  | TripUpdateResponse
  | PaymentEventResponse
  | TripRatingRequiredResponse;

export type ClientWsMessage =
  | DriverTripActionRequest
  | DriverLocationUpdateRequest
  | RegionBoundsRequest
  | RiderTripActionRequest
  | TripRatingRequest;

interface NoDriversFoundResponse {
  type: TripEvents.NoDriversFound;
}

interface DriverTripAvailableResponse {
  type: TripEvents.DriverTripRequest;
  data: Trip;
}

interface DriverAssignedResponse {
  type: TripEvents.DriverAssigned;
  data: {
    trip: Trip;
    driver: Driver;
  };
}

interface DriverLocationResponse {
  type: TripEvents.DriverLocationUpdate;
  data: Coordinate;
}

interface DriverArrivalResponse {
  type: TripEvents.DriverArrival
}

interface RegionBoundsResponse {
  type: TripEvents.RegionBoundsRequest;
  data: RegionBounds;
}

interface TripUpdateResponse {
  type:
  | TripEvents.TripCancelled
  | TripEvents.TripCompleted
  | TripEvents.TripAborted
  | TripEvents.TripStarted
}

interface PaymentEventResponse {
  type:
  | TripEvents.PaymentRequired
  | TripEvents.CashOptionPreferred
  | TripEvents.PaymentSuccess
  | TripEvents.PaymentFailed;
}

interface TripRatingRequiredResponse {
  type: TripEvents.TripRatingRequired,
  data: RatingRequiredData
}

export interface DriverTripActionRequest {
  type:
  | TripEvents.DriverTripAccept
  | TripEvents.DriverTripDecline
  | TripEvents.DriverConfirmPickup
  | TripEvents.DriverStartTrip
  | TripEvents.DriverEndTrip
  | TripEvents.TripCancelled
  | TripEvents.CashPaymentReceived;
  data: {
    trip: Trip;
    driver?: Driver;
  };
}

interface DriverLocationUpdateRequest {
  type: TripEvents.DriverLocationUpdate;
  data: {
    coords: Coordinate,
    riderId?: string,
  }
}

interface RegionBoundsRequest {
  type: TripEvents.RegionBoundsRequest;
  data: { pickup: Coordinate }
}

interface RiderTripActionRequest {
  type: TripEvents.TripCancelled | TripEvents.CashOptionPreferred;
  data: { trip: Trip; }
}

interface TripRatingRequest {
  type: TripEvents.TripRated,
  data: {
    tripId: string,
    rating: number
    comment: string
  }
}

export function isValidWsMessage(message: ServerWsResponse): message is ServerWsResponse {
  return Object.values(TripEvents).includes(message.type);
}