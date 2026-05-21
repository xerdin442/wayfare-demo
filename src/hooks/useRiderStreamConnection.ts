import { WEBSOCKET_URL } from '@/lib/constants';
import { TripEvents, ServerWsResponse, isValidWsMessage, ClientWsMessage } from '@/lib/contracts/websocket';
import { Coordinate, Driver, RatingRequiredData, Trip } from '@/lib/types';
import { useEffect, useState } from 'react';

export function useRiderStreamConnection(userId: string) {
  const [tripStatus, setTripStatus] = useState<TripEvents | null>(null);
  const [requestedTrip, setRequestedTrip] = useState<Trip | null>(null);
  const [tripRatingData, setTripRatingData] = useState<RatingRequiredData | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const resetTripStatus = () => {
    setTripStatus(null);
    setAssignedDriver(null);
    setDriverLocation(null);
    setRequestedTrip(null);
    setTripRatingData(null);
  }

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`${WEBSOCKET_URL}/ws/riders?user_id=${userId}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWs(ws)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerWsResponse;

      if (!message || !isValidWsMessage(message)) {
        setError(`Unknown message type "${message}", allowed types are: ${Object.values(TripEvents).join(', ')}`);
        return;
      }

      switch (message.type) {
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
          resetTripStatus();
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
          setTripStatus(message.type)
          setTripRatingData(message.data)
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

  const sendMessage = (message: ClientWsMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      setError('WebSocket is not connected');
    }
  };

  return {
    driverLocation,
    assignedDriver,
    requestedTrip,
    tripRatingData,
    tripStatus,
    setTripStatus,
    resetTripStatus,
    sendMessage,
    error
  };
}