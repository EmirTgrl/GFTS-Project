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

export const fetchProjects = async (token) => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Handle HTTP errors.  Crucially important!
    const errorText = await response.text(); // Get the error message
    console.error("HTTP error!", response.status, errorText);
    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
  }

  return response.json();
};

export const fetchRoutesByProjectId = async (project_id, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/project/${project_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchTripsByRouteId = async (route_id, token) => {
  const response = await fetch(`${API_BASE_URL}/trips/route/${route_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchCalendarByServiceId = async (service_id, token) => {
  const response = await fetch(`${API_BASE_URL}/calendars/${service_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchStopsAndStopTimesByTripId = async (trip_id, token) => {
  const response = await fetch(`${API_BASE_URL}/stop-times/stops/${trip_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};