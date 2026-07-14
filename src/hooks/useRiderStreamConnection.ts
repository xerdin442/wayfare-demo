import { WEBSOCKET_URL } from "@/lib/constants";
import {
  TripEvents,
  ServerWsResponse,
  isValidWsMessage,
  ClientWsMessage,
} from "@/lib/contracts/websocket";
import { Coordinate } from "@/lib/types";
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
