const API_BASE_URL = "http://localhost:5000/api/stats";

export const fetchGlobalStats = async (token) => {
  if (!token || token.trim() === "") {
    throw new Error("No valid authentication token provided");
  }

  const response = await fetch(`${API_BASE_URL}/global`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch global statistics: ${errorText}`);
  }

  return response.json();
};
