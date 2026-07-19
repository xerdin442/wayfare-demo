import { WEBSOCKET_URL } from "@/lib/constants";
import {
  TripEvents,
  ServerWsResponse,
  isValidWsMessage,
  ClientWsMessage,
} from "@/lib/contracts/websocket";
import { CarPackageSlug, Coordinate, Driver, DriverTier } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRiderTripStore } from "@/lib/store/riderTrip";

export function useRiderStreamConnection(
  userId: string,
  location?: Coordinate,
) {
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const {
    setTripStatus,
    setRequestedTrip,
    setTripRatingData,
    setAssignedDriver,
    setDriverLocation,
    setRegionBounds,
    resetRiderTrip,
  } = useRiderTripStore();

  const sendMessage = useCallback((message: ClientWsMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (!wsRef.current || !location) return;

    sendMessage({
      type: TripEvents.RegionBoundsRequest,
      data: { pickup: location },
    });
  }, [location, sendMessage]);

  useEffect(() => {
    if (!userId) return;

    if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
      if (!location) return;

      setRegionBounds({
        region_id: "test-region",
        min_longitude: location.longitude - 0.3,
        min_latitude: location.latitude - 0.1,
        max_longitude: location.longitude + 0.3,
        max_latitude: location.latitude + 0.1,
        unavailable: false,
      });

      const mockDriver: Driver = {
        id: "mock-driver-1",
        name: "Hector Miles",
        email: "driver@example.com",
        phone: "08012345678",
        profilePicture: "",
        carModel: "Toyota Camry SE",
        carColor: "Red",
        carPlate: "ABC-123",
        packageSlug: CarPackageSlug.SEDAN,
        currentRating: 4.8,
        totalCompletedTrips: 431,
        tier: DriverTier.SILVER,
      };

      const mockRoute = {
        geometry: [
          {
            coordinates: [
              location,
              {
                latitude: location.latitude + 0.002,
                longitude: location.longitude + 0.003,
              },
            ],
          },
        ],
        duration: 1200,
        distance: 8500,
      };

      setRequestedTrip({
        id: "mock-trip-1",
        userId,
        driverId: mockDriver.id,
        status: "assigned",
        selectedFare: {
          id: "mock-sedan",
          packageSlug: CarPackageSlug.SEDAN,
          amount: 350000,
          route: mockRoute,
        },
      });

      setAssignedDriver(mockDriver);

      setDriverLocation({
        latitude: location.latitude + 0.004,
        longitude: location.longitude + 0.003,
      });

      setTripStatus(TripEvents.DriverAssigned);
      return;
    }

    const ws = new WebSocket(`${WEBSOCKET_URL}/riders?user_id=${userId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerWsResponse;

      if (!message || !isValidWsMessage(message)) {
        setError(
          `Unknown message type "${message}", allowed types are: ${Object.values(TripEvents).join(", ")}`,
        );
        return;
      }

      switch (message.type) {
        case TripEvents.RegionBoundsRequest:
          setRegionBounds(message.data);
          break;
        case TripEvents.PaymentFailed:
        case TripEvents.PaymentSuccess:
        case TripEvents.PaymentRequired:
        case TripEvents.DriverArrival:
        case TripEvents.NoDriversFound:
        case TripEvents.TripStarted:
          setTripStatus(message.type);
          break;
        case TripEvents.TripCancelled:
          setTripStatus(message.type);
          resetRiderTrip();
          break;
        case TripEvents.DriverAssigned:
          setAssignedDriver(message.data.driver);
          setRequestedTrip(message.data.trip);
          setTripStatus(message.type);
          break;
        case TripEvents.DriverLocationUpdate:
          setDriverLocation(message.data);
          break;
        case TripEvents.TripRatingRequired:
          setTripStatus(message.type);
          setTripRatingData(message.data);
          break;
      }
    };

    ws.onclose = (event) => {
      console.log(`Connection closed: ${event.reason}`);
    };

    ws.onerror = () => {
      setError("WebSocket error occurred");
    };

    return () => {
      console.log("Closing WebSocket...");
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [
    userId,
    location,
    setTripStatus,
    setRequestedTrip,
    setTripRatingData,
    setAssignedDriver,
    setDriverLocation,
    setRegionBounds,
    resetRiderTrip,
  ]);

  return { sendMessage, error };
}
