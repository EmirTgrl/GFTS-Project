import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchTripById, updateTrip } from "../api/tripApi";
import { fetchRoutesByProjectId } from "../api/routeApi";
import { fetchCalendarsByProjectId } from "../api/calendarApi";
import { useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import Swal from "sweetalert2";

const TripEditPage = () => {
  const { token } = useContext(AuthContext);
  const { project_id, trip_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedRoute } = location.state || {};

  const [tripData, setTripData] = useState({
    trip_id: trip_id,
    service_id: "",
    shape_id: "",
    route_id: "",
    project_id: project_id,
    trip_headsign: "",
    trip_short_name: "",
    direction_id: null,
    block_id: "",
    wheelchair_accessible: null,
    bikes_allowed: null,
  });
  const [routes, setRoutes] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [shapes] = useState([]); // Şekil ID için API yoksa statik bir liste, varsa güncellenecek

  useEffect(() => {
    const loadData = async () => {
      try {
        // Trip verisini yükle
        const trip = await fetchTripById(trip_id, token);
        setTripData({
          trip_id: trip.trip_id,
          service_id: trip.service_id || "",
          shape_id: trip.shape_id || "",
          route_id: trip.route_id || "",
          project_id: trip.project_id || project_id,
          trip_headsign: trip.trip_headsign || "",
          trip_short_name: trip.trip_short_name || "",
          direction_id:
            trip.direction_id !== undefined ? trip.direction_id : null,
          block_id: trip.block_id || "",
          wheelchair_accessible:
            trip.wheelchair_accessible !== undefined
              ? trip.wheelchair_accessible
              : null,
          bikes_allowed:
            trip.bikes_allowed !== undefined ? trip.bikes_allowed : null,
        });

        // Rota ve takvim verilerini yükle
        const routeData = await fetchRoutesByProjectId(project_id, token);
        setRoutes(routeData);
        const calendarData = await fetchCalendarsByProjectId(project_id, token);
        setCalendars(calendarData);

        // Şekil verileri için bir API yoksa, burada statik bir liste kullanılabilir
        // Örnek: setShapes(await fetchShapesByProjectId(project_id, token));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (token && trip_id && project_id) {
      loadData();
    }
  }, [trip_id, project_id, token]);

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

  // Servis isimlendirme (TripAddPage’den alınmış)
  const getServiceName = (calendar) => {
    const days = [
      { name: "Pzt", value: calendar.monday },
      { name: "Sal", value: calendar.tuesday },
      { name: "Çar", value: calendar.wednesday },
      { name: "Per", value: calendar.thursday },
      { name: "Cum", value: calendar.friday },
      { name: "Cmt", value: calendar.saturday },
      { name: "Paz", value: calendar.sunday },
    ];

    const weekDays = days.slice(0, 5);
    const saturday = days[5];
    const sunday = days[6];

    const isWeekdaysOnly =
      weekDays.every((day) => day.value === 1) &&
      saturday.value === 0 &&
      sunday.value === 0;
    const isSaturdayOnly =
      weekDays.every((day) => day.value === 0) &&
      saturday.value === 1 &&
      sunday.value === 0;
    const isSundayOnly =
      weekDays.every((day) => day.value === 0) &&
      saturday.value === 0 &&
      sunday.value === 1;

    if (isWeekdaysOnly) return `${calendar.service_id} - Hafta İçi`;
    if (isSaturdayOnly) return `${calendar.service_id} - Cumartesi`;
    if (isSundayOnly) return `${calendar.service_id} - Pazar`;

    const activeDays = days
      .filter((day) => day.value === 1)
      .map((day) => day.name)
      .join(", ");
    return activeDays
      ? `${calendar.service_id} - ${activeDays}`
      : calendar.service_id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu trip’i güncellemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, güncelle!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await updateTrip(tripData, token);
        Swal.fire("Güncellendi!", "Trip başarıyla güncellendi.", "success");
        navigate(`/map/${project_id}`, { state: { selectedRoute } });
      } catch (error) {
        console.error("Error updating trip:", error);
        Swal.fire(
          "Hata!",
          "Trip güncellenirken bir hata oluştu: " + error.message,
          "error"
        );
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Trip Düzenle</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="trip_id" className="form-label">
              Trip ID:
            </label>
            <input
              type="text"
              id="trip_id"
              name="trip_id"
              className="form-control"
              value={tripData.trip_id}
              readOnly
            />
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
                  {getServiceName(calendar)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="shape_id" className="form-label">
              Şekil:
            </label>
            <select
              id="shape_id"
              name="shape_id"
              className="form-select"
              value={tripData.shape_id}
              onChange={handleChange}
            >
              <option value="">Bir şekil seçin</option>
              {/* Şekil API’si yoksa statik bir liste kullanılabilir */}
              {shapes.length > 0 ? (
                shapes.map((shape) => (
                  <option key={shape.shape_id} value={shape.shape_id}>
                    {shape.shape_name || shape.shape_id}
                  </option>
                ))
              ) : (
                <option value={tripData.shape_id}>
                  {tripData.shape_id || "Şekil Yok"}
                </option>
              )}
            </select>
          </div>
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
            <label htmlFor="block_id" className="form-label">
              Blok ID:
            </label>
            <input
              type="text"
              id="block_id"
              name="block_id"
              className="form-control"
              value={tripData.block_id}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="wheelchair_accessible" className="form-label">
              Tekerlekli Sandalye:
            </label>
            <select
              id="wheelchair_accessible"
              name="wheelchair_accessible"
              className="form-select"
              value={tripData.wheelchair_accessible ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Bilinmiyor</option>
              <option value="1">1 - Erişilebilir</option>
              <option value="2">2 - Erişilemez</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="bikes_allowed" className="form-label">
              Bisiklet İzni:
            </label>
            <select
              id="bikes_allowed"
              name="bikes_allowed"
              className="form-select"
              value={tripData.bikes_allowed ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Bilinmiyor</option>
              <option value="1">1 - İzinli</option>
              <option value="2">2 - İzin Yok</option>
            </select>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Kaydet
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

export default TripEditPage;
