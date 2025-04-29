import { useState, useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { addFareMedia } from "../api/fareApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

const FareMediaAddPage = ({ project_id, onClose, onAdd }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fare_media_name: "",
    fare_media_type: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fare_media_name) {
      Swal.fire("Hata!", "Ödeme yöntemi adı zorunludur!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ödeme yöntemini eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const payload = {
          fare_media_name: formData.fare_media_name,
          fare_media_type: parseInt(formData.fare_media_type),
        };

        console.log("addFareMedia payload:", payload);
        const response = await addFareMedia(project_id, token, payload);
        console.log("addFareMedia response:", response);

        Swal.fire("Başarılı!", "Ödeme yöntemi başarıyla eklendi.", "success");

        // Yeni ödeme yöntemini üst bileşene ilet
        if (onAdd) {
          onAdd(response);
        }

        setFormData({
          fare_media_name: "",
          fare_media_type: 0,
        });
      } catch (error) {
        console.error("Error:", error);
        Swal.fire(
          "Hata!",
          `Ödeme yöntemi eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Ödeme Yöntemi Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="fare_media_name" className="form-label">
            Ödeme Yöntemi Adı (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="fare_media_name"
            name="fare_media_name"
            value={formData.fare_media_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="fare_media_type" className="form-label">
            Ödeme Yöntemi Türü (*)
          </label>
          <input
            className="form-control"
            id="fare_media_type"
            name="fare_media_type"
            value={formData.fare_media_type}
            onChange={handleChange}
            required
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

FareMediaAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};

export default FareMediaAddPage;
