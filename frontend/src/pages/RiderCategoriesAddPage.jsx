import { useState, useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { addRiderCategory } from "../api/fareApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

const RiderCategoriesAddPage = ({ project_id, onClose, onAdd }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    rider_category_name: "",
    is_default_fare_category: 0,
    eligibility_url: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.rider_category_name) {
      Swal.fire("Hata!", "Yolcu kategorisi adı zorunludur!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu yolcu kategorisini eklemek istediğinize emin misiniz?",
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
          rider_category_name: formData.rider_category_name,
          is_default_fare_category: parseInt(formData.is_default_fare_category),
          eligibility_url: formData.eligibility_url || null,
        };

        console.log("addRiderCategory payload:", payload);
        const response = await addRiderCategory(project_id, token, payload);
        console.log("addRiderCategory response:", response);

        Swal.fire(
          "Başarılı!",
          "Yolcu kategorisi başarıyla eklendi.",
          "success"
        );

        // Yeni kategoriyi üst bileşene ilet
        if (onAdd) {
          onAdd(response);
        }

        setFormData({
          rider_category_name: "",
          is_default_fare_category: 0,
          eligibility_url: "",
        });
      } catch (error) {
        console.error("Error:", error);
        Swal.fire(
          "Hata!",
          `Yolcu kategorisi eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Yolcu Kategorisi Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="rider_category_name" className="form-label">
            Kategori Adı (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="rider_category_name"
            name="rider_category_name"
            value={formData.rider_category_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="is_default_fare_category" className="form-label">
            Varsayılan Kategori
          </label>
          <select
            className="form-control"
            id="is_default_fare_category"
            name="is_default_fare_category"
            value={formData.is_default_fare_category}
            onChange={handleChange}
          >
            <option value="0">Hayır</option>
            <option value="1">Evet</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="eligibility_url" className="form-label">
            Uygunluk URL si
          </label>
          <input
            type="text"
            className="form-control"
            id="eligibility_url"
            name="eligibility_url"
            value={formData.eligibility_url}
            onChange={handleChange}
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

RiderCategoriesAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};

export default RiderCategoriesAddPage;
