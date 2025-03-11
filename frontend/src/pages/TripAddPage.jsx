import { useState, useEffect, useContext } from "react";
import { saveTrip } from "../api/tripApi";
import { fetchRoutesByProjectId } from "../api/routeApi";
import { fetchCalendarsByProjectId } from "../api/calendarApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const TripAddPage = ({ project_id, onClose, setTrips, calendars, selectedRoute }) => {
  const { token } = useContext(AuthContext);
  const [tripData, setTripData] = useState({
    service_id: "",
    route_id: "",
    project_id,
    trip_headsign: "",
    trip_short_name: "",
    direction_id: null,
    block_id: "",
    wheelchair_accessible: null,
    bikes_allowed: null,
  });

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
      text: "Bu trip’i eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        const formData = { ...tripData, project_id, route_id:selectedRoute };
        const response = await saveTrip(formData, token);
        const trip_id = response.trip_id;
        setTrips((prev) => [...prev, { ...formData, trip_id }]);
        Swal.fire("Eklendi!", "Trip başarıyla eklendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Trip eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Trip Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="service_id" className="form-label">
            Servis
          </label>
          <select
            id="service_id"
            name="service_id"
            className="form-control"
            value={tripData.service_id}
            onChange={handleChange}
            required
          >
            <option value="">Bir servis seçin</option>
            {calendars.map((calendar) => (
              <option key={calendar.service_id} value={calendar.service_id}>
                {getServiceName(calendar)}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="trip_headsign" className="form-label">
            Trip Başlığı
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
        <div className="mb-2">
          <label htmlFor="trip_short_name" className="form-label">
            Kısa Ad
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
        <div className="mb-2">
          <label htmlFor="direction_id" className="form-label">
            Yön
          </label>
          <select
            id="direction_id"
            name="direction_id"
            className="form-control"
            value={tripData.direction_id ?? ""}
            onChange={handleChange}
          >
            <option value="">Seçiniz</option>
            <option value="0">0 - Gidiş</option>
            <option value="1">1 - Dönüş</option>
          </select>
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

TripAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setTrips: PropTypes.func.isRequired,
};

export default TripAddPage;
