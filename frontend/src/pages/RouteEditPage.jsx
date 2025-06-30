import { useState, useEffect, useContext } from "react";
import { updateRoute } from "../api/routeApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { useTranslation } from "react-i18next";

const RouteEditPage = ({
  agencies,
  route_id,
  routes,
  onClose,
  setRoutes,
  project_id,
}) => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const routeList = routes.data || routes;
        const initialRouteData = routeList.find(
          (rt) => rt.route_id === route_id
        );
        if (!initialRouteData) {
          throw new Error("Route not found");
        }

        const prepareRouteData = (data) => ({
          route_id: data?.route_id || "",
          agency_id: data?.agency_id || "",
          project_id: data?.project_id || project_id,
          route_short_name: data?.route_short_name || "",
          route_long_name: data?.route_long_name || "",
          route_desc: data?.route_desc || "",
          route_type: data?.route_type || "",
          route_url: data?.route_url || "",
          route_color: data?.route_color || "",
          route_text_color: data?.route_text_color || "",
          route_sort_order:
            data?.route_sort_order !== undefined ? data.route_sort_order : null,
          continuous_pickup:
            data?.continuous_pickup !== undefined
              ? data.continuous_pickup
              : null,
          continuous_drop_off:
            data?.continuous_drop_off !== undefined
              ? data.continuous_drop_off
              : null,
        });
        setRouteData(prepareRouteData(initialRouteData));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [routes, route_id, project_id]);

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
      !routeData.route_short_name ||
      !routeData.route_type ||
      !routeData.agency_id
    ) {
      Swal.fire(
        t("Error!"),
        t("Short name, route type and agency are mandatory!"),
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Are you sure you want to update this route?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t("Yes, update!"),
      cancelButtonText: t("No"),
    });

    if (result.isConfirmed) {
      try {
        const updatedRouteData = { route_id, ...routeData };
        await updateRoute(updatedRouteData, token);
        setRoutes((prev) => {
          const routeList = prev.data || prev;
          return {
            ...prev,
            data: routeList.map((r) =>
              r.route_id === route_id ? { ...r, ...updatedRouteData } : r
            ),
          };
        });
        Swal.fire(t("Updated!"), t("Route successfully updated."), "success");
        onClose();
      } catch (error) {
        Swal.fire(
          t("Error!"),
          t("Error while updating the route:") + " " + error.message,
          "error"
        );
      }
    }
  };

  if (loading) return <p>{t("Loading...")}</p>;
  if (error) return <p>{t("Error") + ": " + error}</p>;
  if (!routeData) return <p>{t("No data found.")}</p>;

  return (
    <div className="form-container">
      {/* <h5>{t("Update Route")}</h5> */}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="route_id" className="form-label">
            {t("Route ID")} ({t("Cannot be changed")})
          </label>
          <input
            type="text"
            id="route_id"
            name="route_id"
            className="form-control"
            value={routeData.route_id}
            disabled
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_id" className="form-label">
            {t("Agency")} (*)
          </label>
          <select
            id="agency_id"
            name="agency_id"
            className="form-control"
            value={routeData.agency_id}
            onChange={handleChange}
            required
          >
            <option value="">{t("Select an agency")}</option>
            {agencies.map((agency) => (
              <option key={agency.agency_id} value={agency.agency_id}>
                {agency.agency_name || agency.agency_id}
              </option>
            ))}
          </select>
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
            {t("Route Long Name")}
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
            {t("Save")}
          </button>
        </div>
      </form>
    </div>
  );
};

RouteEditPage.propTypes = {
  agencies: PropTypes.arrayOf(
    PropTypes.shape({
      agency_id: PropTypes.string.isRequired,
      agency_name: PropTypes.string,
    })
  ).isRequired,
  project_id: PropTypes.string.isRequired,
  route_id: PropTypes.string.isRequired,
  routes: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        route_id: PropTypes.string.isRequired,
        agency_id: PropTypes.string,
        project_id: PropTypes.string,
        route_short_name: PropTypes.string,
        route_long_name: PropTypes.string,
        route_desc: PropTypes.string,
        route_type: PropTypes.string,
        route_url: PropTypes.string,
        route_color: PropTypes.string,
        route_text_color: PropTypes.string,
        route_sort_order: PropTypes.number,
        continuous_pickup: PropTypes.number,
        continuous_drop_off: PropTypes.number,
      })
    ),
    PropTypes.shape({
      data: PropTypes.arrayOf(
        PropTypes.shape({
          route_id: PropTypes.string.isRequired,
          agency_id: PropTypes.string,
          project_id: PropTypes.string,
          route_short_name: PropTypes.string,
          route_long_name: PropTypes.string,
          route_desc: PropTypes.string,
          route_type: PropTypes.string,
          route_url: PropTypes.string,
          route_color: PropTypes.string,
          route_text_color: PropTypes.string,
          route_sort_order: PropTypes.number,
          continuous_pickup: PropTypes.number,
          continuous_drop_off: PropTypes.number,
        })
      ).isRequired,
    }),
  ]).isRequired,
  onClose: PropTypes.func.isRequired,
  setRoutes: PropTypes.func.isRequired,
};

export default RouteEditPage;
