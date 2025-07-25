const PAYMENT_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/payment`;
const ADMIN_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/admin`;

export const fetchVersions = async (token) => {
  const response = await fetch(`${ADMIN_API_BASE_URL}/versions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch versions: ${errorText}`);
  }
  return response.json();
};

export const initializePayment = async (versionId, token) => {
  const response = await fetch(`${PAYMENT_API_BASE_URL}/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ versionId }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initialize payment: ${errorText}`);
  }
  return response.json();
};
