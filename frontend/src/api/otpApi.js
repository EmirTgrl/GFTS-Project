const API_BASE_URL = "http://localhost:5000/api/otp";

export const planTrip = async (tripData, token) => {
  if (!token || token.trim() === "") {
    throw new Error("No valid authentication token provided");
  }

  const {
    fromLat,
    fromLon,
    toLat,
    toLon,
    date,
    time,
    mode = "TRANSIT,WALK",
  } = tripData;

  if (!fromLat || !fromLon || !toLat || !toLon || !date || !time) {
    throw new Error("Missing required trip parameters");
  }

  const queryParams = new URLSearchParams({
    fromLat,
    fromLon,
    toLat,
    toLon,
    date,
    time,
    mode,
  });

  const response = await fetch(`${API_BASE_URL}/plan?${queryParams}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to plan trip: ${errorText}`);
  }

  return response.json();
};
