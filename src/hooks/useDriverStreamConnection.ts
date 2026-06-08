import { WEBSOCKET_URL } from '@/lib/constants';
import { TripEvents, ServerWsResponse, isValidWsMessage, ClientWsMessage } from '@/lib/contracts/websocket';
import { Coordinate, Trip } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export const useDriverStreamConnection = (userId: string, location?: Coordinate) => {
  const [requestedTrip, setRequestedTrip] = useState<Trip | null>(null)
  const [tripStatus, setTripStatus] = useState<TripEvents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const sendMessage = useCallback((message: ClientWsMessage) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  }, [ws]);

  useEffect(() => {
    if (!ws || !location) return;

    sendMessage({
      type: TripEvents.DriverLocationUpdate,
      data: {
        coords: location,
        riderId: requestedTrip?.userId
      }
    })
  }, [ws, location, sendMessage, requestedTrip]);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`${WEBSOCKET_URL}/drivers?user_id=${userId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWs(ws);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerWsResponse;

      if (!message || !isValidWsMessage(message)) {
        setError(`Unknown message type "${message}", allowed types are: ${Object.values(TripEvents).join(', ')}`);
        return;
      }

      switch (message.type) {
        case TripEvents.DriverTripRequest:
          setRequestedTrip(message.data);
          break;
        case TripEvents.TripAborted:
        case TripEvents.TripCancelled:
        case TripEvents.TripCompleted:
          setTripStatus(message.type)
          setRequestedTrip(null)
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
      setError('WebSocket error occurred');
    };

    return () => {
      console.log('Closing WebSocket...');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId]);

  const resetTripStatus = () => {
    setTripStatus(null);
    setRequestedTrip(null);
  }

  return {
    error,
    tripStatus,
    requestedTrip,
    resetTripStatus,
    sendMessage,
    setTripStatus
  };
}