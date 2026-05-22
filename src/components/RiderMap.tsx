"use client";

import L from "leaflet";
import { useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import {
  PreviewTripResponse,
  PreviewTripRequest,
  StartTripRequest,
  StartTripResponse,
  sendRequest,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "@/lib/contracts/http";
import { TripEvents } from "@/lib/contracts/websocket";
import { TripPreview, RideFare, Rider } from "@/lib/types";
import {
  TripDestinationMarker,
  TripPickupMarker,
  DriverMarker,
} from "@/lib/utils";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { useRiderStreamConnection } from "@/hooks/useRiderStreamConnection";
import { DriverCard } from "./DriverCard";
import LoadingMap from "./LoadingMap";
import { MapClickHandler } from "./MapClickHandler";
import { RiderTripOverview } from "./RiderTripOverview";
import TripRatingModal from "./TripRatingModal";

export default function RiderMap({ user }: { user: Rider }) {
  const [tripPreview, setTripPreview] = useState<TripPreview | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { location, mapPosition } = useLocationTracker();
  const {
    error,
    regionBounds,
    tripStatus,
    tripRatingData,
    requestedTrip,
    assignedDriver,
    driverLocation,
    setTripStatus,
    resetTripStatus,
    sendMessage,
  } = useRiderStreamConnection(user.id, location);

  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (tripPreview) return;
    if (!location) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setDestination([e.latlng.lat, e.latlng.lng]);
      if (!destination) return;

      const data = await requestRidePreview(
        [location.latitude, location.longitude],
        destination,
      );
      if (!data) return;

      const route = data.rideFares[0].route;
      const parsedRoute = route.geometry[0].coordinates.map(
        (coord) => [coord.longitude, coord.latitude] as [number, number],
      );

      setTripPreview({
        route: parsedRoute,
        rideFares: data.rideFares,
        distance: route.distance,
        duration: route.duration,
      });
    }, 500);
  };

  const requestRidePreview = async (
    pickup: [number, number],
    destination: [number, number],
  ): Promise<PreviewTripResponse | null> => {
    const payload: PreviewTripRequest = {
      pickup: {
        latitude: pickup[0],
        longitude: pickup[1],
      },
      destination: {
        latitude: destination[0],
        longitude: destination[1],
      },
    };

    const { result } = await sendRequest<
      PreviewTripRequest,
      PreviewTripResponse
    >("/trip/preview", "POST", true, payload);

    if (!result.data) {
      // handle error display
      return null;
    }

    return result.data;
  };

  const handleStartTrip = async (fare: RideFare) => {
    if (!fare.id) return;

    const payload: StartTripRequest = {
      rideFareId: fare.id,
    };

    const { result } = await sendRequest<StartTripRequest, StartTripResponse>(
      "/trip/start",
      "POST",
      true,
      payload,
    );

    if (!result.data) {
      // handle error display
      return;
    }

    return;
  };

  const handleCancelTrip = () => {
    if (!requestedTrip) return;

    sendMessage({
      type: TripEvents.TripCancelled,
      data: { trip: requestedTrip },
    });

    resetTripPreview();
  };

  const handleCheckout = async (
    rating: number,
    comment?: string,
    tip?: number,
  ) => {
    if (!requestedTrip) return;

    const payload: InitiatePaymentRequest = {
      email: user.email,
      tripRating: rating,
      riderComment: comment,
      driverTip: tip,
    };

    const { result } = await sendRequest<
      InitiatePaymentRequest,
      InitiatePaymentResponse
    >(`/trip/${requestedTrip.id}/pay`, "POST", true, payload);

    if (!result.data) {
      // handle error display
      return;
    }

    setTripStatus(TripEvents.AwaitingWebhookStatus);
    window.open(result.data.checkoutUrl, "_blank", "noopener,noreferrer");
  };

  const handleCashPayment = () => {
    if (!requestedTrip) return;

    sendMessage({
      type: TripEvents.CashOptionPreferred,
      data: { trip: requestedTrip },
    });

    setTripStatus(TripEvents.CashOptionPreferred);
  };

  const resetTripPreview = () => {
    setTripPreview(null);
    setDestination(null);
    resetTripStatus();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
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

              {assignedDriver && driverLocation && (
                <Marker
                  key={assignedDriver.id}
                  position={[driverLocation.latitude, driverLocation.longitude]}
                  icon={DriverMarker}
                >
                  <Popup>
                    <DriverCard driver={assignedDriver} />
                  </Popup>
                </Marker>
              )}

              {destination && (
                <Marker position={destination} icon={TripDestinationMarker}>
                  <Popup>Destination</Popup>
                </Marker>
              )}

              {tripPreview && (
                <Polyline positions={tripPreview.route} color="blue" />
              )}

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
            handleStartTrip={handleStartTrip}
            handleCheckout={handleCheckout}
            handleCashPayment={handleCashPayment}
            handleCancelTrip={handleCancelTrip}
            onReset={resetTripPreview}
          />
        </div>
      </div>

      {tripStatus === TripEvents.TripRatingRequired && tripRatingData && (
        <TripRatingModal
          data={tripRatingData}
          confirmSubmit={sendMessage}
          onClose={resetTripStatus}
        />
      )}
    </>
  );
}
