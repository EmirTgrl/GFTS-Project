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
    body: JSON.stringify(
      shapesData.map((shape) => ({
        ...shape,
        shape_id: parseInt(shape.shape_id),
      }))
    ),
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
  try {
    // Koordinatları sırala
    const sortedShapes = shapes.sort(
      (a, b) => a.shape_pt_sequence - b.shape_pt_sequence
    );

    // Örnekleme: Her 5 noktadan birini al (ihtiyaca göre ayarlanabilir)
    const samplingRate = 5;
    let sampledShapes = sortedShapes.filter(
      (_, index) => index % samplingRate === 0
    );

    // Eğer örnekleme sonrası çok az nokta kaldıysa, başlangıç ve bitiş noktalarını ekle
    if (sampledShapes.length < 2 && sortedShapes.length >= 2) {
      sampledShapes = [sortedShapes[0], sortedShapes[sortedShapes.length - 1]];
    } else if (sampledShapes.length === 0) {
      throw new Error("No valid shapes to snap after sampling.");
    }

    // Parçalara bölme: Her parçada maksimum 50 koordinat (ihtiyaca göre ayarlanabilir)
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < sampledShapes.length; i += chunkSize) {
      chunks.push(sampledShapes.slice(i, i + chunkSize));
    }

    const allSnappedShapes = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const coordinates = chunk
        .map((shape) => `${shape.shape_pt_lon},${shape.shape_pt_lat}`)
        .join(";");

      const url = `${osrmUrl}/match/v1/driving/${coordinates}?steps=false&geometries=geojson&overview=full`;

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Failed to snap shapes to roads (chunk " + i + "):",
          response.status,
          errorText
        );
        throw new Error(`Failed to snap shapes (chunk ${i}): ${errorText}`);
      }

      const data = await response.json();
      if (data.code !== "Ok") {
        throw new Error(`OSRM Match failed (chunk ${i}): ${data.message}`);
      }

      const snappedChunk = data.matchings[0].geometry.coordinates.map(
        (coord, index) => ({
          shape_id: shapes[0].shape_id,
          shape_pt_lat: coord[1],
          shape_pt_lon: coord[0],
          shape_pt_sequence: allSnappedShapes.length + index + 1,
          project_id: shapes[0].project_id,
          shape_dist_traveled: null,
        })
      );

      allSnappedShapes.push(...snappedChunk);
    }

    return allSnappedShapes;
  } catch (error) {
    console.error("Error in snapShapesToRoads:", error);
    throw new Error(`Failed to snap shapes to roads: ${error.message}`);
  }
};
