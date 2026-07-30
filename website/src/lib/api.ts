export function getBackendUrl(path: string = "") {
  const isDev = process.env.NODE_ENV === "development";
  const baseUrl = isDev ? "http://localhost:3000" : "https://agendazap-backend.onrender.com"; // Adjust production URL accordingly
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
