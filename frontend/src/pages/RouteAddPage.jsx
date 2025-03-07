import { useState, useEffect, useContext } from "react";
import { saveRoute, fetchAgenciesByProjectId } from "../api/routeApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const RouteAddPage = ({ project_id, onClose, setRoutes }) => {
  const { token } = useContext(AuthContext);
  const [routeData, setRouteData] = useState({
    agency_id: "",
    project_id,
    route_short_name: "",
    route_long_name: "",
    route_desc: "",
    route_type: "",
    route_url: "",
    route_color: "",
    route_text_color: "",
    route_sort_order: null,
    continuous_pickup: null,
    continuous_drop_off: null,
  });
  const [agencies, setAgencies] = useState([]);

  useEffect(() => {
    const loadAgencies = async () => {
      try {
        const agencyData = await fetchAgenciesByProjectId(project_id, token);
        setAgencies(agencyData);
        if (agencyData.length > 0) {
          setRouteData((prev) => ({
            ...prev,
            agency_id: agencyData[0].agency_id,
          }));
        }
      } catch (error) {
        console.error("Error loading agencies:", error);
      }
    };
    loadAgencies();
  }, [project_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRouteData((prev) => ({
      ...prev,
      [name]:
        name === "route_sort_order" ||
        name === "continuous_pickup" ||
        name === "continuous_drop_off"
          ? value === ""
            ? null
            : parseInt(value, 10) || null
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu rotayı eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        const routeData = { project_id, ...routeData };
        const route_id = await saveRoute(routeData, token);
        setRoutes((prev) => [...prev, { ...routeData, route_id }]);
        Swal.fire("Eklendi!", "Rota başarıyla eklendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Rota eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Rota Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="agency_id" className="form-label">
            Ajans
          </label>
          <select
            id="agency_id"
            name="agency_id"
            className="form-control"
            value={routeData.agency_id}
            onChange={handleChange}
            required
          >
            <option value="">Bir ajans seçin</option>
            {agencies.map((agency) => (
              <option key={agency.agency_id} value={agency.agency_id}>
                {agency.agency_name || agency.agency_id}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="route_short_name" className="form-label">
            Kısa Ad
          </label>
          <input
            type="text"
            id="route_short_name"
            name="route_short_name"
            className="form-control"
            value={routeData.route_short_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_long_name" className="form-label">
            Uzun Ad
          </label>
          <input
            type="text"
            id="route_long_name"
            name="route_long_name"
            className="form-control"
            value={routeData.route_long_name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_type" className="form-label">
            Rota Türü
          </label>
          <select
            id="route_type"
            name="route_type"
            className="form-control"
            value={routeData.route_type}
            onChange={handleChange}
            required
          >
            <option value="">Seçiniz</option>
            <option value="0">0 - Tramvay</option>
            <option value="1">1 - Metro</option>
            <option value="2">2 - Tren</option>
            <option value="3">3 - Otobüs</option>
            <option value="4">4 - Feribot</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="route_desc" className="form-label">
            Açıklama
          </label>
          <input
            type="text"
            id="route_desc"
            name="route_desc"
            className="form-control"
            value={routeData.route_desc}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_url" className="form-label">
            URL
          </label>
          <input
            type="text"
            id="route_url"
            name="route_url"
            className="form-control"
            value={routeData.route_url}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_color" className="form-label">
            Rota Rengi
          </label>
          <input
            type="text"
            id="route_color"
            name="route_color"
            className="form-control"
            value={routeData.route_color}
            onChange={handleChange}
            placeholder="Ör: FF0000"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_text_color" className="form-label">
            Metin Rengi
          </label>
          <input
            type="text"
            id="route_text_color"
            name="route_text_color"
            className="form-control"
            value={routeData.route_text_color}
            onChange={handleChange}
            placeholder="Ör: 000000"
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            Ekle
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

RouteAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setRoutes: PropTypes.func.isRequired,
};

export default RouteAddPage;
