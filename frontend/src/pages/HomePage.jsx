import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";

const HomePage = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      alert("You must be logged in to upload data.");
      navigate("/auth");
      return;
    }

    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/import-gtfs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Data importing successful!");
        navigate("/map");
      } else {
        alert(`Error: ${data.message || "An error occurred during import!"}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to connect to the server. Please try again.");
    }
  };

  return (
    <div className="page-content">
      <h1>Home Page</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Load Data</button>
    </div>
  );
};

export default HomePage;
