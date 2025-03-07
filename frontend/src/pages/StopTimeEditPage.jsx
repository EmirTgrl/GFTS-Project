import { useState, useEffect, useContext } from "react";
import { fetchStopTimeById, updateStopTime } from "../api/stopTimeApi";
import { fetchStopsByProjectId } from "../api/stopApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const StopTimeEditPage = ({
  project_id,
  trip_id,
  stop_id,
  onClose,
  setStopsAndTimes,
}) => {
  const { token } = useContext(AuthContext);
  const [stopTimeData, setStopTimeData] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(
          "Fetching stop time with trip_id:",
          trip_id,
          "stop_id:",
          stop_id
        );
        const stopTimeResponse = await fetchStopTimeById(
          trip_id,
          stop_id,
          token
        );
        console.log("Raw stop time response:", stopTimeResponse);

        if (!stopTimeResponse || !stopTimeResponse.stop_id) {
          throw new Error("Stop time data is empty or invalid");
        }

        setStopTimeData({
          trip_id: stopTimeResponse.trip_id || trip_id,
          stop_id: stopTimeResponse.stop_id || stop_id,
          project_id: stopTimeResponse.project_id || project_id,
          arrival_time: stopTimeResponse.arrival_time || "",
          departure_time: stopTimeResponse.departure_time || "",
          stop_sequence: stopTimeResponse.stop_sequence || 0,
          stop_headsign: stopTimeResponse.stop_headsign || "",
          pickup_type:
            stopTimeResponse.pickup_type !== undefined
              ? stopTimeResponse.pickup_type
              : 0,
          drop_off_type:
            stopTimeResponse.drop_off_type !== undefined
              ? stopTimeResponse.drop_off_type
              : 0,
          shape_dist_traveled: stopTimeResponse.shape_dist_traveled || "",
          timepoint:
            stopTimeResponse.timepoint !== undefined
              ? stopTimeResponse.timepoint
              : 1,
        });

        const stopData = await fetchStopsByProjectId(project_id, token);
        console.log("Fetched stops:", stopData);
        setStops(Array.isArray(stopData) ? stopData : []);
      } catch (error) {
        console.error("Error fetching stop time data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [trip_id, stop_id, project_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStopTimeData((prev) => ({
      ...prev,
      [name]:
        name === "stop_sequence" ||
        name === "pickup_type" ||
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
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        // Güncellenen veriyi gönder
        await updateStopTime(stopTimeData, trip_id, stop_id, token);

        // stopsAndTimes state'ini güncelle
        setStopsAndTimes((prev) =>
          prev.map((st) =>
            st.trip_id === trip_id && st.stop_id === stop_id
              ? { ...st, ...stopTimeData }
              : st
          )
        );
        Swal.fire(
          "Güncellendi!",
          "Durak zamanı başarıyla güncellendi.",
          "success"
        );
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Durak zamanı güncellenirken hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p>Hata: {error}</p>;
  if (!stopTimeData) return <p>Veri bulunamadı.</p>;

  return (
    <div className="form-container">
      <h5>Durak Zamanı Düzenle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="stop_id" className="form-label">
            Durak
          </label>
          <select
            id="stop_id"
            name="stop_id"
            className="form-control"
            value={stopTimeData.stop_id}
            onChange={handleChange}
            required
          >
            <option value="">Bir durak seçin</option>
            {stops.map((stop) => (
              <option key={stop.stop_id} value={stop.stop_id}>
                {stop.stop_name || stop.stopestructible_id}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="arrival_time" className="form-label">
            Varış Zamanı
          </label>
          <input
            type="text"
            id="arrival_time"
            name="arrival_time"
            className="form-control"
            value={stopTimeData.arrival_time}
            onChange={handleChange}
            placeholder="HH:MM:SS"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="departure_time" className="form-label">
            Kalkış Zamanı
          </label>
          <input
            type="text"
            id="departure_time"
            name="departure_time"
            className="form-control"
            value={stopTimeData.departure_time}
            onChange={handleChange}
            placeholder="HH:MM:SS"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_sequence" className="form-label">
            Durak Sırası
          </label>
          <input
            type="number"
            id="stop_sequence"
            name="stop_sequence"
            className="form-control"
            value={stopTimeData.stop_sequence ?? ""}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_headsign" className="form-label">
            Durak Başlığı
          </label>
          <input
            type="text"
            id="stop_headsign"
            name="stop_headsign"
            className="form-control"
            value={stopTimeData.stop_headsign}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="pickup_type" className="form-label">
            Yolcu Alma Türü
          </label>
          <select
            id="pickup_type"
            name="pickup_type"
            className="form-control"
            value={stopTimeData.pickup_type ?? ""}
            onChange={handleChange}
          >
            <option value="0">0 - Normal</option>
            <option value="1">1 - Yok</option>
            <option value="2">2 - Ajansla İletişim</option>
            <option value="3">3 - Sürücüyle İletişim</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="drop_off_type" className="form-label">
            Yolcu İndirme Türü
          </label>
          <select
            id="drop_off_type"
            name="drop_off_type"
            className="form-control"
            value={stopTimeData.drop_off_type ?? ""}
            onChange={handleChange}
          >
            <option value="0">0 - Normal</option>
            <option value="1">1 - Yok</option>
            <option value="2">2 - Ajansla İletişim</option>
            <option value="3">3 - Sürücüyle İletişim</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="shape_dist_traveled" className="form-label">
            Şekil Mesafesi (Metre)
          </label>
          <input
            type="text"
            id="shape_dist_traveled"
            name="shape_dist_traveled"
            className="form-control"
            value={stopTimeData.shape_dist_traveled}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="timepoint" className="form-label">
            Zaman Noktası
          </label>
          <select
            id="timepoint"
            name="timepoint"
            className="form-control"
            value={stopTimeData.timepoint ?? ""}
            onChange={handleChange}
          >
            <option value="0">0 - Yaklaşık</option>
            <option value="1">1 - Kesin</option>
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            Kaydet
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

StopTimeEditPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  trip_id: PropTypes.string.isRequired,
  stop_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
};

export default StopTimeEditPage;
