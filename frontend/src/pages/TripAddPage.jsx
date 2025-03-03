import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { saveTrip } from "../api/tripApi";
import { fetchRoutesByProjectId } from "../api/routeApi";
import { fetchCalendarsByProjectId } from "../api/calendarApi";
import { useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import Swal from "sweetalert2";

const TripAddPage = () => {
  const { token } = useContext(AuthContext);
  const { project_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedRoute } = location.state || {};

  const [tripData, setTripData] = useState({
    service_id: "",
    shape_id: "",
    route_id: selectedRoute || "",
    project_id: project_id,
    trip_headsign: "",
    trip_short_name: "",
    direction_id: null,
    block_id: "",
    wheelchair_accessible: null,
    bikes_allowed: null,
    agency_email: "",
  });
  const [routes, setRoutes] = useState([]);
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const routeData = await fetchRoutesByProjectId(project_id, token);
        setRoutes(routeData);
        const calendarData = await fetchCalendarsByProjectId(project_id, token);
        setCalendars(calendarData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    if (token && project_id) {
      loadData();
    }
  }, [project_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTripData((prev) => ({
      ...prev,
      [name]:
        name === "direction_id" ||
        name === "wheelchair_accessible" ||
        name === "bikes_allowed"
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
      text: "Bu trip’i eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await saveTrip(tripData, token);
        Swal.fire("Eklendi!", "Trip başarıyla eklendi.", "success");
        navigate(`/map/${project_id}`, {
          state: { selectedRoute: tripData.route_id, refresh: true },
        });
      } catch (error) {
        console.error("Error adding trip:", error);
        Swal.fire(
          "Hata!",
          "Trip eklenirken bir hata oluştu: " + error.message,
          "error"
        );
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Yeni Trip Ekle</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="route_id" className="form-label">
              Rota:
            </label>
            <select
              id="route_id"
              name="route_id"
              className="form-select"
              value={tripData.route_id}
              onChange={handleChange}
              required
            >
              <option value="">Bir rota seçin</option>
              {routes.map((route) => (
                <option key={route.route_id} value={route.route_id}>
                  {route.route_long_name ||
                    route.route_short_name ||
                    route.route_id}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="service_id" className="form-label">
              Servis:
            </label>
            <select
              id="service_id"
              name="service_id"
              className="form-select"
              value={tripData.service_id}
              onChange={handleChange}
            >
              <option value="">Bir servis seçin</option>
              {calendars.map((calendar) => (
                <option key={calendar.service_id} value={calendar.service_id}>
                  {calendar.service_id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="trip_headsign" className="form-label">
              Trip Başlığı:
            </label>
            <input
              type="text"
              id="trip_headsign"
              name="trip_headsign"
              className="form-control"
              value={tripData.trip_headsign}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="trip_short_name" className="form-label">
              Kısa Ad:
            </label>
            <input
              type="text"
              id="trip_short_name"
              name="trip_short_name"
              className="form-control"
              value={tripData.trip_short_name}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="direction_id" className="form-label">
              Yön ID (0/1):
            </label>
            <select
              id="direction_id"
              name="direction_id"
              className="form-select"
              value={tripData.direction_id ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Gidiş</option>
              <option value="1">1 - Dönüş</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="shape_id" className="form-label">
              Şekil ID:
            </label>
            <input
              type="text"
              id="shape_id"
              name="shape_id"
              className="form-control"
              value={tripData.shape_id}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Ekle
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              navigate(`/map/${project_id}`, { state: { selectedRoute } })
            }
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripAddPage;
