import { API_URL, AUTH_TOKEN } from "@/lib/constants";
import { UserType } from "@/lib/types";

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired. Please log in again.");
    this.name = "SessionExpiredError";
  }
}

async function refreshAccessToken(userType: UserType): Promise<string> {
  console.log('Refresh request...')
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
