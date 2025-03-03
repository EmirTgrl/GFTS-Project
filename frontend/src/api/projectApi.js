const API_BASE_URL = "http://localhost:5000/api";

export const fetchProjects = async (token) => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in fetchProjects!", response.status, errorText);
    throw new Error(
      `HTTP error! Status: ${response.status}, Message: ${errorText}`
    );
  }
  return response.json();
};
