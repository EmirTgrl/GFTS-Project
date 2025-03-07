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

export const deleteProject = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in deleteProject!", response.status, errorText);
    throw new Error(
      `HTTP error! Status: ${response.status}, Message: ${errorText}`
    );
  }
  return response.json();
};

export const exportProject = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}/io/export/${projectId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in exportProject!", response.status, errorText);
    throw new Error(
      `HTTP error! Status: ${response.status}, Message: ${errorText}`
    );
  }
  const blob = await response.blob();
  const link = response.headers
    .get("content-disposition")
    .split("filename=")[1]
    .replaceAll('"', "");
  return { blob, link };
};

export const createProject = async (projectName, token) => {
  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ file_name: projectName }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTTP error in createProject!", response.status, errorText);
    throw new Error(
      `HTTP error! Status: ${response.status}, Message: ${errorText}`
    );
  }
  return response.json();
};
