export type ApiMode = 'mock' | 'real';

export function getApiMode(): ApiMode {
  const configuredMode = import.meta.env.VITE_API_MODE?.trim().toLowerCase();

  if (configuredMode === 'mock') {
    return 'mock';
  }

  if (configuredMode === 'real' || configuredMode === 'api') {
    return 'real';
  }

  if (import.meta.env.VITE_API_MOCK !== undefined) {
    return import.meta.env.VITE_API_MOCK === 'false' ? 'real' : 'mock';
  }

  return import.meta.env.DEV && import.meta.env.MODE === 'development' ? 'mock' : 'real';
}

export function shouldUseMockApi() {
  return getApiMode() === 'mock';
}
