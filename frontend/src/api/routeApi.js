const API_BASE_URL = "http://localhost:5000/api/routes";

export const fetchRoutesByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}?project_id=${projectId}`, {
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

export const fetchRoutesByAgencyId = async (
  agencyId,
  projectId,
  token,
  page = 1,
  limit = 8,
  searchTerm = ""
) => {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("project_id", projectId);
  url.searchParams.append("agency_id", agencyId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);
  if (searchTerm) url.searchParams.append("route_long_name", searchTerm);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to fetch routes by agency:",
      response.status,
      errorText
    );
    throw new Error(`Failed to fetch routes by agency: ${errorText}`);
  }
  const data = await response.json();
  console.log("fetchRoutesByAgencyId response:", data); // Debug için
  return data; // { data: [], total: X } bekleniyor
};

export const fetchRouteById = async (routeId, projectId, token) => {
  const response = await fetch(
    `${API_BASE_URL}?project_id=${projectId}&route_id=${routeId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch route:", response.status, errorText);
    throw new Error(`Failed to fetch route: ${errorText}`);
  }
  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : data;
};

export const deleteRouteById = async (routeId, token) => {
  const response = await fetch(`${API_BASE_URL}/delete/${routeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete route");
  return response.json();
};

export const updateRoute = async (routeData, token) => {
  const response = await fetch(`${API_BASE_URL}/update/${routeData.route_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(routeData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update route: ${errorText}`);
  }
  return response.json();
};

export const saveRoute = async (routeData, token) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(routeData),
  });
  if (!response.ok) throw new Error("Failed to save route");
  return response.json();
};
