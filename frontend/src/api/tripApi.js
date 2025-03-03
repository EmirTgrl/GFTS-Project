const API_BASE_URL = "http://localhost:5000/api/trips";

export const fetchTripsByRouteId = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/route/${routeId}`, {
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

export const fetchTripsByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch trips by project");
  return response.json();
};

export const fetchTripById = async (tripId, token) => {
  const response = await fetch(`${API_BASE_URL}/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch trip");
  return response.json();
};

export const deleteTripById = async (tripId, token) => {
  const response = await fetch(`${API_BASE_URL}/${tripId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete trip");
  return response.json();
};

export const updateTrip = async (tripData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tripData),
  });
  if (!response.ok) throw new Error("Failed to update trip");
  return response.json();
};

export const saveTrip = async (tripData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tripData),
  });
  if (!response.ok) throw new Error("Failed to save trip");
  return response.json();
};
