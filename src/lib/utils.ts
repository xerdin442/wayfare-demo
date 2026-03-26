import { clsx, type ClassValue } from "clsx"
import Geohash from "latlon-geohash"
import L from "leaflet";
import { twMerge } from "tailwind-merge"

export const DriverMarker = new L.Icon({
  iconUrl: "/car.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

export const TripPickupMarker = new L.Icon({
  iconUrl: "/user.png",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

export const TripDestinationMarker = new L.Icon({
  iconUrl: "/location-pin.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertSecondsToMinutes(seconds: number) {
  return `${Math.floor(seconds / 60)} minutes`
}

export function convertMetersToKilometers(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`
}

export function decodeGeoHash(geohash: string) {
  const bounds = Geohash.bounds(geohash);
  return {
    latitude: [bounds.sw.lat, bounds.ne.lat],
    longitude: [bounds.sw.lon, bounds.ne.lon],
  };
}

export const getGeohashBounds = (geohash: string) => {
  const { latitude: [minLat, maxLat], longitude: [minLng, maxLng] } = decodeGeoHash(geohash);
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
};