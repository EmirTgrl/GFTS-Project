const API_BASE_URL = "http://localhost:5000/api/fares";

// 1. Fetch detailed fare for a route
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
      errorData.message || "Failed to fetch detailed fare for the route."
    );
  }

  return response.json();
};

// 2. Fetch all fare products
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
    throw new Error(errorData.message || "Failed to fetch fare products.");
  }

  return response.json();
};

// 3. Fetch all fare media
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
    throw new Error(errorData.message || "Failed to fetch fare media.");
  }

  return response.json();
};

// 4. Fetch all rider categories
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
    throw new Error(errorData.message || "Failed to fetch rider categories.");
  }

  return response.json();
};

// 5. Fetch all networks
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
    throw new Error(errorData.message || "Failed to fetch networks.");
  }

  return response.json();
};

// 6. Fetch all transfer rules
export const fetchAllFareTransferRules = async (project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/transfer-rules?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchAllFareTransferRules error:", errorData);
    throw new Error(errorData.message || "Failed to fetch transfer rules.");
  }

  return response.json();
};

// 7. Add a new fare product
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
    throw new Error(errorData.message || "Failed to add fare product.");
  }

  return response.json();
};

// 8. Add a new fare media
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
    throw new Error(errorData.message || "Failed to add fare media.");
  }

  return response.json();
};

// 9. Add a new rider category
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
    throw new Error(errorData.message || "Failed to add rider category.");
  }

  return response.json();
};

// 10. Add a new transfer rule
export const addFareTransferRule = async (
  project_id,
  token,
  fareTransferRuleData
) => {
  const response = await fetch(
    `${API_BASE_URL}/transfer-rules?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        from_leg_group_id: fareTransferRuleData.from_leg_group_id,
        to_leg_group_id: fareTransferRuleData.to_leg_group_id,
        transfer_count: fareTransferRuleData.transfer_count || 1,
        duration_limit: fareTransferRuleData.duration_limit || null,
        duration_limit_type: fareTransferRuleData.duration_limit_type || null,
        fare_transfer_type: fareTransferRuleData.fare_transfer_type,
        fare_product_id: fareTransferRuleData.fare_product_id || null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("addFareTransferRule error:", errorData);
    throw new Error(errorData.message || "Failed to add transfer rule.");
  }

  return response.json();
};

// 11. Create fare for a route
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
    throw new Error(
      errorData.message || "Failed to create fare for the route."
    );
  }

  return response.json();
};

// 12. Update fare product
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
    throw new Error(errorData.message || "Failed to update fare product.");
  }

  return response.json();
};

// 13. Delete fare product
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
    throw new Error(
      errorData.message || "The fare product could not be deleted."
    );
  }

  return response.json();
};

// 14. Update fare media
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
    throw new Error(
      errorData.message || "Payment method could not be updated."
    );
  }

  return response.json();
};

// 15. Delete fare media
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
    throw new Error(
      errorData.message || "Payment method could not be deleted."
    );
  }

  return response.json();
};

// 16. Update rider category
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
    throw new Error(
      errorData.message || "Passenger category could not be updated."
    );
  }

  return response.json();
};

// 17. Delete rider category
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
    throw new Error(
      errorData.message || "Passenger category could not be deleted."
    );
  }

  return response.json();
};

// 18. Update transfer rule
export const updateFareTransferRule = async (
  project_id,
  token,
  from_leg_group_id,
  to_leg_group_id,
  fareTransferRuleData
) => {
  const response = await fetch(
    `${API_BASE_URL}/transfer-rules/${from_leg_group_id}/${to_leg_group_id}?project_id=${project_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        transfer_count: fareTransferRuleData.transfer_count || 1,
        duration_limit: fareTransferRuleData.duration_limit || null,
        duration_limit_type: fareTransferRuleData.duration_limit_type || null,
        fare_transfer_type: fareTransferRuleData.fare_transfer_type,
        fare_product_id: fareTransferRuleData.fare_product_id || null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("updateFareTransferRule error:", errorData);
    throw new Error(errorData.message || "Transfer rule could not be updated.");
  }

  return response.json();
};

// 19. Delete transfer rule
export const deleteFareTransferRule = async (
  project_id,
  token,
  from_leg_group_id,
  to_leg_group_id
) => {
  const response = await fetch(
    `${API_BASE_URL}/transfer-rules/${from_leg_group_id}/${to_leg_group_id}?project_id=${project_id}`,
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
    console.error("deleteFareTransferRule error:", errorData);
    throw new Error(errorData.message || "Transfer rule could not be deleted.");
  }

  return response.json();
};

// 20. Fetch all leg groups
export const fetchAllLegGroups = async (project_id, token) => {
  const response = await fetch(
    `${API_BASE_URL}/leg-groups?project_id=${project_id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("fetchAllLegGroups error:", errorData);
    throw new Error(errorData.message || "Leg groups could not be retrieved.");
  }

  return response.json();
};

// 21. Add a new network
export const addNetwork = async (project_id, token, networkData) => {
  const response = await fetch(
    `${API_BASE_URL}/networks?project_id=${project_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        network_id: networkData.network_id,
        network_name: networkData.network_name,
        route_ids: networkData.route_ids || [],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("addNetwork error:", errorData);
    throw new Error(errorData.message || "Failed to add network.");
  }

  return response.json();
};

// 22. Delete network
export const deleteNetwork = async (project_id, token, network_id) => {
  const response = await fetch(
    `${API_BASE_URL}/networks/${network_id}?project_id=${project_id}`,
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
    console.error("deleteNetwork error:", errorData);
    throw new Error(errorData.message || "Failed to delete network.");
  }

  return response.json();
};

// 23. Ağı güncelle
export const updateNetwork = async (
  project_id,
  token,
  network_id,
  networkData
) => {
  const response = await fetch(
    `${API_BASE_URL}/networks/${network_id}?project_id=${project_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        network_name: networkData.network_name,
        route_ids: networkData.route_ids || [],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("updateNetwork error:", errorData);
    throw new Error(errorData.message || "Ağ güncellenemedi.");
  }

  return response.json();
};
