"use client";

import Image from "next/image";
import {
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import { useMemo, useRef, useState } from "react";
import { MapClickHandler } from "./MapClickHandler";
import { Button } from "./ui/button";
import { API_URL } from "@/lib/constants";
import {
  HTTPTripPreviewResponse,
  HTTPTripPreviewRequestPayload,
  BackendEndpoints,
  HTTPTripStartRequestPayload,
  HTTPTripStartResponse,
} from "@/lib/contracts";
import { TripPreview, RouteFare, RequestRideProps } from "@/lib/types";
import {
  getGeohashBounds,
  TripDestinationMarker,
  TripPickupMarker,
  DriverMarker,
} from "@/lib/utils";
import { useRiderStreamConnection } from "@/hooks/useRiderStreamConnection";
import { RiderTripOverview } from "./RiderTripOverview";
import { RoutingControl } from "./RoutingControl";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import LoadingMap from "./LoadingMap";

interface RiderMapProps {
  onRouteSelected?: (distance: number) => void;
}

export default function RiderMap({ onRouteSelected }: RiderMapProps) {
  const [tripPreview, setTripPreview] = useState<TripPreview | null>(null);
  const [selectedCarPackage] = useState<RouteFare | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map>(null);
  const userID = useMemo(() => crypto.randomUUID(), []);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { location, mapPosition } = useLocationTracker();
  const {
    drivers,
    error,
    tripStatus,
    assignedDriver,
    paymentSession,
    resetTripStatus,
  } = useRiderStreamConnection(userID);

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (tripPreview?.tripID) return;

    if (!location) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setDestination([e.latlng.lat, e.latlng.lng]);

      const data = await requestRidePreview({
        pickup: [location.latitude, location.longitude],
        destination: [e.latlng.lat, e.latlng.lng],
      });

      const parsedRoute = data.route.geometry[0].coordinates.map(
        (coord) => [coord.longitude, coord.latitude] as [number, number],
      );

      setTripPreview({
        tripID: "",
        route: parsedRoute,
        rideFares: data.rideFares,
        distance: data.route.distance,
        duration: data.route.duration,
      });

      // Call onRouteSelected with the route distance
      onRouteSelected?.(data.route.distance);
    }, 500);
  };

  const requestRidePreview = async (
    props: RequestRideProps,
  ): Promise<HTTPTripPreviewResponse> => {
    const { pickup, destination } = props;
    const payload = {
      userID: userID,
      pickup: {
        latitude: pickup[0],
        longitude: pickup[1],
      },
      destination: {
        latitude: destination[0],
        longitude: destination[1],
      },
    } as HTTPTripPreviewRequestPayload;

    const response = await fetch(`${API_URL}${BackendEndpoints.PREVIEW_TRIP}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const { data } = (await response.json()) as {
      data: HTTPTripPreviewResponse;
    };
    return data;
  };

  const handleStartTrip = async (fare: RouteFare) => {
    const payload = {
      rideFareID: fare.id,
      userID: userID,
    } as HTTPTripStartRequestPayload;

    if (!fare.id) {
      alert("No Fare ID in the payload");
      return;
    }

    const response = await fetch(`${API_URL}${BackendEndpoints.START_TRIP}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as HTTPTripStartResponse;

    if (response.ok && tripPreview) {
      setTripPreview(
        (prev) =>
          ({
            ...prev,
            tripID: data.tripID,
          }) as TripPreview,
      );
    }

    return data;
  };

  const handleCancelTrip = () => {
    setTripPreview(null);
    setDestination(null);
    resetTripStatus();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="relative flex flex-col md:flex-row h-screen">
      {mapPosition ? (
        <div className={`${destination ? "flex-[0.7]" : "flex-1"}`}>
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
            <Marker position={mapPosition} icon={TripPickupMarker} />

            {/* Render geohash grid cells */}
            {drivers?.map((driver) => (
              <Rectangle
                key={`grid-${driver?.geohash}`}
                bounds={
                  getGeohashBounds(driver?.geohash) as L.LatLngBoundsExpression
                }
                pathOptions={{
                  color: "#3388ff",
                  weight: 1,
                  fillOpacity: 0.1,
                }}
              >
                <Popup>Geohash: {driver?.geohash}</Popup>
              </Rectangle>
            ))}

            {/* Render driver markers */}
            {drivers?.map((driver) => (
              <Marker
                key={driver?.id}
                position={[
                  driver?.location?.latitude,
                  driver?.location?.longitude,
                ]}
                icon={DriverMarker}
              >
                <Popup>
                  Driver ID: {driver?.id}
                  <br />
                  Geohash: {driver?.geohash}
                  <br />
                  Name: {driver?.name}
                  <br />
                  Car Plate: {driver?.carPlate}
                  <br />
                  <Image
                    src={driver?.profilePicture}
                    alt="Driver profile picture"
                    width={100}
                    height={100}
                  />
                </Popup>
              </Marker>
            ))}

            {destination && (
              <Marker position={destination} icon={TripDestinationMarker}>
                <Popup>Destination</Popup>
              </Marker>
            )}

            {selectedCarPackage && (
              <div className="mt-4 z-9999 absolute bottom-0 right-0">
                <Button className="w-full">
                  Request Ride with {selectedCarPackage.packageSlug}
                </Button>
              </div>
            )}

            {tripPreview && <RoutingControl route={tripPreview.route} />}
            <MapClickHandler onClick={handleMapClick} />
          </MapContainer>
        </div>
      ) : (
        <LoadingMap />
      )}

      <div className="flex-[0.4]">
        <RiderTripOverview
          trip={tripPreview}
          assignedDriver={assignedDriver}
          status={tripStatus}
          paymentSession={paymentSession}
          onPackageSelect={handleStartTrip}
          onCancel={handleCancelTrip}
        />
      </div>
    </div>
  );
}
