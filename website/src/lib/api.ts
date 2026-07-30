export function getBackendUrl(path: string = "") {
  if (typeof window === 'undefined') {
    const internalBackend = process.env.BACKEND_INTERNAL_URL || "http://localhost:3010";
    return `${internalBackend}${path.startsWith("/") ? path : `/${path}`}`;
  }
  
  return `/api/backend${path.startsWith("/") ? path : `/${path}`}`;
}
