const API_BASE_URL = "http://localhost:5000/api/fares";

// 1. Fare verilerini rota için detaylı al
export const fetchDetailedFareForRoute = async (
  route_id,
  project_id,
  token
) => {
  const response = await fetch(
    `${API_BASE_URL}/route/${route_id}?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchDetailedFareForRoute error:", errorData);
    throw new Error(
      errorData.message || "Rota için ücret detayları alınamadı."
    );
  }

  return response.json();
};

// 2. Tüm ücret ürünlerini al
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

// 3. Tüm ödeme yöntemlerini al
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

// 4. Tüm yolcu kategorilerini al
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

// 5. Tüm ağları al
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

// 6. Yeni ücret ürünü ekle
export const addFareProduct = async (project_id, token, fareProductData) => {
  const response = await fetch(
    `${API_BASE_URL}/products?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fare_product_name: fareProductData.fare_product_name,
        amount: parseFloat(fareProductData.amount),
        currency: fareProductData.currency,
        rider_category_id: fareProductData.rider_category_id || null,
        fare_media_id: fareProductData.fare_media_id || null,
        network_id: fareProductData.network_id,
        route_id: fareProductData.route_id,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("addFareProduct error:", errorData);
    throw new Error(errorData.message || "Ücret ürünü eklenemedi.");
  }

  return response.json();
};

// 7. Yeni ödeme yöntemi ekle
export const addFareMedia = async (project_id, token, fareMediaData) => {
  const response = await fetch(
    `${API_BASE_URL}/media?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fare_media_name: fareMediaData.fare_media_name,
        fare_media_type: fareMediaData.fare_media_type,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("addFareMedia error:", errorData);
    throw new Error(errorData.message || "Ödeme yöntemi eklenemedi.");
  }

  return response.json();
};

// 8. Yeni yolcu kategorisi ekle
export const addRiderCategory = async (
  project_id,
  token,
  riderCategoryData
) => {
  const response = await fetch(
    `${API_BASE_URL}/categories?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(riderCategoryData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("addRiderCategory error:", errorData);
    throw new Error(errorData.message || "Yolcu kategorisi eklenemedi.");
  }

  return response.json();
};

// 9. Rota için ücret oluştur
export const createFareForRoute = async (
  project_id,
  route_id,
  fareProductData,
  rider_category_id,
  media_id = null,
  timeframe_id = null,
  network_name = "Default Network",
  token
) => {
  const response = await fetch(
    `${API_BASE_URL}/route/${route_id}?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fareProductData: {
          fare_product_name: fareProductData.fare_product_name,
          amount: fareProductData.amount,
          currency: fareProductData.currency,
        },
        rider_category_id,
        media_id,
        timeframe_id,
        network_name,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("createFareForRoute error:", errorData);
    throw new Error(errorData.message || "Ücret oluşturulamadı.");
  }

  return response.json();
};

// 10. Ücret ürününü güncelle
export const updateFareProduct = async (
  project_id,
  token,
  fare_product_id,
  fareProductData
) => {
  const response = await fetch(
    `${API_BASE_URL}/products/${fare_product_id}?project_id=${project_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fare_product_name: fareProductData.fare_product_name,
        amount: parseFloat(fareProductData.amount),
        currency: fareProductData.currency,
        rider_category_id: fareProductData.rider_category_id || null,
        fare_media_id: fareProductData.fare_media_id || null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("updateFareProduct error:", errorData);
    throw new Error(errorData.message || "Ücret ürünü güncellenemedi.");
  }

  return response.json();
};

// 11. Ücret ürününü sil
export const deleteFareProduct = async (project_id, token, fare_product_id) => {
  const response = await fetch(
    `${API_BASE_URL}/products/${fare_product_id}?project_id=${project_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("deleteFareProduct error:", errorData);
    throw new Error(errorData.message || "Ücret ürünü silinemedi.");
  }

  return response.json();
};

// 12. Ödeme yöntemini güncelle
export const updateFareMedia = async (
  project_id,
  token,
  fare_media_id,
  fareMediaData
) => {
  const response = await fetch(
    `${API_BASE_URL}/media/${fare_media_id}?project_id=${project_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fare_media_name: fareMediaData.fare_media_name,
        fare_media_type: fareMediaData.fare_media_type,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("updateFareMedia error:", errorData);
    throw new Error(errorData.message || "Ödeme yöntemi güncellenemedi.");
  }

  return response.json();
};

// 13. Ödeme yöntemini sil
export const deleteFareMedia = async (project_id, token, fare_media_id) => {
  const response = await fetch(
    `${API_BASE_URL}/media/${fare_media_id}?project_id=${project_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("deleteFareMedia error:", errorData);
    throw new Error(errorData.message || "Ödeme yöntemi silinemedi.");
  }

  return response.json();
};

// 14. Yolcu kategorisini güncelle
export const updateRiderCategory = async (
  project_id,
  token,
  rider_category_id,
  riderCategoryData
) => {
  const response = await fetch(
    `${API_BASE_URL}/categories/${rider_category_id}?project_id=${project_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rider_category_name: riderCategoryData.rider_category_name,
        is_default_fare_category:
          riderCategoryData.is_default_fare_category || 0,
        eligibility_url: riderCategoryData.eligibility_url || null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("updateRiderCategory error:", errorData);
    throw new Error(errorData.message || "Yolcu kategorisi güncellenemedi.");
  }

  return response.json();
};

// 15. Yolcu kategorisini sil
export const deleteRiderCategory = async (
  project_id,
  token,
  rider_category_id
) => {
  const response = await fetch(
    `${API_BASE_URL}/categories/${rider_category_id}?project_id=${project_id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("deleteRiderCategory error:", errorData);
    throw new Error(errorData.message || "Yolcu kategorisi silinemedi.");
  }

  return response.json();
};
