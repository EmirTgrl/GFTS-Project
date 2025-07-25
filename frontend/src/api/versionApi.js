const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/versions`;

export const fetchAllVersions = async (token) => {
  const response = await fetch(`${API_BASE_URL}`, {
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
