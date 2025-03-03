import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchTripById, updateTrip } from "../api/tripApi";
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

  useEffect(() => {
    const loadTrip = async () => {
      try {
        const data = await fetchTripById(trip_id, token);
        setTripData({
          trip_id: data.trip_id,
          service_id: data.service_id || "",
          shape_id: data.shape_id || "",
          route_id: data.route_id || "",
          project_id: data.project_id || project_id,
          trip_headsign: data.trip_headsign || "",
          trip_short_name: data.trip_short_name || "",
          direction_id:
            data.direction_id !== undefined ? data.direction_id : null,
          block_id: data.block_id || "",
          wheelchair_accessible:
            data.wheelchair_accessible !== undefined
              ? data.wheelchair_accessible
              : null,
          bikes_allowed:
            data.bikes_allowed !== undefined ? data.bikes_allowed : null,
        });
      } catch (error) {
        console.error("Error fetching trip:", error);
      }
    };
    if (token && trip_id) {
      loadTrip();
    }
  }, [trip_id, token, project_id]);

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
              Servis ID:
            </label>
            <input
              type="text"
              id="service_id"
              name="service_id"
              className="form-control"
              value={tripData.service_id}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="row">
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
          <div className="col-md-6 mb-3">
            <label htmlFor="route_id" className="form-label">
              Rota ID:
            </label>
            <input
              type="text"
              id="route_id"
              name="route_id"
              className="form-control"
              value={tripData.route_id}
              onChange={handleChange}
              required
            />
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
