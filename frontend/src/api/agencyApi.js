const API_BASE_URL = "http://localhost:5000/api/agencies";

export const fetchAgenciesByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/project/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch agencies:", response.status, errorText);
    throw new Error("Failed to fetch agencies by project");
  }
  return response.json();
};

export const saveAgency = async (agencyData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
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
  const response = await fetch(`${API_BASE_URL}/${agencyData.agency_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(agencyData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update agency: ${errorText}`);
  }
  return response.json();
};

export const deleteAgencyById = async (agencyId, projectId, token) => {
  const response = await fetch(
    `${API_BASE_URL}/${agencyId}?project_id=${projectId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete agency: ${errorText}`);
  }
  return response.json();
};
