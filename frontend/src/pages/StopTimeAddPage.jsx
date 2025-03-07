import { useState, useEffect, useContext } from "react";
import { saveStopTime } from "../api/stopTimeApi";
import { fetchStopsByProjectId, saveStop } from "../api/stopApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const StopTimeAddPage = ({
  project_id,
  trip_id,
  onClose,
  setStopsAndTimes,
}) => {
  const { token } = useContext(AuthContext);
  const [stopTime, setStopTime] = useState({
    stop_id: "",
    arrival_time: "",
    departure_time: "",
    stop_sequence: null,
    stop_headsign: "",
    pickup_type: null,
    drop_off_type: null,
    shape_dist_traveled: null,
    timepoint: null,
  });
  const [stops, setStops] = useState([]);
  const [isNewStop, setIsNewStop] = useState(false);
  const [newStop, setNewStop] = useState({
    stop_name: "",
    stop_lat: null,
    stop_lon: null,
  });

  useEffect(() => {
    const loadStops = async () => {
      try {
        const data = await fetchStopsByProjectId(project_id, token);
        setStops(data);
      } catch (error) {
        console.error("Error fetching stops:", error);
      }
    };
    loadStops();
  }, [project_id, token]);

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

  const handleNewStopChange = (e) => {
    const { name, value } = e.target;
    setNewStop((prev) => ({
      ...prev,
      [name]:
        name === "stop_lat" || name === "stop_lon"
          ? parseFloat(value) || null
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu durak zamanını eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        let finalStopId = stopTime.stop_id;
        if (isNewStop) {
          const stopResponse = await saveStop(
            {
              stop_name: newStop.stop_name || "Yeni Durak",
              stop_lat: newStop.stop_lat,
              stop_lon: newStop.stop_lon,
              project_id,
            },
            token
          );
          finalStopId = stopResponse.stop_id;
        } else if (!stopTime.stop_id) {
          throw new Error("Mevcut durak seçimi için stop_id gerekli!");
        }

        const newStopTime = await saveStopTime(
          { trip_id, project_id, ...stopTime, stop_id: finalStopId },
          token
        );
        setStopsAndTimes((prev) => [...prev, newStopTime]); // Liste güncelle
        Swal.fire("Eklendi!", "Durak zamanı başarıyla eklendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Durak zamanı eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Durak Zamanı Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label">Durak Seçimi</label>
          <div className="form-check">
            <input
              type="radio"
              id="existingStop"
              name="stopType"
              checked={!isNewStop}
              onChange={() => setIsNewStop(false)}
              className="form-check-input"
            />
            <label htmlFor="existingStop" className="form-check-label">
              Mevcut Durak
            </label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              id="newStop"
              name="stopType"
              checked={isNewStop}
              onChange={() => setIsNewStop(true)}
              className="form-check-input"
            />
            <label htmlFor="newStop" className="form-check-label">
              Yeni Durak
            </label>
          </div>
        </div>

        {!isNewStop ? (
          <div className="mb-2">
            <label htmlFor="stop_id" className="form-label">
              Mevcut Durak
            </label>
            <select
              id="stop_id"
              name="stop_id"
              className="form-control"
              value={stopTime.stop_id}
              onChange={handleChange}
              required={!isNewStop}
            >
              <option value="">Bir durak seçin</option>
              {stops.map((stop) => (
                <option key={stop.stop_id} value={stop.stop_id}>
                  {stop.stop_name} ({stop.stop_id})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="mb-2">
              <label htmlFor="stop_name" className="form-label">
                Durak Adı
              </label>
              <input
                type="text"
                id="stop_name"
                name="stop_name"
                className="form-control"
                value={newStop.stop_name}
                onChange={handleNewStopChange}
              />
            </div>
            <div className="row">
              <div className="col-6 mb-2">
                <label htmlFor="stop_lat" className="form-label">
                  Enlem
                </label>
                <input
                  type="number"
                  id="stop_lat"
                  name="stop_lat"
                  className="form-control"
                  value={newStop.stop_lat || ""}
                  onChange={handleNewStopChange}
                  step="0.000001"
                />
              </div>
              <div className="col-6 mb-2">
                <label htmlFor="stop_lon" className="form-label">
                  Boylam
                </label>
                <input
                  type="number"
                  id="stop_lon"
                  name="stop_lon"
                  className="form-control"
                  value={newStop.stop_lon || ""}
                  onChange={handleNewStopChange}
                  step="0.000001"
                />
              </div>
            </div>
          </>
        )}

        <div className="mb-2">
          <label htmlFor="arrival_time" className="form-label">
            Varış Zamanı
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
        <div className="mb-2">
          <label htmlFor="departure_time" className="form-label">
            Kalkış Zamanı
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
        <div className="mb-2">
          <label htmlFor="stop_sequence" className="form-label">
            Sıra Numarası
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
        <div className="mb-2">
          <label htmlFor="stop_headsign" className="form-label">
            Durak Başlığı
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
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="pickup_type" className="form-label">
              Alış Türü
            </label>
            <select
              id="pickup_type"
              name="pickup_type"
              className="form-control"
              value={stopTime.pickup_type ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Normal</option>
              <option value="1">1 - Yok</option>
              <option value="2">2 - Ajansla İletişim</option>
              <option value="3">3 - Sürücüyle İletişim</option>
            </select>
          </div>
          <div className="col-6 mb-2">
            <label htmlFor="drop_off_type" className="form-label">
              Bırakış Türü
            </label>
            <select
              id="drop_off_type"
              name="drop_off_type"
              className="form-control"
              value={stopTime.drop_off_type ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="0">0 - Normal</option>
              <option value="1">1 - Yok</option>
              <option value="2">2 - Ajansla İletişim</option>
              <option value="3">3 - Sürücüyle İletişim</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="shape_dist_traveled" className="form-label">
              Şekil Mesafesi
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
          <div className="col-6 mb-2">
            <label htmlFor="timepoint" className="form-label">
              Zaman Noktası
            </label>
            <select
              id="timepoint"
              name="timepoint"
              className="form-control"
              value={stopTime.timepoint ?? ""}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="1">1 - Tam Zaman</option>
              <option value="0">0 - Yaklaşık</option>
            </select>
          </div>
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

StopTimeAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  trip_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
};

export default StopTimeAddPage;
