const API_BASE_URL = "http://localhost:5000/api/stops";

export const fetchStopsByProjectId = async (
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
  if (searchTerm) url.searchParams.append("stop_name", searchTerm);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchStopsByProjectId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch stops failed: ${errorText}`);
  }
  const data = await response.json();
  return data;
};

export const fetchStopById = async (stopId, token) => {
  const response = await fetch(`${API_BASE_URL}?stop_id=${stopId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stop");
  return response.json();
};

export const deleteStopById = async (stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/delete/${stopId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete stop");
  return response.json();
};

export const updateStop = async (stopData, stopId, token) => {
  const response = await fetch(`${API_BASE_URL}/update/${stopId}`, {
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
  const response = await fetch(`${API_BASE_URL}/create`, {
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

export const fetchAllStopsByProjectId = async (projectId, token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  if (!projectId) {
    throw new Error('Project ID is required');
  }

  const url = new URL(`${API_BASE_URL}/all`);
  url.searchParams.append("project_id", projectId);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in fetchAllStopsByProjectId!", response.status, errorText);
    throw new Error(`Fetch all stops failed: ${errorText}`);
  }

  const data = await response.json();
  return data;
};
