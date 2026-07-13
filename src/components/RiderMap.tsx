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
import { MapPin, MapPinned, CarFront } from "lucide-react";
import {
  PreviewTripResponse,
  PreviewTripRequest,
  StartTripRequest,
  StartTripResponse,
  sendRequest,
  InitiateCheckoutRequest,
  InitiateCheckoutResponse,
  LocationDataResponse,
} from "@/lib/contracts/http";
import { TripEvents } from "@/lib/contracts/websocket";
import { TripOverview, RideFare, Rider, Coordinate } from "@/lib/types";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { useRiderStreamConnection } from "@/hooks/useRiderStreamConnection";
import { DriverCard } from "./DriverCard";
import LoadingMap from "./LoadingMap";
import MapSearchOverlay from "./MapSearchOverlay";
import { RiderTripOverview } from "./RiderTripOverview";
import TripRatingModal from "./TripRatingModal";
import UnsupportedRegion from "./UnsupportedRegion";

export default function RiderMap({ user }: { user: Rider }) {
  const [tripOverview, setTripOverview] = useState<TripOverview | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");

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

  useEffect(() => {
    if (!mapPosition) return;
    mapCenterRef.current = [mapPosition[1], mapPosition[0]];
  }, [mapPosition]);

  const lat = location?.latitude;
  const lon = location?.longitude;
  useEffect(() => {
    if (tripOverview) return;

    async function getCurrentAddress() {
      if (!lat || !lon) return;
      const params = new URLSearchParams({
        lat: `${lat}`,
        lon: `${lon}`,
      });

      const res = await fetch(`/api/geocode?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as LocationDataResponse;
      setCurrentAddress(data.display_name);
    }

    getCurrentAddress();
  }, [lat, lon, tripOverview]);

  const handleSelectSuggestion = async (
    lat: number,
    lon: number,
    address: string,
  ) => {
    if (tripOverview) return;
    if (!location) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const newDestination: Coordinate = {
        latitude: lat,
        longitude: lon,
        address: address,
      };
      setDestination(newDestination);

      const pickup: Coordinate = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: currentAddress,
      };

      const data = await requestTripPreview(pickup, newDestination);
      if (!data) return;

      const route = data.rideFares[0].route;
      const parsedRoute = route.geometry[0].coordinates.map(
        (coord) => [coord.longitude, coord.latitude] as [number, number],
      );

      setTripOverview({
        route: parsedRoute,
        rideFares: data.rideFares,
        distance: route.distance,
        duration: route.duration,
      });
    }, 500);
  };

  const requestTripPreview = async (
    pickup: Coordinate,
    destination: Coordinate,
  ): Promise<PreviewTripResponse | null> => {
    if (!regionBounds) return null;

    const payload: PreviewTripRequest = {
      regionId: regionBounds.region_id,
      pickup,
      destination,
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

    resetTripOverview();
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

  const resetTripOverview = () => {
    setTripOverview(null);
    setDestination(null);
    resetTripStatus();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className="relative flex flex-col md:flex-row h-screen">
        <div className={`relative ${destination ? "flex-[0.8]" : "flex-1"}`}>
          {mapPosition ? (
            <>
              <div style={{ height: "100%", width: "100%" }}>
                <Map
                  className="h-full w-full"
                  center={[mapPosition[1], mapPosition[0]]}
                  zoom={15}
                >
                  <MapControls position="bottom-right" showLocate />

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
                        <CarFront className="text-green-600" />
                      </MarkerContent>
                      <MarkerPopup>
                        <DriverCard driver={assignedDriver} />
                      </MarkerPopup>
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
                  {tripOverview && tripOverview.route.length > 1 && (
                    <MapRoute
                      coordinates={tripOverview.route}
                      color="#2563eb"
                      width={4}
                    />
                  )}
                </Map>
              </div>

              <MapSearchOverlay
                regionBounds={regionBounds}
                tripOverview={!!tripOverview}
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
            trip={tripOverview}
            assignedDriver={assignedDriver}
            status={tripStatus}
            handleStartTrip={handleStartTrip}
            handleCheckout={handleCheckout}
            handleCashPayment={handleCashPayment}
            handleCancelTrip={handleCancelTrip}
            onReset={resetTripOverview}
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

      {regionBounds && regionBounds.unavailable && (
        <UnsupportedRegion message={regionBounds.error} />
      )}
    </>
  );
}
