import { useState, useEffect, useContext } from "react";
import { updateStopTime ,fetchStopsByRoute} from "../api/stopTimeApi";
import { updateStop, saveStop  } from "../api/stopApi"; // Import saveStop
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";


const StopTimeEditPage = ({
  project_id,
  trip_id,
  stop_id,
  onClose,
  setStopsAndTimes,
  stopsAndTimes,
  route_id
}) => {
  const { token } = useContext(AuthContext);
  const [stopTimeData, setStopTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allStops, setAllStops] = useState([]); 
  const [isNewStop, setIsNewStop] = useState(false); 
  const [selectedStopId, setSelectedStopId] = useState(stop_id);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stopsResponse = await fetchStopsByRoute(route_id, token);
        setAllStops(stopsResponse);

        const stopTimeResponse = stopsAndTimes.find(
          (st) =>
            parseInt(st.stop_id, 10) === parseInt(stop_id, 10) &&
            parseInt(st.trip_id, 10) === parseInt(trip_id, 10)
        );


        if (!stopTimeResponse) {
          throw new Error("Stop time data not found.");
        }

        setStopTimeData({
          stop_code: stopTimeResponse.stop_code || null,
          stop_name: stopTimeResponse.stop_name || "",
          stop_desc: stopTimeResponse.stop_desc || null,
          stop_lat: stopTimeResponse.stop_lat || null,
          stop_lon: stopTimeResponse.stop_lon || null,
          stop_url: stopTimeResponse.stop_url || null,
          location_type: stopTimeResponse.location_type !== undefined ? stopTimeResponse.location_type : null,
          stop_timezone: stopTimeResponse.stop_timezone || null,
          wheelchair_boarding: stopTimeResponse.wheelchair_boarding !== undefined ? stopTimeResponse.wheelchair_boarding : null,
          arrival_time: stopTimeResponse.arrival_time || "",
          departure_time: stopTimeResponse.departure_time || "",
          stop_sequence: stopTimeResponse.stop_sequence || null,
          stop_headsign: stopTimeResponse.stop_headsign || "",
          pickup_type: stopTimeResponse.pickup_type !== undefined ? stopTimeResponse.pickup_type : null,
          drop_off_type: stopTimeResponse.drop_off_type !== undefined ? stopTimeResponse.drop_off_type : null,
          shape_dist_traveled: stopTimeResponse.shape_dist_traveled || null,
          timepoint: stopTimeResponse.timepoint !== undefined ? stopTimeResponse.timepoint : null,
          trip_id: parseInt(stopTimeResponse.trip_id, 10) || parseInt(trip_id, 10),
          project_id: parseInt(stopTimeResponse.project_id, 10) || parseInt(project_id, 10),
          stop_id: parseInt(stopTimeResponse.stop_id, 10) || parseInt(stop_id, 10),
        });

      } catch (err) {
        console.error("Error fetching/parsing stop time data:", err);
        setError(err.message || "Failed to load stop time data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [trip_id, stop_id, project_id, stopsAndTimes, token]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    if (name === "stop_lat" || name === "stop_lon") {
      parsedValue = value === "" ? null : parseFloat(value);
    } else if (
      name === "location_type" ||
      name === "wheelchair_boarding" ||
      name === "stop_sequence" ||
      name === "pickup_type" ||
      name === "drop_off_type" ||
      name === "timepoint"
    ) {
      parsedValue = value === "" ? null : parseInt(value, 10);
    } else if (name === "shape_dist_traveled") {
      parsedValue = value === "" ? null : parseFloat(value);
    }

    setStopTimeData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleStopSelectChange = (e) => {
    const newSelectedStopId = e.target.value;
    setSelectedStopId(newSelectedStopId);

    if (newSelectedStopId === "new") {
        setIsNewStop(true);
        setStopTimeData(prev => ({
            ...prev,
            stop_code: null,
            stop_name: "",
            stop_desc: null,
            stop_lat: null,
            stop_lon: null,
            stop_url: null,
            location_type: null,
            stop_timezone: null,
            wheelchair_boarding: null,
        }));
    } else {
      setIsNewStop(false);
      const selectedStop = allStops.find((stop) => stop.stop_id === parseInt(newSelectedStopId));

        if (selectedStop) {
          setStopTimeData((prev) => ({
            ...prev,
            stop_code: selectedStop.stop_code,
            stop_name: selectedStop.stop_name,
            stop_desc: selectedStop.stop_desc,
            stop_lat: selectedStop.stop_lat,
            stop_lon: selectedStop.stop_lon,
            stop_url: selectedStop.stop_url,
            location_type: selectedStop.location_type,
            stop_timezone: selectedStop.stop_timezone,
            wheelchair_boarding: selectedStop.wheelchair_boarding,
          }));
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu durak zamanını ve durağı güncellemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, güncelle!",
      cancelButtonText: "Hayır",
    });


    if (result.isConfirmed) {
      try {
        const stopData = {
          stop_code: stopTimeData.stop_code,
          stop_name: stopTimeData.stop_name,
          stop_desc: stopTimeData.stop_desc,
          stop_lat: stopTimeData.stop_lat,
          stop_lon: stopTimeData.stop_lon,
          stop_url: stopTimeData.stop_url,
          location_type: stopTimeData.location_type,
          stop_timezone: stopTimeData.stop_timezone,
          wheelchair_boarding: stopTimeData.wheelchair_boarding,
        };

        const stopTime = {
          arrival_time: stopTimeData.arrival_time,
          departure_time: stopTimeData.departure_time,
          stop_sequence: stopTimeData.stop_sequence,
          stop_headsign: stopTimeData.stop_headsign,
          pickup_type: stopTimeData.pickup_type,
          drop_off_type: stopTimeData.drop_off_type,
          shape_dist_traveled: stopTimeData.shape_dist_traveled,
          timepoint: stopTimeData.timepoint,
        };

        let updatedStopId = selectedStopId;

        if (isNewStop) {
          const newStopResponse = await saveStop({ ...stopData, project_id }, token);
          updatedStopId = newStopResponse.stop_id;
        } else {
          await updateStop({ ...stopData, stop_id: selectedStopId, project_id: project_id }, selectedStopId, token);
        }

        await updateStopTime({ ...stopTime, stop_id: updatedStopId }, trip_id, isNewStop ? updatedStopId: stop_id, token);

        setStopsAndTimes((prevStopsAndTimes) => {
          return prevStopsAndTimes.map((st) => {
              if (parseInt(st.trip_id, 10) === parseInt(trip_id, 10) && parseInt(st.stop_id, 10) === parseInt(isNewStop ? updatedStopId : stop_id, 10))
              {
                return {
                  ...st,
                    ...stopTimeData,
                  stop_id: updatedStopId,
                };
              }
              return st;
            });
        });
        if (isNewStop) {
            setStopsAndTimes(prev => [...prev, { ...stopTimeData, trip_id, stop_id: updatedStopId, project_id }]);
        }


        Swal.fire(
          "Güncellendi!",
          "Durak zamanı ve durak başarıyla güncellendi.",
          "success"
        );
        onClose();
      } catch (error) {
        console.error("Error updating stop time and stop:", error);
        Swal.fire(
          "Hata!",
          `Durak zamanı ve durak güncellenirken hata oluştu: ${error.message}`,
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
      <form onSubmit={handleSubmit}>
        <h5 className="mb-3">Stop</h5>
        <div className="mb-2">
          <label htmlFor="stop_select" className="form-label">
            Durak Seçimi
          </label>
          <select
            id="stop_select"
            name="stop_select"
            className="form-control"
            value={selectedStopId}
            onChange={handleStopSelectChange}
          >
            <option value="">Mevcut Bir Durak Seçin</option>
            {allStops.map((stop) => (
              <option key={stop.stop_id} value={stop.stop_id}>
                {stop.stop_name} ({stop.stop_code})
              </option>
            ))}
            <option value="new">Yeni Durak Ekle</option>
          </select>
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
                value={stopTimeData.stop_code || ""}
                onChange={handleChange}
              />
            </div>
            <div className="mb-2">
              <label htmlFor="stop_name" className="form-label">
                Durak Adı
              </label>
              <input
                type="text"
                id="stop_name"
                name="stop_name"
                className="form-control"
                value={stopTimeData.stop_name || ""}
                onChange={handleChange}
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
                value={stopTimeData.stop_desc || ""}
                onChange={handleChange}
              />
            </div>
            <div className="row">
              <div className="col-6 mb-2">
                <label htmlFor="stop_lat" className="form-label">
                  Durak Enlemi
                </label>
                <input
                  type="number"
                  id="stop_lat"
                  name="stop_lat"
                  className="form-control"
                  value={stopTimeData.stop_lat || ""}
                  onChange={handleChange}
                  step="0.000001"
                />
              </div>
              <div className="col-6 mb-2">
                <label htmlFor="stop_lon" className="form-label">
                  Durak Boylamı
                </label>
                <input
                  type="number"
                  id="stop_lon"
                  name="stop_lon"
                  className="form-control"
                  value={stopTimeData.stop_lon || ""}
                  onChange={handleChange}
                  step="0.000001"
                />
              </div>
            </div>
            <div className="mb-2">
              <label htmlFor="stop_url" className="form-label">
                Durak URL si
              </label>
              <input
                type="text"
                id="stop_url"
                name="stop_url"
                className="form-control"
                value={stopTimeData.stop_url || ""}
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
                value={stopTimeData.location_type ?? ""}
                onChange={handleChange}
              >
                <option value="">Seçiniz</option>
                <option value="0">0 - Durak/Platform</option>
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
                value={stopTimeData.stop_timezone || ""}
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
                value={stopTimeData.wheelchair_boarding ?? ""}
                onChange={handleChange}
              >
                <option value="">Seçiniz</option>
                <option value="0">0 - Bilgi Yok</option>
                <option value="1">1 - Mümkün</option>
                <option value="2">2 - Mümkün Değil</option>
              </select>
            </div>
       
        

        <hr />
        <h5 className="my-3">Stop Time</h5>
        <div className="mb-2">
          <label htmlFor="arrival_time" className="form-label">
            Varış Zamanı
          </label>
          <input
            type="text"
            id="arrival_time"
            name="arrival_time"
            className="form-control"
            value={stopTimeData.arrival_time || ""}
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
            value={stopTimeData.departure_time || ""}
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
            value={stopTimeData.stop_headsign || ""}
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
            <option value="">Seçiniz</option>
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
            <option value="">Seçiniz</option>
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
            type="number"
            id="shape_dist_traveled"
            name="shape_dist_traveled"
            className="form-control"
            value={stopTimeData.shape_dist_traveled ?? ""}
            onChange={handleChange}
            step="0.01"
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
            <option value="">Seçiniz</option>
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
  stopsAndTimes: PropTypes.array.isRequired,
};

export default StopTimeEditPage;