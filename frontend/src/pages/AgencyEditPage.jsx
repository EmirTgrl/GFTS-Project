import { useState } from "react";
import PropTypes from "prop-types";
import { updateAgency } from "../api/agencyApi";

const AgencyEditPage = ({
  token,
  project_id,
  agency,
  setAgencies,
  onClose,
}) => {
  const [formData, setFormData] = useState({ ...agency });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setError("Ajans adı, URL ve zaman dilimi zorunludur!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const agencyData = {
        agency_id: agency.agency_id,
        project_id,
        ...formData,
      };
      await updateAgency(agencyData, token);
      setAgencies((prev) =>
        prev.map((a) =>
          a.agency_id === agency.agency_id ? { ...a, ...agencyData } : a
        )
      );
      onClose(); // Formu kapat
    } catch (err) {
      setError("Ajans güncellenirken bir hata oluştu.");
      console.error("Error updating agency:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header">Ajansı Düzenle</div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
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
          <div className="mb-3">
            <label htmlFor="agency_url" className="form-label">
              Ajans URL
            </label>
            <input
              type="url"
              className="form-control"
              id="agency_url"
              name="agency_url"
              value={formData.agency_url || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="agency_timezone" className="form-label">
              Zaman Dilimi
            </label>
            <input
              type="text"
              className="form-control"
              id="agency_timezone"
              name="agency_timezone"
              value={formData.agency_timezone || ""}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="agency_lang" className="form-label">
              Dil (Opsiyonel)
            </label>
            <input
              type="text"
              className="form-control"
              id="agency_lang"
              name="agency_lang"
              value={formData.agency_lang || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="agency_phone" className="form-label">
              Telefon (Opsiyonel)
            </label>
            <input
              type="text"
              className="form-control"
              id="agency_phone"
              name="agency_phone"
              value={formData.agency_phone || ""}
              onChange={handleChange}
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={loading}
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </form>
      </div>
    </div>
  );
};

AgencyEditPage.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  agency: PropTypes.object.isRequired,
  setAgencies: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AgencyEditPage;
