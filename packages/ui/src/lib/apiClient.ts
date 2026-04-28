export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly correlationId: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

export async function apiClient<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const correlationId = crypto.randomUUID();
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      'content-type': 'application/json',
      'x-correlation-id': correlationId,
      ...options.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    handleUnauthorized(response.status, options.skipAuthRedirect);
  }

  if (!response.ok) {
    throw new ApiError(response.statusText || 'API request failed', response.status, correlationId);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export function getStoredAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(accessToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function clearStoredAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

function handleUnauthorized(status: number, skipAuthRedirect?: boolean) {
  if (skipAuthRedirect) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('gc-project:auth-error', {
      detail: { status },
    }),
  );
}
