const API_BASE_URL = "http://localhost:5000/api/shapes";

export const fetchShapesByTripId = async (projectId, shape_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}?project_id=${projectId}&shape_id=${shape_id}`,
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

export const updateShape = async (shape_pt_sequence, shapeData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/update/${shapeData.shape_id}/${shape_pt_sequence}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shapeData),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update shape: ${errorText}`);
  }
  return response.json();
};

export const saveShape = async (shapeData, token) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(shapeData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save shape: ${errorText}`);
  }
  return response.json();
};

export const saveMultipleShapes = async (shapesData, trip_id, token) => {
  const response = await fetch(`${API_BASE_URL}/create-multiple/${trip_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(shapesData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save shape: ${errorText}`);
  }
  return response.json();
};

export const snapShapesToRoads = async (
  shapes,
  token,
  osrmUrl = "http://localhost:5001"
) => {
  const coordinates = shapes
    .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
    .map((shape) => `${shape.shape_pt_lon},${shape.shape_pt_lat}`)
    .join(";");

  const url = `${osrmUrl}/match/v1/driving/${coordinates}?steps=false&geometries=geojson&overview=full`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "Failed to snap shapes to roads:",
      response.status,
      errorText
    );
    throw new Error(`Failed to snap shapes: ${errorText}`);
  }

  const data = await response.json();
  if (data.code !== "Ok") {
    throw new Error(`OSRM Match failed: ${data.message}`);
  }

  const snappedShapes = data.matchings[0].geometry.coordinates.map(
    (coord, index) => ({
      shape_id: shapes[0].shape_id,
      shape_pt_lat: coord[1],
      shape_pt_lon: coord[0],
      shape_pt_sequence: shapes[index]?.shape_pt_sequence || index + 1,
      project_id: shapes[0].project_id,
      shape_dist_traveled: null,
    })
  );

  return snappedShapes;
};
