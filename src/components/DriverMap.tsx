"use client";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import { useRef } from "react";
import { DriverTripActionRequest, TripEvents } from "@/lib/contracts/websocket";
import { Driver } from "@/lib/types";
import { DriverTripOverview } from "./DriverTripOverview";
import { useDriverStreamConnection } from "@/hooks/useDriverStreamConnection";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import LoadingMap from "./LoadingMap";
import { getMapMarkers } from "@/lib/markers";

export const DriverMap = ({ user }: { user: Driver }) => {
  const mapRef = useRef<L.Map>(null);
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

    if (action === TripEvents.DriverTripDecline) {
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

  const markers = getMapMarkers();
  if (!markers) return;
  const { DriverMarker, TripPickupMarker, TripDestinationMarker } = markers;

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="relative flex flex-col md:flex-row h-screen">
      <div className="flex-1">
        {mapPosition ? (
          <MapContainer
            center={mapPosition}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/'>CARTO</a>"
            />

            <Marker position={mapPosition} icon={DriverMarker} />

            {pickup && (
              <Marker
                position={[pickup.latitude, pickup.longitude]}
                icon={TripPickupMarker}
              >
                <Popup>Pickup</Popup>
              </Marker>
            )}

            {destination && (
              <Marker
                position={[destination.latitude, destination.longitude]}
                icon={TripDestinationMarker}
              >
                <Popup>Destination</Popup>
              </Marker>
            )}

            {parsedRoute && <Polyline positions={parsedRoute} color="blue" />}
          </MapContainer>
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
