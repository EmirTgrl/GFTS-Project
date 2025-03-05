const API_BASE_URL = "http://localhost:5000/api/calendars";

export const fetchCalendarByServiceId = async (serviceId, token) => {
  const response = await fetch(`${API_BASE_URL}/${serviceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "HTTP error in fetchCalendarByServiceId!",
      response.status,
      errorText
    );
    throw new Error(`Fetch calendar failed: ${errorText}`);
  }
  return response.json();
};

export const fetchCalendarsByProjectId = async (projectId, token) => {
  const url = `${API_BASE_URL}/project/${projectId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch calendars:", response.status, errorText);
    throw new Error("Failed to fetch calendars by project");
  }
  return response.json();
};

export const fetchCalendarById = async (serviceId, token) => {
  const response = await fetch(`${API_BASE_URL}/${serviceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch calendar");
  return response.json();
};

export const deleteCalendarById = async (serviceId, token) => {
  const response = await fetch(`${API_BASE_URL}/${serviceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to delete calendar");
  return response.json();
};

export const updateCalendar = async (calendarData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(calendarData),
  });
  if (!response.ok) throw new Error("Failed to update calendar");
  return response.json();
};

export const saveCalendar = async (calendarData, token) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(calendarData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save calendar: ${errorText}`);
  }
  return response.json();
};
