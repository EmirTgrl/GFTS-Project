const API_BASE_URL = "http://localhost:5000/api/calendars";

export const fetchCalendarByServiceId = async (serviceId, token) => {
  const response = await fetch(`${API_BASE_URL}?service_id=${serviceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch calendar:", response.status, errorText);
    throw new Error(`Failed to fetch calendar: ${errorText}`);
  }
  const data = await response.json();
  return data; 
};

export const fetchCalendarsByProjectId = async (projectId, token) => {
  const response = await fetch(`${API_BASE_URL}?project_id=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch calendars:", response.status, errorText);
    throw new Error(`Failed to fetch calendars: ${errorText}`);
  }
  return response.json(); 
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
