import { WEBSOCKET_URL } from "@/lib/constants";
import {
  TripEvents,
  ServerWsResponse,
  isValidWsMessage,
  ClientWsMessage,
} from "@/lib/contracts/websocket";
import { Coordinate } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDriverTripStore } from "@/lib/store/driverTrip";

export const useDriverStreamConnection = (
  userId: string,
  location?: Coordinate,
) => {
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { setTripStatus, setRequestedTrip, resetDriverTrip, requestedTrip } =
    useDriverTripStore();

  const sendMessage = useCallback((message: ClientWsMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (!wsRef.current || !location) return;

    sendMessage({
      type: TripEvents.DriverLocationUpdate,
      data: {
        coords: location,
        riderId: requestedTrip?.userId,
      },
    });
  }, [location, requestedTrip, sendMessage]);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`${WEBSOCKET_URL}/drivers?user_id=${userId}`);
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
        case TripEvents.DriverTripRequest:
          setRequestedTrip(message.data);
          setTripStatus(TripEvents.DriverTripRequest);
          break;
        case TripEvents.TripAborted:
        case TripEvents.TripCancelled:
        case TripEvents.TripCompleted:
          setTripStatus(message.type);
          setRequestedTrip(null);
          break;
        case TripEvents.PaymentFailed:
        case TripEvents.PaymentSuccess:
        case TripEvents.CashOptionPreferred:
          setTripStatus(message.type);
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
  }, [userId, setTripStatus, setRequestedTrip, resetDriverTrip]);

  return { sendMessage, error };
};
