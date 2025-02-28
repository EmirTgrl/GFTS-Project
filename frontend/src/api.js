const API_BASE_URL = "http://localhost:5000/api";

export const fetchProjects = async (token) => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in fetchProjects!", response.status, errorText);
    throw new Error(
      `HTTP error! Status: ${response.status}, Message: ${errorText}`
    );
  }

  return response.json();
};

export const fetchRoutesByProjectId = async (project_id, token) => {
  const response = await fetch(`${API_BASE_URL}/routes/project/${project_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchRoutesByProjectId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch routes failed: ${errorText}`);
  }
  return response.json();
};

export const fetchTripsByRouteId = async (route_id, token) => {
  const response = await fetch(`${API_BASE_URL}/trips/route/${route_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchTripsByRouteId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch trips failed: ${errorText}`);
  }
  return response.json();
};

export const fetchCalendarByServiceId = async (service_id, token) => {
  const response = await fetch(`${API_BASE_URL}/calendars/${service_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchCalendarByServiceId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch calendar failed: ${errorText}`);
  }
  return response.json();
};

export const fetchStopsAndStopTimesByTripId = async (trip_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/stop-times/stops/${trip_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchStopsAndStopTimesByTripId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch stops and stop times failed: ${errorText}`);
  }

  return await response.json();
};
