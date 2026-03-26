import { Trip, Driver, RouteFare, Coordinate, Route, PaymentSession } from "./types";

export enum BackendEndpoints {
  PREVIEW_TRIP = "/trip/preview",
  START_TRIP = "/trip/start",
  WS_DRIVERS = "/drivers",
  WS_RIDERS = "/riders",
}

export enum TripEvents {
  NoDriversFound = "trip.event.no_drivers_found",
  DriverAssigned = "trip.event.driver_assigned",
  AvailableDrivers = "trip.event.available_drivers",
  TripCompleted = "trip.cmd.completed",
  TripCancelled = "trip.cmd.cancelled",
  DriverTripRequest = "driver.event.trip_request",
  DriverLocationUpdate = "driver.cmd.location_update",
  DriverTripAccept = "driver.cmd.trip_accept",
  DriverTripDecline = "driver.cmd.trip_decline",
  PaymentSessionCreated = "payment.event.session_created",
}

export type ServerWsMessage =
  | PaymentSessionCreatedResponse
  | DriverAssignedResponse
  | AvailableDriversResponse
  | DriverTripAvailableResponse
  | NoDriversFoundResponse;

export type ClientWsMessage =
  | DriverTripActionRequest
  | DriverLocationUpdateRequest
  | RiderTripUpdateRequest

interface PaymentSessionCreatedResponse {
  type: TripEvents.PaymentSessionCreated;
  data: PaymentSession;
}

interface NoDriversFoundResponse {
  type: TripEvents.NoDriversFound;
}

interface DriverTripAvailableResponse {
  type: TripEvents.DriverTripRequest;
  data: Trip;
}

interface DriverAssignedResponse {
  type: TripEvents.DriverAssigned;
  data: Trip;
}

interface AvailableDriversResponse {
  type: TripEvents.AvailableDrivers;
  data: Driver[];
}

interface DriverTripActionRequest {
  type: TripEvents.DriverTripAccept | TripEvents.DriverTripDecline;
  data: {
    trip: Trip;
    driver?: Driver;
  };
}

interface DriverLocationUpdateRequest {
  type: TripEvents.DriverLocationUpdate;
  data: {
    location: Coordinate;
    geohash: string;
  }
}

interface RiderTripUpdateRequest {
  type: TripEvents.TripCompleted | TripEvents.TripCancelled
  data: { tripID: string }
}

export interface HTTPTripPreviewResponse {
  route: Route;
  rideFares: RouteFare[];
}

export interface HTTPTripStartResponse {
  tripID: string;
}

export interface HTTPTripStartRequestPayload {
  rideFareID: string;
  userID: string;
}

export interface HTTPTripPreviewRequestPayload {
  userID: string;
  pickup: Coordinate;
  destination: Coordinate;
}

export function isValidTripEvent(event: string): event is TripEvents {
  return Object.values(TripEvents).includes(event as TripEvents);
}

export function isValidWsMessage(message: ServerWsMessage): message is ServerWsMessage {
  return isValidTripEvent(message.type);
}