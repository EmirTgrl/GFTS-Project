const API_BASE_URL = "http://localhost:5000/api/shapes";

export const fetchShapesByTripId = async (projectId, tripId, token) => {
  const response = await fetch(
    `${API_BASE_URL}?project_id=${projectId}&trip_id=${tripId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch shapes:", response.status, errorText);
    throw new Error(`Failed to fetch shapes: ${errorText}`);
  }
  return response.json();
};

export const deleteShape = async (shape_id, shape_pt_sequence, token) => {
  const response = await fetch(
    `${API_BASE_URL}/delete/${shape_id}/${shape_pt_sequence}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete shape: ${errorText}`);
  }
  return response.json();
};