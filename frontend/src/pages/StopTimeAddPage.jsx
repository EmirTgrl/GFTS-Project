import { useState, useContext, useEffect } from "react";
import { saveStopTime } from "../api/stopTimeApi";
import { saveStop } from "../api/stopApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const StopTimeAddPage = ({
  project_id,
  trip_id,
  onClose,
  setStopsAndTimes,
  initialLat,
  initialLon,
  resetClickedCoords, 
}) => {
  const { token } = useContext(AuthContext);
  const [stopData, setStopData] = useState({
    arrival_time: "",
    departure_time: "",
    stop_sequence: "",
    stop_headsign: "",
    pickup_type: "",
    drop_off_type: "",
    shape_dist_traveled: "",
    timepoint: "",
    stop_code: "",
    stop_name: "",
    stop_desc: "",
    stop_lat: "",
    stop_lon: "",
    stop_url: "",
    location_type: "",
    stop_timezone: "",
    wheelchair_boarding: "",
  });

  useEffect(() => {
    if (initialLat !== undefined && initialLon !== undefined) {
      setStopData((prev) => ({
        ...prev,
        stop_lat: initialLat,
        stop_lon: initialLon,
      }));
    }
  }, [initialLat, initialLon]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStopData((prev) => ({
      ...prev,
      [name]: value,
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
        const stopDataForApi = {
          stop_code: stopData.stop_code || null,
          stop_name: stopData.stop_name || null,
          stop_desc: stopData.stop_desc || null,
          stop_lat: parseFloat(stopData.stop_lat) || null,
          stop_lon: parseFloat(stopData.stop_lon) || null,
          stop_url: stopData.stop_url || null,
          location_type: stopData.location_type
            ? parseInt(stopData.location_type)
            : null,
          stop_timezone: stopData.stop_timezone || null,
          wheelchair_boarding: stopData.wheelchair_boarding
            ? parseInt(stopData.wheelchair_boarding)
            : null,
          project_id: project_id,
        };

        const stopTimeDataForApi = {
          trip_id: trip_id,
          arrival_time: stopData.arrival_time || null,
          departure_time: stopData.departure_time || null,
          stop_sequence: stopData.stop_sequence
            ? parseInt(stopData.stop_sequence)
            : null,
          stop_headsign: stopData.stop_headsign || null,
          pickup_type: stopData.pickup_type
            ? parseInt(stopData.pickup_type)
            : null,
          drop_off_type: stopData.drop_off_type
            ? parseInt(stopData.drop_off_type)
            : null,
          shape_dist_traveled: stopData.shape_dist_traveled
            ? parseFloat(stopData.shape_dist_traveled)
            : null,
          timepoint: stopData.timepoint ? parseInt(stopData.timepoint) : null,
          project_id: project_id,
        };

        const stopResponse = await saveStop(stopDataForApi, token);
        stopTimeDataForApi.stop_id = stopResponse.stop_id;

        await saveStopTime(stopTimeDataForApi, token);

        setStopsAndTimes((prev) => [
          ...prev,
          {
            ...stopDataForApi,
            ...stopTimeDataForApi,
            stop_id: stopResponse.stop_id,
          },
        ]);
        Swal.fire("Eklendi!", "Durak zamanı başarıyla eklendi.", "success");

        setStopData({
          arrival_time: "",
          departure_time: "",
          stop_sequence: "",
          stop_headsign: "",
          pickup_type: "",
          drop_off_type: "",
          shape_dist_traveled: "",
          timepoint: "",
          stop_code: "",
          stop_name: "",
          stop_desc: "",
          stop_lat: "",
          stop_lon: "",
          stop_url: "",
          location_type: "",
          stop_timezone: "",
          wheelchair_boarding: "",
        });

        // Harita koordinatlarını sıfırla
        if (resetClickedCoords) {
          resetClickedCoords();
        }

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
      <h5>Yeni Durak Zamanı oluştur</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="arrival_time" className="form-label">
            Varış Zamanı
          </label>
          <input
            type="text"
            id="arrival_time"
            name="arrival_time"
            className="form-control"
            value={stopData.arrival_time}
            onChange={handleChange}
            placeholder="Ör: 12:30:00"
            required
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
            value={stopData.departure_time}
            onChange={handleChange}
            placeholder="Ör: 12:35:00"
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_sequence" className="form-label">
            Sıra Numarası (*)
          </label>
          <input
            type="number"
            id="stop_sequence"
            name="stop_sequence"
            className="form-control"
            value={stopData.stop_sequence}
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
            value={stopData.stop_headsign}
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
              value={stopData.pickup_type}
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
              value={stopData.drop_off_type}
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
              value={stopData.shape_dist_traveled}
              onChange={handleChange}
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
              value={stopData.timepoint}
              onChange={handleChange}
            >
              <option value="">Seçiniz</option>
              <option value="1">1 - Tam Zaman</option>
              <option value="0">0 - Yaklaşık</option>
            </select>
          </div>
        </div>
        <div className="mb-2">
          <label htmlFor="stop_code" className="form-label">
            Durak Kodu
          </label>
          <input
            type="text"
            id="stop_code"
            name="stop_code"
            className="form-control"
            value={stopData.stop_code}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_name" className="form-label">
            Durak Adı (*)
          </label>
          <input
            type="text"
            id="stop_name"
            name="stop_name"
            className="form-control"
            value={stopData.stop_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_desc" className="form-label">
            Durak Açıklaması
          </label>
          <input
            type="text"
            id="stop_desc"
            name="stop_desc"
            className="form-control"
            value={stopData.stop_desc}
            onChange={handleChange}
          />
        </div>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="stop_lat" className="form-label">
              Durak Enlemi (*)
            </label>
            <input
              type="number"
              id="stop_lat"
              name="stop_lat"
              className="form-control"
              value={stopData.stop_lat}
              onChange={handleChange}
              step="0.000001"
              readOnly={initialLat !== undefined}
              required
            />
          </div>
          <div className="col-6 mb-2">
            <label htmlFor="stop_lon" className="form-label">
              Durak Boylamı (*)
            </label>
            <input
              type="number"
              id="stop_lon"
              name="stop_lon"
              className="form-control"
              value={stopData.stop_lon}
              onChange={handleChange}
              step="0.000001"
              readOnly={initialLon !== undefined}
              required
            />
          </div>
        </div>
        <div className="mb-2">
          <label htmlFor="stop_url" className="form-label">
            Durak URL
          </label>
          <input
            type="text"
            id="stop_url"
            name="stop_url"
            className="form-control"
            value={stopData.stop_url}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="location_type" className="form-label">
            Konum Türü
          </label>
          <select
            id="location_type"
            name="location_type"
            className="form-control"
            value={stopData.location_type}
            onChange={handleChange}
          >
            <option value="">Seçiniz</option>
            <option value="0">0 - Durak</option>
            <option value="1">1 - İstasyon</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="stop_timezone" className="form-label">
            Durak Saat Dilimi
          </label>
          <input
            type="text"
            id="stop_timezone"
            name="stop_timezone"
            className="form-control"
            value={stopData.stop_timezone}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="wheelchair_boarding" className="form-label">
            Tekerlekli Sandalye Erişimi
          </label>
          <select
            id="wheelchair_boarding"
            name="wheelchair_boarding"
            className="form-control"
            value={stopData.wheelchair_boarding}
            onChange={handleChange}
          >
            <option value="">Seçiniz</option>
            <option value="0">0 - Bilgi Yok</option>
            <option value="1">1 - Mümkün</option>
            <option value="2">2 - Mümkün Değil</option>
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

StopTimeAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  trip_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  initialLat: PropTypes.number,
  initialLon: PropTypes.number,
  resetClickedCoords: PropTypes.func, 
};

export default StopTimeAddPage;
