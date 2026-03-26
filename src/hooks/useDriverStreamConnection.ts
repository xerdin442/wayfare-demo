import { WEBSOCKET_URL } from '@/lib/constants';
import {
  TripEvents,
  BackendEndpoints,
  ServerWsMessage,
  isValidWsMessage,
  isValidTripEvent,
  ClientWsMessage
} from '@/lib/contracts';
import { Coordinate, CarPackageSlug, Trip, Driver } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

interface useDriverConnectionProps {
  location?: Coordinate;
  geohash?: string;
  userID: string;
  packageSlug: CarPackageSlug;
}

export const useDriverStreamConnection = ({
  location,
  geohash,
  userID,
  packageSlug
}: useDriverConnectionProps) => {
  const [requestedTrip, setRequestedTrip] = useState<Trip | null>(null)
  const [tripStatus, setTripStatus] = useState<TripEvents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);

  const sendMessage = useCallback((message: ClientWsMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      setError('WebSocket is not connected');
    }
  }, [ws]);

  useEffect(() => {
    if (!ws || !location || !geohash) return;

    sendMessage({
      type: TripEvents.DriverLocationUpdate,
      data: { location, geohash }
    })
  }, [ws, location, geohash, sendMessage]);

  useEffect(() => {
    if (!userID) return;

    const websocket = new WebSocket(`${WEBSOCKET_URL}${BackendEndpoints.WS_DRIVERS}?userID=${userID}&packageSlug=${packageSlug}`);
    setWs(websocket);

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerWsMessage;

      if (!message || !isValidWsMessage(message)) {
        setError(`Unknown message type "${message}", allowed types are: ${Object.values(TripEvents).join(', ')}`);
        return;
      }

      switch (message.type) {
        case TripEvents.DriverTripRequest:
          setRequestedTrip(message.data);
          break;
      }

      if (isValidTripEvent(message.type)) {
        setTripStatus(message.type);
      } else {
        setError(`Unknown message type "${message.type}", allowed types are: ${Object.values(TripEvents).join(', ')}`);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket closed');
    };

    websocket.onerror = (event) => {
      setError('WebSocket error occurred');
      console.error('WebSocket error:', event);
    };

    return () => {
      console.log('Closing WebSocket...');
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID]);

  const resetTripStatus = () => {
    setTripStatus(null);
    setRequestedTrip(null);
  }

  return { error, tripStatus, driver, requestedTrip, resetTripStatus, sendMessage, setTripStatus };
}