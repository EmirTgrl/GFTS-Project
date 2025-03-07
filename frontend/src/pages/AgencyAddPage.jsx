import { useState, useContext } from "react";
import { saveAgency } from "../api/agencyApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const AgencyAddPage = ({ project_id, onClose, setAgencies }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    agency_name: "",
    agency_url: "",
    agency_timezone: "",
    agency_lang: "",
    agency_phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.agency_name ||
      !formData.agency_url ||
      !formData.agency_timezone
    ) {
      Swal.fire("Hata!", "Ajans adı, URL ve zaman dilimi zorunludur!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ajansı eklemek istediğinize emin misiniz?",
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
        const agencyData = { project_id, ...formData };
        const agency_id = await saveAgency(agencyData, token);
        setAgencies((prev) => [...prev, { ...agencyData, agency_id }]);
        Swal.fire("Eklendi!", "Ajans başarıyla eklendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Ajans eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Ajans Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="agency_name" className="form-label">
            Ajans Adı
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_name"
            name="agency_name"
            value={formData.agency_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_url" className="form-label">
            Ajans URL
          </label>
          <input
            type="url"
            className="form-control"
            id="agency_url"
            name="agency_url"
            value={formData.agency_url}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_timezone" className="form-label">
            Zaman Dilimi
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_timezone"
            name="agency_timezone"
            value={formData.agency_timezone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_lang" className="form-label">
            Dil (Opsiyonel)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_lang"
            name="agency_lang"
            value={formData.agency_lang}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_phone" className="form-label">
            Telefon (Opsiyonel)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_phone"
            name="agency_phone"
            value={formData.agency_phone}
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

AgencyAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setAgencies: PropTypes.func.isRequired,
};

export default AgencyAddPage;
