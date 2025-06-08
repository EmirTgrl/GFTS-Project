const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const fetchProjects = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP hatası fetchProjects!", response.status, errorText);
      throw new Error(
        `HTTP hatası! Durum: ${response.status}, Mesaj: ${errorText}`
      );
    }
    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error("Projeleri yükleme hatası:", error);
    throw error;
  }
};

export const deleteProject = async (projectId, token) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/projects/delete/${projectId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP hatası deleteProject!", response.status, errorText);
      throw new Error(
        `HTTP hatası! Durum: ${response.status}, Mesaj: ${errorText}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Proje silme hatası:", error);
    throw error;
  }
};

export const exportProject = async (projectId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/io/export/${projectId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP hatası exportProject!", response.status, errorText);
      throw new Error(
        `HTTP hatası! Durum: ${response.status}, Mesaj: ${errorText}`
      );
    }

    const blob = await response.blob();
    if (!blob || !(blob instanceof Blob)) {
      throw new Error("Geçersiz blob yanıtı alındı.");
    }

    let filename = `project-${projectId}.zip`; // Yedek dosya adı
    const disposition = response.headers.get("Content-Disposition");
    if (disposition) {
      const match = disposition.match(/filename="(.+)"/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    return { blob, filename };
  } catch (error) {
    console.error("Dışa aktarma hatası:", error);
    throw error;
  }
};

export const createProject = async (projectName, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ file_name: projectName }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP hatası createProject!", response.status, errorText);
      throw new Error(
        `HTTP hatası! Durum: ${response.status}, Mesaj: ${errorText}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Proje oluşturma hatası:", error);
    throw error;
  }
};
