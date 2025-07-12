const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/account`;

const makeApiRequest = async (endpoint, body, token) => {
  if (!token) {
    throw new Error("No authentication token provided");
  }
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Invalid or expired token");
      } else if (response.status === 400) {
        throw new Error(result.error || "Bad request: Invalid input");
      } else {
        throw new Error(result.error || "An unexpected error occurred");
      }
    }

    return result;
  } catch (error) {
    throw new Error(error.message || "Failed to process request");
  }
};

const updateEmail = async (newEmail, token) => {
  if (!newEmail) {
    throw new Error("Email is required");
  }
  return makeApiRequest("/update-email", { newEmail }, token);
};

const updatePassword = async (currentPassword, newPassword, token) => {
  if (!currentPassword || !newPassword) {
    throw new Error("Current and new passwords are required");
  }
  return makeApiRequest(
    "/update-password",
    { currentPassword, newPassword },
    token
  );
};

export { updateEmail, updatePassword };
