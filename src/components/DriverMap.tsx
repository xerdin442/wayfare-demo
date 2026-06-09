"use client";

import { useEffect, useMemo, useRef } from "react";
import { Car, MapPin, MapPinned } from "lucide-react";
import { Map, MapMarker, MarkerContent, MapRoute, MapControls } from "./ui/map";
import { DriverTripActionRequest, TripEvents } from "@/lib/contracts/websocket";
import { Driver } from "@/lib/types";
import { DriverTripOverview } from "./DriverTripOverview";
import { useDriverStreamConnection } from "@/hooks/useDriverStreamConnection";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import LoadingMap from "./LoadingMap";

export const DriverMap = ({ user }: { user: Driver }) => {
  const mapCenterRef = useRef<[number, number] | null>(null);
  const { location: driverLocation, mapPosition } = useLocationTracker();

  const {
    error,
    tripStatus,
    requestedTrip,
    sendMessage,
    setTripStatus,
    resetTripStatus,
  } = useDriverStreamConnection(user.id, driverLocation);

  const handleTripAction = (
    action: DriverTripActionRequest["type"],
    request?: boolean,
  ) => {
    if (!requestedTrip) return;

    sendMessage({
      type: action,
      data: {
        trip: requestedTrip,
        driver: request ? user : undefined,
      },
    });

    if (
      action === TripEvents.DriverTripDecline ||
      action === TripEvents.TripCancelled
    ) {
      resetTripStatus();
    } else {
      setTripStatus(action);
    }
  };

  const parsedRoute = useMemo(
    () =>
      requestedTrip?.selectedFare.route.geometry[0].coordinates.map(
        (coord) => [coord.longitude, coord.latitude] as [number, number],
      ),
    [requestedTrip],
  );

  const destination = useMemo(
    () => requestedTrip?.selectedFare.route.geometry[0].coordinates[1],
    [requestedTrip],
  );

  const pickup = useMemo(
    () => requestedTrip?.selectedFare.route.geometry[0].coordinates[0],
    [requestedTrip],
  );

  useEffect(() => {
    if (!mapPosition) return;
    mapCenterRef.current = [mapPosition[1], mapPosition[0]];
  }, [mapPosition]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="relative flex flex-col md:flex-row h-screen">
      <div className="flex-1">
        {mapPosition ? (
          <div style={{ height: "100%", width: "100%" }}>
            <Map
              className="h-full w-full"
              center={[mapPosition[1], mapPosition[0]]}
              zoom={13}
            >
              <MapControls position="top-right" showLocate />

              {/* Driver */}
              <MapMarker longitude={mapPosition[1]} latitude={mapPosition[0]}>
                <MarkerContent>
                  <Car className="text-blue-600" />
                </MarkerContent>
              </MapMarker>

              {/* Pickup */}
              {pickup && (
                <MapMarker
                  longitude={pickup.longitude}
                  latitude={pickup.latitude}
                >
                  <MarkerContent>
                    <MapPinned className="text-green-600" />
                  </MarkerContent>
                </MapMarker>
              )}

              {/* Destination */}
              {destination && (
                <MapMarker
                  longitude={destination.longitude}
                  latitude={destination.latitude}
                >
                  <MarkerContent>
                    <MapPin className="text-red-600" />
                  </MarkerContent>
                </MapMarker>
              )}

              {/* Route */}
              {parsedRoute && parsedRoute.length > 1 && (
                <MapRoute coordinates={parsedRoute} color="#2563eb" width={4} />
              )}
            </Map>
          </div>
        ) : (
          <LoadingMap />
        )}
      </div>

      <div className="overflow-y-auto md:w-100 bg-white border-t md:border-t-0 md:border-l">
        <DriverTripOverview
          trip={requestedTrip}
          status={tripStatus}
          handleTripAction={handleTripAction}
          onReset={resetTripStatus}
        />
      </div>
    </div>
  );
};
