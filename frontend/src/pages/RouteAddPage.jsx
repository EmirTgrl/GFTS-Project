import { useState, useContext } from "react";
import { saveRoute } from "../api/routeApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { useTranslation } from "react-i18next";

const RouteAddPage = ({ onClose, setRoutes, selectedAgency, project_id }) => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [routeData, setRouteData] = useState({
    route_id: "",
    agency_id: selectedAgency?.agency_id || "",
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
    if (
      !routeData.route_id ||
      !routeData.route_short_name ||
      !routeData.route_type
    ) {
      Swal.fire(
        t("Error!"),
        t("Route ID, short name and route type are required!"),
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Are you sure you want to add this route?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t("Yes, add!"),
      cancelButtonText: t("No"),
    });

    if (result.isConfirmed) {
      try {
        const newRoute = { ...routeData, agency_id: selectedAgency.agency_id };
        const response = await saveRoute(newRoute, token);
        const route_id = response.route_id;
        setRoutes((prev) => ({
          ...prev,
          data: [...prev.data, { ...newRoute, route_id }],
        }));
        Swal.fire(t("Added!"), t("Route successfully added."), "success");
        onClose();
      } catch (error) {
        Swal.fire(
          t("Error!"),
          t("Error while adding a route:") + " " + error.message,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      {/* <h5>{t("Add New Route")}</h5> */}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="route_id" className="form-label">
            {t("Route ID")} (*)
          </label>
          <input
            type="text"
            id="route_id"
            name="route_id"
            className="form-control"
            value={routeData.route_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_short_name" className="form-label">
            {t("Route Short Name")} (*)
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
            {t("Route Long Name")} (*)
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
            {t("Route Type")} (*)
          </label>
          <select
            id="route_type"
            name="route_type"
            className="form-control"
            value={routeData.route_type}
            onChange={handleChange}
            required
          >
            <option value="">{t("Select")}</option>
            <option value="0">{t("0 - Tram")}</option>
            <option value="1">{t("1 - Subway")}</option>
            <option value="2">{t("2 - Train")}</option>
            <option value="3">{t("3 - Bus")}</option>
            <option value="4">{t("4 - Ferry")}</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="route_desc" className="form-label">
            {t("Description")}
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
            {t("URL")}
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
            {t("Route Color")}
          </label>
          <input
            type="text"
            id="route_color"
            name="route_color"
            className="form-control"
            value={routeData.route_color}
            onChange={handleChange}
            placeholder={t("Example") + ": FF0000"}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_text_color" className="form-label">
            {t("Text Color")}
          </label>
          <input
            type="text"
            id="route_text_color"
            name="route_text_color"
            className="form-control"
            value={routeData.route_text_color}
            onChange={handleChange}
            placeholder={t("Example") + ": 000000"}
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            {t("Add")}
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
  selectedAgency: PropTypes.shape({
    agency_id: PropTypes.string.isRequired,
  }),
};

export default RouteAddPage;
