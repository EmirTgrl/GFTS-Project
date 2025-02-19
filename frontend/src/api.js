const API_BASE_URL = "http://localhost:5000/api";

export const fetchRoutes = async () => {
  const response = await fetch(`${API_BASE_URL}/routes`);
  return response.json();
};

export const fetchStopsByRoute = async (routeId) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/stops`);
  return response.json();
};

export const fetchRouteTimes = async (routeId) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/times`);
  return response.json();
};

export const fetchBusesByRoute = async (routeId) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/buses`);
  return response.json();
};

export const fetchCalendarByRoute = async (routeId) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/calendar`);
  return response.json();
};

export const fetchTripsByRoute = async (routeId) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/trips`);
  return response.json();
};
