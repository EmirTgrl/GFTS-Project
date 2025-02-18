import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Lütfen bir dosya seçin");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/import-gtfs", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        alert("Veri başarıyla yüklendi!");
        navigate("/map");
      } else {
        alert("Bir hata oluştu!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Bir hata oluştu!");
    }
  };

  return (
    <div className="page-content">
      <h1>Ana Sayfa</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Veriyi Yükle</button>
    </div>
  );
};

export default HomePage;
