import { useState, useContext } from "react";
import { saveRoute } from "../api/routeApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const RouteAddPage = ({ onClose, setRoutes, selectedAgency, project_id }) => {
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
        "Error!",
        "Route ID, short name and route type are required!",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to add this route?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add!",
      cancelButtonText: "No",
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
        Swal.fire("Added!", "Route successfully added.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Error!",
          `Error while adding a route: ${error.message}`,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Add New Route</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="route_id" className="form-label">
            Route ID (*)
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
            Route Short Name (*)
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
            Route Long Name (*)
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
            Route Type (*)
          </label>
          <select
            id="route_type"
            name="route_type"
            className="form-control"
            value={routeData.route_type}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="0">0 - Tram</option>
            <option value="1">1 - Subway</option>
            <option value="2">2 - Train</option>
            <option value="3">3 - Bus</option>
            <option value="4">4 - Ferry</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="route_desc" className="form-label">
            Description
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
            Route Color
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
            Text Color
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
            Add
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
