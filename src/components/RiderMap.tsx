"use client";

import { useRef, useState, useEffect } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  MapControls,
} from "./ui/map";
import { MapPin, Car, MapPinned } from "lucide-react";
import {
  PreviewTripResponse,
  PreviewTripRequest,
  StartTripRequest,
  StartTripResponse,
  sendRequest,
  InitiateCheckoutRequest,
  InitiateCheckoutResponse,
} from "@/lib/contracts/http";
import { TripEvents } from "@/lib/contracts/websocket";
import { TripPreview, RideFare, Rider } from "@/lib/types";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { useRiderStreamConnection } from "@/hooks/useRiderStreamConnection";
import { DriverCard } from "./DriverCard";
import LoadingMap from "./LoadingMap";
import MapSearchOverlay from "./MapSearchOverlay";
import { RiderTripOverview } from "./RiderTripOverview";
import TripRatingModal from "./TripRatingModal";

export default function RiderMap({ user }: { user: Rider }) {
  const [tripPreview, setTripPreview] = useState<TripPreview | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  const mapCenterRef = useRef<[number, number] | null>(null);
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

  const handleSelectSuggestion = async (
    lat: number,
    lon: number,
    address: string,
  ) => {
    if (tripPreview) return;
    if (!location) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setDestination([lat, lon]);

      const data = await requestRidePreview(
        [location.latitude, location.longitude],
        [lat, lon],
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

    const payload: InitiateCheckoutRequest = {
      email: user.email,
      tripRating: rating,
      riderComment: comment,
      driverTip: tip,
    };

    const { result } = await sendRequest<
      InitiateCheckoutRequest,
      InitiateCheckoutResponse
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

  useEffect(() => {
    if (!mapPosition) return;
    mapCenterRef.current = [mapPosition[1], mapPosition[0]];
  }, [mapPosition]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="relative flex flex-col md:flex-row h-screen">
        <div className={`${destination ? "flex-[0.7]" : "flex-1"}`}>
          {mapPosition ? (
            <>
              <div style={{ height: "100%", width: "100%" }}>
                <Map
                  className="h-full w-full"
                  center={[mapPosition[1], mapPosition[0]]}
                  zoom={13}
                >
                  <MapControls position="top-right" showLocate />

                  {/* Pickup */}
                  <MapMarker
                    longitude={mapPosition[1]}
                    latitude={mapPosition[0]}
                  >
                    <MarkerContent>
                      <MapPinned className="text-blue-600" />
                    </MarkerContent>
                  </MapMarker>

                  {/* Driver */}
                  {assignedDriver && driverLocation && (
                    <MapMarker
                      longitude={driverLocation.longitude}
                      latitude={driverLocation.latitude}
                    >
                      <MarkerContent>
                        <Car className="text-green-600" />
                      </MarkerContent>
                      <MarkerPopup>
                        <DriverCard driver={assignedDriver} />
                      </MarkerPopup>
                    </MapMarker>
                  )}

                  {/* Destination */}
                  {destination && (
                    <MapMarker
                      longitude={destination[1]}
                      latitude={destination[0]}
                    >
                      <MarkerContent>
                        <MapPin className="text-red-600" />
                      </MarkerContent>
                    </MapMarker>
                  )}

                  {/* Route */}
                  {tripPreview && tripPreview.route.length > 1 && (
                    <MapRoute
                      coordinates={tripPreview.route}
                      color="#2563eb"
                      width={4}
                    />
                  )}
                </Map>
              </div>

              <MapSearchOverlay
                regionBounds={regionBounds}
                onSelect={(lat, lon, address) =>
                  handleSelectSuggestion(lat, lon, address)
                }
              />
            </>
          ) : (
            <LoadingMap />
          )}
        </div>

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
