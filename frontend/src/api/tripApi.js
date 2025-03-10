const API_BASE_URL = "http://localhost:5000/api/trips";

export const fetchTripsByRouteId = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}?route_id=${routeId}`, {
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
  const response = await fetch(`${API_BASE_URL}?project_id=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch trips by project");
  return response.json();
};

export const fetchTripById = async (tripId, token) => {
  const response = await fetch(`${API_BASE_URL}?trip_id=${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch trip:", response.status, errorText);
    throw new Error(`Failed to fetch trip: ${errorText}`);
  }
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : data;
};

export const deleteTripById = async (tripId, token) => {
  const response = await fetch(`${API_BASE_URL}/delete/${tripId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete trip");
  return response.json();
};

export const updateTrip = async (tripData, token) => {
  const response = await fetch(`${API_BASE_URL}/update/${tripData.trip_id}`, {
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
  const response = await fetch(`${API_BASE_URL}/create`, {
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
