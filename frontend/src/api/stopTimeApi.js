const API_BASE_URL = "http://localhost:5000/api/stop-times";

export const fetchStopsAndStopTimesByTripId = async (
  tripId,
  projectId,
  token,
  page = 1,
  limit = 8,
  searchTerm = ""
) => {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("project_id", projectId);
  url.searchParams.append("trip_id", tripId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);
  if (searchTerm) url.searchParams.append("stop_name", searchTerm);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to fetch stops and stop times:",
      response.status,
      errorText
    );
    throw new Error(`Failed to fetch stops and stop times: ${errorText}`);
  }
  return response.json();
};

export const fetchStopTimesByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}?project_id=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stop times by project");
  return response.json();
};

export const fetchStopTimeById = async (tripId, stopId, token) => {
  const response = await fetch(
    `${API_BASE_URL}?trip_id=${tripId}&stop_id=${stopId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchStopTimeById!",
      response.status,
      errorText
    );
    throw new Error(`Failed to fetch stop time: ${errorText}`);
  }
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : data;
};

export const deleteStopTimeById = async (tripId, stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/delete/${tripId}/${stopId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete stop time");
  return response.json();
};

export const updateStopTime = async (stopTimeData, tripId, stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/update/${tripId}/${stopId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(stopTimeData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in updateStopTime!", response.status, errorText);
    throw new Error(`Failed to update stop time: ${errorText}`);
  }
  return response.json();
};

export const saveStopTime = async (stopTimeData, token) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(stopTimeData),
  });
  if (!response.ok) throw new Error("Failed to save stop time");
  return response.json();
};
