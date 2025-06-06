import { useState, useContext, useEffect } from "react";
import { saveStopTime, fetchStopsByRoute } from "../api/stopTimeApi";
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
  route_id,
}) => {
  const { token } = useContext(AuthContext);
  const [stopData, setStopData] = useState({
    stop_id: "",
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
  const [allStops, setAllStops] = useState([]);
  const [selectedStopId, setSelectedStopId] = useState("");
  const [isNewStop, setIsNewStop] = useState(false);

  useEffect(() => {
    const fetchStops = async () => {
      if (route_id) {
        try {
          const stops = await fetchStopsByRoute(route_id, token);
          setAllStops(stops);
        } catch (error) {
          console.error("Error fetching stops:", error);
        }
      }
    };

    fetchStops();
  }, [route_id, token]);

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
      [name]:
        name === "stop_lat" || name === "stop_lon"
          ? value === ""
            ? ""
            : parseFloat(value)
          : name === "stop_sequence" ||
            name === "pickup_type" ||
            name === "drop_off_type" ||
            name === "timepoint" ||
            name === "location_type" ||
            name === "wheelchair_boarding"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : name === "shape_dist_traveled"
          ? value === ""
            ? ""
            : parseFloat(value)
          : value,
    }));
  };

  const handleStopSelectChange = (e) => {
    const newSelectedStopId = e.target.value;
    setSelectedStopId(newSelectedStopId);

    if (newSelectedStopId === "new") {
      setIsNewStop(true);
      setStopData((prev) => ({
        ...prev,
        stop_id: "",
        stop_code: "",
        stop_name: "",
        stop_desc: "",
        stop_lat: initialLat !== undefined ? initialLat : "",
        stop_lon: initialLon !== undefined ? initialLon : "",
        stop_url: "",
        location_type: "",
        stop_timezone: "",
        wheelchair_boarding: "",
      }));
    } else {
      setIsNewStop(false);
      const selectedStop = allStops.find(
        (stop) => stop.stop_id === newSelectedStopId
      );
      if (selectedStop) {
        setStopData((prev) => ({
          ...prev,
          stop_id: selectedStop.stop_id,
          stop_code: selectedStop.stop_code || "",
          stop_name: selectedStop.stop_name || "",
          stop_desc: selectedStop.stop_desc || "",
          stop_lat: selectedStop.stop_lat || "",
          stop_lon: selectedStop.stop_lon || "",
          stop_url: selectedStop.stop_url || "",
          location_type: selectedStop.location_type || "",
          stop_timezone: selectedStop.stop_timezone || "",
          wheelchair_boarding: selectedStop.wheelchair_boarding || "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !stopData.stop_name ||
      !stopData.stop_sequence ||
      !stopData.arrival_time ||
      !stopData.departure_time
    ) {
      Swal.fire(
        "Error!",
        "Stop name, sequence number, arrival and departure time are required!",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to add this stop time?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        let stopResponse;

        const stopDataForApi = {
          stop_id: stopData.stop_id || `${trip_id}_${Date.now()}`,
          stop_code: stopData.stop_code || null,
          stop_name: stopData.stop_name,
          stop_desc: stopData.stop_desc || null,
          stop_lat: stopData.stop_lat || null,
          stop_lon: stopData.stop_lon || null,
          stop_url: stopData.stop_url || null,
          location_type: stopData.location_type || null,
          stop_timezone: stopData.stop_timezone || null,
          wheelchair_boarding: stopData.wheelchair_boarding || null,
          project_id,
        };

        const stopTimeDataForApi = {
          trip_id,
          stop_id: stopDataForApi.stop_id,
          arrival_time: stopData.arrival_time || null,
          departure_time: stopData.departure_time || null,
          stop_sequence: stopData.stop_sequence || null,
          stop_headsign: stopData.stop_headsign || null,
          pickup_type: stopData.pickup_type || null,
          drop_off_type: stopData.drop_off_type || null,
          shape_dist_traveled: stopData.shape_dist_traveled || null,
          timepoint: stopData.timepoint || null,
          project_id,
        };

        if (isNewStop) {
          stopResponse = await saveStop(stopDataForApi, token);
          stopTimeDataForApi.stop_id = stopResponse.stop_id;
        } else {
          stopTimeDataForApi.stop_id = selectedStopId;
        }

        setStopsAndTimes((prevStops) => {
          const currentStops = Array.isArray(prevStops) ? [...prevStops] : [];
          const newSequence = parseInt(stopData.stop_sequence) || 1;

          const updatedStops = currentStops.map((stop) => {
            if (
              stop.trip_id === trip_id &&
              (stop.stop_sequence || 0) >= newSequence
            ) {
              return { ...stop, stop_sequence: (stop.stop_sequence || 0) + 1 };
            }
            return stop;
          });

          const newStop = { ...stopDataForApi, ...stopTimeDataForApi };
          updatedStops.push(newStop);

          return updatedStops.sort(
            (a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0)
          );
        });

        await saveStopTime(stopTimeDataForApi, token);

        Swal.fire("Added!", "Stop time successfully added.", "success");

        setStopData({
          stop_id: "",
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
        setSelectedStopId("");
        setIsNewStop(false);

        if (resetClickedCoords) {
          resetClickedCoords();
        }

        onClose();
      } catch (error) {
        Swal.fire(
          "Error!",
          `Error occurred while adding stop time: ${error.message}`,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h5>Stop</h5>
        <div className="mb-2">
          <label htmlFor="stop_select" className="form-label">
            Stop Selection
          </label>
          <select
            id="stop_select"
            name="stop_select"
            className="form-control"
            value={selectedStopId}
            onChange={handleStopSelectChange}
          >
            <option value="">Choose an Available Stop</option>
            {allStops.map((stop) => (
              <option key={stop.stop_id} value={stop.stop_id}>
                {stop.stop_name} ({stop.stop_code})
              </option>
            ))}
            <option value="new">Add New Stop</option>
          </select>
        </div>
        {isNewStop && (
          <div className="mb-2">
            <label htmlFor="stop_id" className="form-label">
              Stop ID (*)
            </label>
            <input
              type="text"
              id="stop_id"
              name="stop_id"
              className="form-control"
              value={stopData.stop_id}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div className="mb-2">
          <label htmlFor="stop_code" className="form-label">
            Stop Code
          </label>
          <input
            type="text"
            id="stop_code"
            name="stop_code"
            className="form-control"
            value={stopData.stop_code}
            onChange={handleChange}
            disabled={!isNewStop}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_name" className="form-label">
            Stop Name (*)
          </label>
          <input
            type="text"
            id="stop_name"
            name="stop_name"
            className="form-control"
            value={stopData.stop_name}
            onChange={handleChange}
            required
            disabled={!isNewStop}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_desc" className="form-label">
            Stop Description
          </label>
          <input
            type="text"
            id="stop_desc"
            name="stop_desc"
            className="form-control"
            value={stopData.stop_desc}
            onChange={handleChange}
            disabled={!isNewStop}
          />
        </div>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="stop_lat" className="form-label">
              Stop Latitude (*)
            </label>
            <input
              type="number"
              id="stop_lat"
              name="stop_lat"
              className="form-control"
              value={stopData.stop_lat}
              onChange={handleChange}
              step="0.000001"
              readOnly={!isNewStop && initialLat !== undefined}
              required
              disabled={!isNewStop}
            />
          </div>
          <div className="col-6 mb-2">
            <label htmlFor="stop_lon" className="form-label">
              Stop Longtitude (*)
            </label>
            <input
              type="number"
              id="stop_lon"
              name="stop_lon"
              className="form-control"
              value={stopData.stop_lon}
              onChange={handleChange}
              step="0.000001"
              readOnly={!isNewStop && initialLon !== undefined}
              required
              disabled={!isNewStop}
            />
          </div>
        </div>
        <div className="mb-2">
          <label htmlFor="stop_url" className="form-label">
            Stop URL
          </label>
          <input
            type="text"
            id="stop_url"
            name="stop_url"
            className="form-control"
            value={stopData.stop_url}
            onChange={handleChange}
            disabled={!isNewStop}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="location_type" className="form-label">
            Location Type
          </label>
          <select
            id="location_type"
            name="location_type"
            className="form-control"
            value={stopData.location_type}
            onChange={handleChange}
            disabled={!isNewStop}
          >
            <option value="">Select</option>
            <option value="0">0 - Stop</option>
            <option value="1">1 - Station</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="stop_timezone" className="form-label">
            Stop Timezone
          </label>
          <input
            type="text"
            id="stop_timezone"
            name="stop_timezone"
            className="form-control"
            value={stopData.stop_timezone}
            onChange={handleChange}
            disabled={!isNewStop}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="wheelchair_boarding" className="form-label">
            Wheelchair Access
          </label>
          <select
            id="wheelchair_boarding"
            name="wheelchair_boarding"
            className="form-control"
            value={stopData.wheelchair_boarding}
            onChange={handleChange}
            disabled={!isNewStop}
          >
            <option value="">Select</option>
            <option value="0">0 - No Information</option>
            <option value="1">1 - Possible</option>
            <option value="2">2 - Not Possible</option>
          </select>
        </div>
        <hr />
        <h5>Stop Time</h5>
        <div className="mb-2">
          <label htmlFor="arrival_time" className="form-label">
            Arrival Time (*)
          </label>
          <input
            type="text"
            id="arrival_time"
            name="arrival_time"
            className="form-control"
            value={stopData.arrival_time}
            onChange={handleChange}
            placeholder="Ex: 12:30:00"
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="departure_time" className="form-label">
            Departure Time (*)
          </label>
          <input
            type="text"
            id="departure_time"
            name="departure_time"
            className="form-control"
            value={stopData.departure_time}
            onChange={handleChange}
            placeholder="Ex: 12:35:00"
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="stop_sequence" className="form-label">
            Stop Sequence (*)
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
            Stop Headsign
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
              Pickup Type
            </label>
            <select
              id="pickup_type"
              name="pickup_type"
              className="form-control"
              value={stopData.pickup_type}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="0">0 - Normal</option>
              <option value="1">1 - None</option>
              <option value="2">2 - Contact Agency</option>
              <option value="3">3 - Contact Driver</option>
            </select>
          </div>
          <div className="col-6 mb-2">
            <label htmlFor="drop_off_type" className="form-label">
              Drop Off Type
            </label>
            <select
              id="drop_off_type"
              name="drop_off_type"
              className="form-control"
              value={stopData.drop_off_type}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="0">0 - Normal</option>
              <option value="1">1 - None</option>
              <option value="2">2 - Contact Agency</option>
              <option value="3">3 - Contact Driver</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="shape_dist_traveled" className="form-label">
              Shape Distance
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
              Time Point
            </label>
            <select
              id="timepoint"
              name="timepoint"
              className="form-control"
              value={stopData.timepoint}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="1">1 - Full Time</option>
              <option value="0">0 - Approximately</option>
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            Add
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
  route_id: PropTypes.string.isRequired,
};

export default StopTimeAddPage;
