const API_BASE_URL = "http://localhost:5000/api/stops";

export const fetchStopsByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stops by project");
  return response.json();
};

export const fetchStopById = async (stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/${stopId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stop");
  return response.json();
};

export const deleteStopById = async (stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/${stopId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete stop");
  return response.json();
};

export const updateStop = async (stopData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(stopData),
  });
  if (!response.ok) throw new Error("Failed to update stop");
  return response.json();
};

export const saveStop = async (stopData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(stopData),
  });
  if (!response.ok) throw new Error("Failed to save stop");
  return response.json();
};
