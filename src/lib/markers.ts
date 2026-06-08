import L from "leaflet";

export const getMapMarkers = () => {
  if (typeof window === "undefined") return null;

  return {
    DriverMarker: new L.Icon({
      iconUrl: "/car.png",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    }),
    TripPickupMarker: new L.Icon({
      iconUrl: "/user.png",
      iconSize: [25, 25],
      iconAnchor: [15, 40],
    }),
    TripDestinationMarker: new L.Icon({
      iconUrl: "/location-pin.png",
      iconSize: [30, 30],
      iconAnchor: [20, 40],
    }),
  };
};
