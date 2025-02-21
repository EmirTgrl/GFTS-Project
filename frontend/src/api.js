const API_BASE_URL = "http://localhost:5000/api";

export const fetchRoutes = async (token) => {
  const response = await fetch(`${API_BASE_URL}/routes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchStopsByRoute = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/stops`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchRouteTimes = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/times`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchBusesByRoute = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/buses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchCalendarByRoute = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/calendar`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchTripsByRoute = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/${routeId}/trips`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};
