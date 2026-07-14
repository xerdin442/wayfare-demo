import { Coordinate, RideFare, UserType } from "../types";
import { API_URL, AUTH_TOKEN } from "../constants";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired. Please log in again.");
    this.name = "SessionExpiredError";
  }
}

async function refreshAccessToken(userType: UserType): Promise<string> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "X-User-Role": userType },
    credentials: "include",
  });

  if (!res.ok) {
    localStorage.removeItem(AUTH_TOKEN);
    throw new SessionExpiredError();
  }

  const body = await res.json();
  const token: string = body.data.token;
  localStorage.setItem(AUTH_TOKEN, token);
  return token;
}

export async function fetchWithAuth(
  url: string,
  userType: UserType,
  options: RequestInit = {},
): Promise<Response> {
  const doFetch = (token: string | null) =>
    fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        "X-User-Role": userType,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  const token = localStorage.getItem(AUTH_TOKEN);
  let res = await doFetch(token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken(userType);
    res = await doFetch(newToken);
  }

  return res;
}

export async function sendRequest<T, K>(
  url: string,
  userType: UserType,
  payload?: T,
) {
  const response = await fetchWithAuth(`${API_URL}${url}`, userType, {
    method: payload ? "POST" : "GET",
    body: payload ? JSON.stringify(payload) : null,
  });
  const result = (await response.json()) as {
    data?: K;
    message?: string;
    error?: string;
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

export interface StartTripRequest {
  rideFareId: string;
}

export interface PreviewTripRequest {
  regionId: string;
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
