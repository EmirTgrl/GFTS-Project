import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // useLocation eklendi
import { fetchStopTimeById, updateStopTime } from "../api/stopTimeApi";
import { useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import Swal from "sweetalert2";

const StopTimeEditPage = () => {
  const { token } = useContext(AuthContext);
  const { project_id, trip_id, stop_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Önceki seçimleri almak için
  const { selectedRoute, selectedTrip } = location.state || {}; // State’ten seçimleri al

  const [stopTime, setStopTime] = useState({
    arrival_time: "",
    departure_time: "",
    stop_sequence: "",
    stop_headsign: "",
    pickup_type: null,
    drop_off_type: null,
    shape_dist_traveled: null,
    timepoint: null,
  });

  useEffect(() => {
    const loadStopTime = async () => {
      try {
        const data = await fetchStopTimeById(trip_id, stop_id, token);
        setStopTime({
          arrival_time: data.arrival_time || "",
          departure_time: data.departure_time || "",
          stop_sequence: data.stop_sequence || "",
          stop_headsign: data.stop_headsign || "",
          pickup_type:
            data.pickup_type !== undefined && data.pickup_type !== null
              ? data.pickup_type
              : null,
          drop_off_type:
            data.drop_off_type !== undefined && data.drop_off_type !== null
              ? data.drop_off_type
              : null,
          shape_dist_traveled:
            data.shape_dist_traveled !== undefined &&
            data.shape_dist_traveled !== null
              ? data.shape_dist_traveled
              : null,
          timepoint:
            data.timepoint !== undefined && data.timepoint !== null
              ? data.timepoint
              : null,
        });
      } catch (error) {
        console.error("Error fetching stop time:", error);
      }
    };
    if (token && trip_id && stop_id) {
      loadStopTime();
    }
  }, [trip_id, stop_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStopTime((prev) => ({
      ...prev,
      [name]:
        name === "shape_dist_traveled" || name === "stop_sequence"
          ? value === ""
            ? null
            : parseFloat(value) || null
          : name === "pickup_type" ||
            name === "drop_off_type" ||
            name === "timepoint"
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
      text: "Bu durak zamanını güncellemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, güncelle!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await updateStopTime(
          {
            trip_id,
            stop_id,
            project_id,
            ...stopTime,
          },
          token
        );
        Swal.fire(
          "Güncellendi!",
          "Durak zamanı başarıyla güncellendi.",
          "success"
        );
        navigate(`/map/${project_id}`, {
          state: { selectedRoute, selectedTrip },
        });
      } catch (error) {
        console.error("Error updating stop time:", error);
        Swal.fire(
          "Hata!",
          "Durak zamanı güncellenirken bir hata oluştu.",
          "error"
        );
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Durak Zamanını Düzenle</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="arrival_time" className="form-label">
              Varış Zamanı (HH:MM:SS):
            </label>
            <input
              type="text"
              id="arrival_time"
              name="arrival_time"
              className="form-control"
              value={stopTime.arrival_time}
              onChange={handleChange}
              placeholder="Ör: 12:30:00"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="departure_time" className="form-label">
              Kalkış Zamanı (HH:MM:SS):
            </label>
            <input
              type="text"
              id="departure_time"
              name="departure_time"
              className="form-control"
              value={stopTime.departure_time}
              onChange={handleChange}
              placeholder="Ör: 12:35:00"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="stop_sequence" className="form-label">
              Sıra Numarası:
            </label>
            <input
              type="number"
              id="stop_sequence"
              name="stop_sequence"
              className="form-control"
              value={stopTime.stop_sequence || ""}
              onChange={handleChange}
              min="1"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="stop_headsign" className="form-label">
              Durak Başlığı:
            </label>
            <input
              type="text"
              id="stop_headsign"
              name="stop_headsign"
              className="form-control"
              value={stopTime.stop_headsign}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="pickup_type" className="form-label">
              Alış Türü:
            </label>
            <select
              id="pickup_type"
              name="pickup_type"
              className="form-select"
              value={stopTime.pickup_type ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Normal Alış</option>
              <option value="1">1 - Alış Yok</option>
              <option value="2">2 - Ajansla İletişim Gerekiyor</option>
              <option value="3">3 - Sürücüyle İletişim Gerekiyor</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="drop_off_type" className="form-label">
              Bırakış Türü:
            </label>
            <select
              id="drop_off_type"
              name="drop_off_type"
              className="form-select"
              value={stopTime.drop_off_type ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Normal Bırakış</option>
              <option value="1">1 - Bırakış Yok</option>
              <option value="2">2 - Ajansla İletişim Gerekiyor</option>
              <option value="3">3 - Sürücüyle İletişim Gerekiyor</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="shape_dist_traveled" className="form-label">
              Şekil Mesafesi (metre):
            </label>
            <input
              type="number"
              id="shape_dist_traveled"
              name="shape_dist_traveled"
              className="form-control"
              value={stopTime.shape_dist_traveled || ""}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="timepoint" className="form-label">
              Zaman Noktası:
            </label>
            <select
              id="timepoint"
              name="timepoint"
              className="form-select"
              value={stopTime.timepoint ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="1">1 - Tam Zaman</option>
              <option value="0">0 - Yaklaşık Zaman</option>
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
              navigate(`/map/${project_id}`, {
                state: { selectedRoute, selectedTrip },
              })
            }
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

export default StopTimeEditPage;
