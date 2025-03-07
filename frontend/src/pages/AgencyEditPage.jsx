import { useState, useEffect, useContext } from "react";
import { updateAgency, fetchAgenciesByProjectId } from "../api/agencyApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const AgencyEditPage = ({ project_id, agency_id, onClose, setAgencies }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAgency = async () => {
      try {
        const agencies = await fetchAgenciesByProjectId(project_id, token);
        console.log("Fetched agencies:", agencies); // Debugging
        console.log("Looking for agency_id:", agency_id); // Debugging

        const agency = agencies.find(
          (ag) => ag.agency_id === parseInt(agency_id)
        ); // int türünde karşılaştırma
        if (agency) {
          setFormData({
            agency_id: agency.agency_id,
            agency_name: agency.agency_name || "",
            agency_url: agency.agency_url || "",
            agency_timezone: agency.agency_timezone || "",
            agency_lang: agency.agency_lang || "",
            agency_phone: agency.agency_phone || "",
          });
        } else {
          Swal.fire("Hata!", "Ajans bulunamadı.", "error");
          onClose();
        }
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Ajans yüklenirken hata oluştu: ${error.message}`,
          "error"
        );
      }
    };
    loadAgency();
  }, [token, project_id, agency_id, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData?.agency_name ||
      !formData?.agency_url ||
      !formData?.agency_timezone
    ) {
      Swal.fire("Hata!", "Ajans adı, URL ve zaman dilimi zorunludur!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ajansı güncellemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, güncelle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const agencyData = { project_id, ...formData };
        const updatedAgency = await updateAgency(agencyData, token);
        setAgencies(
          (prev) =>
            prev.map((ag) =>
              ag.agency_id === parseInt(agency_id) ? updatedAgency : ag
            ) // int türünde karşılaştırma
        );
        Swal.fire("Güncellendi!", "Ajans başarıyla güncellendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Ajans güncellenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!formData) return <p>Yükleniyor...</p>;

  return (
    <div className="form-container">
      <h5>Ajans Düzenle</h5>
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
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

AgencyEditPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  agency_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setAgencies: PropTypes.func.isRequired,
};

export default AgencyEditPage;
