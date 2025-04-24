const API_BASE_URL = "http://localhost:5000/api/fares";

// 1. Fare verilerini trip için detaylı al
export const fetchDetailedFareForTrip = async (trip_id, project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/trip/${trip_id}?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchDetailedFareForTrip error:", errorData);
    throw new Error(
      errorData.message || "Yolculuk için ücret detayları alınamadı."
    );
  }

  return response.json();
};

// 2. Tüm fare_products'ı al
export const fetchAllFareProducts = async (project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/products?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchAllFareProducts error:", errorData);
    throw new Error(errorData.message || "Ücret ürünleri alınamadı.");
  }

  return response.json();
};

// 3. Tüm fare_media'ları al
export const fetchAllFareMedia = async (project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/media?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchAllFareMedia error:", errorData);
    throw new Error(errorData.message || "Ödeme yöntemleri alınamadı.");
  }

  return response.json();
};

// 4. Tüm rider_categories'leri al
export const fetchAllRiderCategories = async (project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/categories?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchAllRiderCategories error:", errorData);
    throw new Error(errorData.message || "Yolcu kategorileri alınamadı.");
  }

  return response.json();
};

// 5. Tüm networks'ü al
export const fetchAllNetworks = async (project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/networks?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchAllNetworks error:", errorData);
    throw new Error(errorData.message || "Ağlar alınamadı.");
  }

  return response.json();
};

// 6. Fare ekle
export const createFareForTrip = async (
  project_id,
  trip_id,
  fareProductData,
  rider_category_id,
  media_id = null,
  timeframe_id = null,
  network_name = "Default Network",
  token
) => {
  const response = await fetch(
    `${API_BASE_URL}/trip/${trip_id}?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fareProductData,
        rider_category_id,
        media_id,
        timeframe_id,
        network_name,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("createFareForTrip error:", errorData);
    throw new Error(errorData.message || "Ücret oluşturulamadı.");
  }

  return response.json();
};
