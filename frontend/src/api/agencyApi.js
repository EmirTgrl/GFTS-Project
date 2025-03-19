const API_BASE_URL = "http://localhost:5000/api/agencies";

export const fetchAgenciesByProjectId = async (
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
  if (searchTerm) url.searchParams.append("agency_name", searchTerm);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch agencies:", response.status, errorText);
    throw new Error(`Failed to fetch agencies: ${errorText}`);
  }
  return response.json();
};

export const saveAgency = async (agencyData, token) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(agencyData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save agency: ${errorText}`);
  }
  return response.json();
};

export const updateAgency = async (agencyData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/update/${agencyData.agency_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(agencyData),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update agency: ${errorText}`);
  }
  return response.json();
};

export const deleteAgencyById = async (agencyId, token) => {
  if (!agencyId || !token) {
    throw new Error(
      "Missing required parameters: " +
        (!agencyId ? "agencyId " : "") +
        (!token ? "token" : "")
    );
  }

  const response = await fetch(`${API_BASE_URL}/delete/${agencyId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete agency: ${errorText}`);
  }
  return response.status === 204 ? {} : response.json();
};
