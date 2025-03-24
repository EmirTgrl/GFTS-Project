const API_BASE_URL = "http://localhost:5000/api/trips";

export const fetchTripsByRouteId = async (
  routeId,
  projectId,
  token,
  page = 1,
  limit = 8,
  searchTerm = ""
) => {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("project_id", projectId);
  url.searchParams.append("route_id", routeId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);
  if (searchTerm) url.searchParams.append("trip_short_name", searchTerm);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to fetch trips by routes:",
      response.status,
      errorText
    );
    throw new Error(`Failed to fetch trips by routes: ${errorText}`);
  }
  const data = await response.json();
  return data;
};

export const fetchTripsByProjectId = async (
  projectId,
  token,
  page = 1,
  limit = 8,
  searchTerm = ""
) => {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("project_id", projectId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);
  if (searchTerm) url.searchParams.append("trip_short_name", searchTerm);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to fetch trips by routes:",
      response.status,
      errorText
    );
    throw new Error(`Failed to fetch trips by routes: ${errorText}`);
  }
  const data = await response.json();
  return data;
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
