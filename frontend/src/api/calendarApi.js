const API_BASE_URL = "http://localhost:5000/api/calendars";

export const fetchCalendarByServiceId = async (
  serviceId,
  token,
  page = 1,
  limit = 8
) => {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("service_id", serviceId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch calendars:", response.status, errorText);
    throw new Error(`Failed to fetch calendars: ${errorText}`);
  }
  return response.json();
};

export const fetchCalendarsByProjectId = async (
  projectId,
  token,
  page = 1,
  limit = 8
) => {
  const url = new URL(`${API_BASE_URL}`);
  url.searchParams.append("project_id", projectId);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", limit);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch calendars:", response.status, errorText);
    throw new Error(`Failed to fetch calendars: ${errorText}`);
  }
  const result = await response.json();
  return {
    data: result.data || [],
    total: result.total || 0,
  };
};

export const deleteCalendarById = async (serviceId, token) => {
  const response = await fetch(`${API_BASE_URL}/delete/${serviceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete calendar: ${errorText}`);
  }
  return response.json();
};

export const updateCalendar = async (calendarData, token) => {
  const response = await fetch(
    `${API_BASE_URL}/update/${calendarData.service_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(calendarData),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update calendar: ${errorText}`);
  }
  return response.json();
};

export const saveCalendar = async (calendarData, token) => {
  const response = await fetch(`${API_BASE_URL}/create`, {
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
