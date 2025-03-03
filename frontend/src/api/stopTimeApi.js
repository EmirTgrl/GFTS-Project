const API_BASE_URL = "http://localhost:5000/api/stop-times";

export const fetchStopsAndStopTimesByTripId = async (
  tripId,
  projectId,
  token
) => {
  const response = await fetch(`${API_BASE_URL}/stops/${projectId}/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stops and stop times");
  return response.json();
};

export const fetchStopTimesByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stop times by project");
  return response.json();
};

export const fetchStopTimeById = async (tripId, stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/${tripId}/${stopId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchStopTimeById!",
      response.status,
      errorText
    );
    throw new Error(`Failed to fetch stop time: ${errorText}`);
  }
  return response.json();
};

export const deleteStopTimeById = async (tripId, stopId, projectId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/${tripId}/${stopId}?project_id=${projectId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) throw new Error("Failed to delete stop time");
  return response.json();
};

export const updateStopTime = async (stopTimeData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
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
  const response = await fetch(`${API_BASE_URL}`, {
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
