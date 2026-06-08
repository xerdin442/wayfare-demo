import { Coordinate, RideFare, Driver, Rider } from "../types";
import { API_URL, AUTH_TOKEN } from "../constants";

export async function sendRequest<T, K>(
  url: string,
  method: string,
  requiresAuth: boolean,
  payload?: T,
) {
  const response = await fetch(`${API_URL}${url}`, {
    method,
    body: payload ? JSON.stringify(payload) : null,
    headers: {
      "Content-Type": "application/json",
      Authorization: requiresAuth ? `Bearer ${localStorage.getItem(AUTH_TOKEN)}` : "",
    },
  });

  const result = (await response.json()) as {
    data?: K,
    message?: string,
    error?: string
  };

  return { result, status: response.status };
}

export interface PreviewTripResponse {
  rideFares: RideFare[];
}

export interface StartTripResponse {
  tripId: string;
}

export interface InitiateCheckoutResponse {
  checkoutUrl: string;
}

export interface UserProfileResponse {
  user: Rider | Driver
}

export interface AuthResponse {
  token: string;
}

export interface StartTripRequest {
  rideFareId: string;
}

export interface PreviewTripRequest {
  pickup: Coordinate;
  destination: Coordinate;
}

export interface SignupDetails {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignupDriverRequest extends SignupDetails {
  profileImage: File;
  verificationPhotos: File[];
  carModel: string;
  carColor: string;
  carPlate: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export interface SignupRiderRequest extends SignupDetails {
  profileImage?: File;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface InitiateCheckoutRequest {
  email: string;
  tripRating?: number;
  riderComment?: string;
  driverTip?: number;
}

export interface LocationDataResponse {
  place_id: string;
  osm_id: string;
  osm_type: string;
  licence: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [min_lat, max_lat, min_lon, max_lon]
  class?: string;
  type?: string;
  importance?: number;
  display_name: string;
  display_place?: string;
  display_address?: string;
  address: {
    name?: string;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    state_code?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}