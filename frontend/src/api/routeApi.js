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

export const fetchRouteById = async (routeId, projectId, token) => {
  const response = await fetch(`${API_BASE_URL}?project_id=${projectId},route_id=${routeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch route");
  return response.json();
};

export const deleteRouteById = async (routeId, projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/${projectId}/${routeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete route");
  return response.json();
};

export const updateRoute = async (routeData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(routeData),
  });
  if (!response.ok) throw new Error("Failed to update route");
  return response.json();
};

export const saveRoute = async (routeData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
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

export const fetchAgenciesByProjectId = async (projectId, token) => {
  const response = await fetch(
    `http://localhost:5000/api/agencies/project/${projectId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchAgenciesByProjectId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch agencies failed: ${errorText}`);
  }
  return response.json();
};
