import { useState, useEffect, useContext } from "react";
import { updateStopTime, fetchStopsByRoute, fetchStopsAndStopTimesByTripId } from "../api/stopTimeApi";
import { updateStop, saveStop } from "../api/stopApi";
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
  route_id,
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
        const stopsResponse = await fetchStopsByRoute(route_id, project_id, token);
        setAllStops(stopsResponse);

        const stopTimeResponse = (stopsAndTimes || []).find(
          (st) => st.stop_id === stop_id && st.trip_id === trip_id
        );

        if (!stopTimeResponse) {
          throw new Error("Stop time data not found.");
        }

        setStopTimeData({
          stop_code: stopTimeResponse.stop_code || "",
          stop_name: stopTimeResponse.stop_name || "",
          stop_desc: stopTimeResponse.stop_desc || "",
          stop_lat: stopTimeResponse.stop_lat || "",
          stop_lon: stopTimeResponse.stop_lon || "",
          stop_url: stopTimeResponse.stop_url || "",
          location_type: stopTimeResponse.location_type || "",
          stop_timezone: stopTimeResponse.stop_timezone || "",
          wheelchair_boarding: stopTimeResponse.wheelchair_boarding || "",
          arrival_time: stopTimeResponse.arrival_time || "",
          departure_time: stopTimeResponse.departure_time || "",
          stop_sequence: stopTimeResponse.stop_sequence || "",
          stop_headsign: stopTimeResponse.stop_headsign || "",
          pickup_type: stopTimeResponse.pickup_type || "",
          drop_off_type: stopTimeResponse.drop_off_type || "",
          shape_dist_traveled: stopTimeResponse.shape_dist_traveled || "",
          timepoint: stopTimeResponse.timepoint || "",
          trip_id: stopTimeResponse.trip_id || trip_id,
          project_id: stopTimeResponse.project_id || project_id,
          stop_id: stopTimeResponse.stop_id || stop_id,
        });
      } catch (err) {
        console.error("Error fetching/parsing stop time data:", err);
        setError(err.message || "Failed to load stop time data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [trip_id, stop_id, project_id, stopsAndTimes, token, route_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStopTimeData((prev) => ({
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
      setStopTimeData((prev) => ({
        ...prev,
        stop_id: "",
        stop_code: "",
        stop_name: "",
        stop_desc: "",
        stop_lat: "",
        stop_lon: "",
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
        setStopTimeData((prev) => ({
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

    if (!stopTimeData.stop_name || !stopTimeData.stop_sequence) {
      Swal.fire(
        "Error!",
        "Stop name and sequence number are required!",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to update this stop time and stop?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        const stopData = {
          stop_id: stopTimeData.stop_id,
          stop_code: stopTimeData.stop_code || null,
          stop_name: stopTimeData.stop_name,
          stop_desc: stopTimeData.stop_desc || null,
          stop_lat: stopTimeData.stop_lat || null,
          stop_lon: stopTimeData.stop_lon || null,
          stop_url: stopTimeData.stop_url || null,
          location_type: stopTimeData.location_type || null,
          stop_timezone: stopTimeData.stop_timezone || null,
          wheelchair_boarding: stopTimeData.wheelchair_boarding || null,
          project_id,
        };

        const stopTime = {
          arrival_time: stopTimeData.arrival_time || null,
          departure_time: stopTimeData.departure_time || null,
          stop_sequence: stopTimeData.stop_sequence || null,
          stop_headsign: stopTimeData.stop_headsign || null,
          pickup_type: stopTimeData.pickup_type || null,
          drop_off_type: stopTimeData.drop_off_type || null,
          shape_dist_traveled: stopTimeData.shape_dist_traveled || null,
          timepoint: stopTimeData.timepoint || null,
          project_id,
        };

        let updatedStopId = selectedStopId;

        if (isNewStop) {
          stopData.stop_id = stopData.stop_id || `${trip_id}_${Date.now()}`;
          const newStopResponse = await saveStop(stopData, token);
          updatedStopId = newStopResponse.stop_id;
        } else {
          await updateStop(stopData, selectedStopId, token);
        }

        const originalSequence = stopsAndTimes.find(
          (st) => st.stop_id === stop_id && st.trip_id === trip_id
        ).stop_sequence;
        const newSequence = parseInt(stopTimeData.stop_sequence);

        let updatedStopsAndTimes = [...stopsAndTimes];

        if (originalSequence !== newSequence) {
          const tripStops = updatedStopsAndTimes
            .filter((st) => st.trip_id === trip_id)
            .sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));

          const currentStop = tripStops.find((st) => st.stop_id === stop_id);
          const currentIndex = tripStops.indexOf(currentStop);

          const newTripStops = [...tripStops];
          newTripStops.splice(currentIndex, 1);
          newTripStops.splice(newSequence - 1, 0, {
            ...currentStop,
            ...stopTime,
            stop_id: updatedStopId,
            stop_sequence: newSequence,
          });

          const resequencedStops = newTripStops.map((stop, index) => ({
            ...stop,
            stop_sequence: index + 1,
          }));

          updatedStopsAndTimes = updatedStopsAndTimes.map((st) =>
            st.trip_id === trip_id
              ? resequencedStops.find((rs) => rs.stop_id === st.stop_id) || st
              : st
          );

          await Promise.all(
            resequencedStops.map((st) =>
              updateStopTime(
                { ...st, stop_id: st.stop_id },
                trip_id,
                st.stop_id,
                token
              )
            )
          );

          setStopsAndTimes(updatedStopsAndTimes);
        } else {
          await updateStopTime(
            { ...stopTime, stop_id: updatedStopId },
            trip_id,
            isNewStop ? updatedStopId : stop_id,
            token
          );
          updatedStopsAndTimes = updatedStopsAndTimes.map((st) =>
            st.stop_id === stop_id && st.trip_id === trip_id
              ? { ...st, ...stopTime, stop_id: updatedStopId }
              : st
          );
          setStopsAndTimes(updatedStopsAndTimes);
        }

        if (isNewStop) {
          setStopsAndTimes((prev) => [
            ...prev,
            { ...stopTimeData, trip_id, stop_id: updatedStopId, project_id },
          ]);
        }

        // GÜNCELLEME SONRASI stopsAndTimes'i backend'den tekrar çek
        const updatedStops = await fetchStopsAndStopTimesByTripId(
          trip_id,
          project_id,
          token
        );
        setStopsAndTimes({
          data: updatedStops || [],
          total: updatedStops?.length || 0,
        });

        Swal.fire(
          "Updated!",
          "Stop time and stop successfully updated.",
          "success"
        );
        onClose();
      } catch (error) {
        console.error("Error updating stop time and stop:", error);
        Swal.fire(
          "Error!",
          `Error updating stop time and stop: ${error.message}`,
          "error"
        );
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!stopTimeData) return <p>No data found.</p>;

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h5 className="mb-3">Stop</h5>
        <div className="mb-2">
          <label htmlFor="stop_id" className="form-label">
            Stop ID (Cannot be changed)
          </label>
          <input
            type="text"
            id="stop_id"
            name="stop_id"
            className="form-control"
            value={stopTimeData.stop_id}
            disabled
          />
        </div>
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
            <label htmlFor="new_stop_id" className="form-label">
              New Stop ID (*)
            </label>
            <input
              type="text"
              id="new_stop_id"
              name="stop_id"
              className="form-control"
              value={stopTimeData.stop_id}
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
            value={stopTimeData.stop_code || ""}
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
            value={stopTimeData.stop_name || ""}
            onChange={handleChange}
            required
            // disabled={!isNewStop}
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
            value={stopTimeData.stop_desc || ""}
            onChange={handleChange}
            disabled={!isNewStop}
          />
        </div>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="stop_lat" className="form-label">
              Stop Latitude
            </label>
            <input
              type="number"
              id="stop_lat"
              name="stop_lat"
              className="form-control"
              value={stopTimeData.stop_lat || ""}
              onChange={handleChange}
              step="0.000001"
              disabled={!isNewStop}
            />
          </div>
          <div className="col-6 mb-2">
            <label htmlFor="stop_lon" className="form-label">
              Stop Longitude
            </label>
            <input
              type="number"
              id="stop_lon"
              name="stop_lon"
              className="form-control"
              value={stopTimeData.stop_lon || ""}
              onChange={handleChange}
              step="0.000001"
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
            value={stopTimeData.stop_url || ""}
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
            value={stopTimeData.location_type || ""}
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
            Stop Time Zone
          </label>
          <input
            type="text"
            id="stop_timezone"
            name="stop_timezone"
            className="form-control"
            value={stopTimeData.stop_timezone || ""}
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
            value={stopTimeData.wheelchair_boarding || ""}
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
        <h5 className="my-3">Stop Time</h5>
        <div className="mb-2">
          <label htmlFor="arrival_time" className="form-label">
            Arrival Time
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
            Departure Time
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
            Stop Sequence (*)
          </label>
          <input
            type="number"
            id="stop_sequence"
            name="stop_sequence"
            className="form-control"
            value={stopTimeData.stop_sequence || ""}
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
            value={stopTimeData.stop_headsign || ""}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="pickup_type" className="form-label">
            Pickup Type
          </label>
          <select
            id="pickup_type"
            name="pickup_type"
            className="form-control"
            value={stopTimeData.pickup_type || ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="0">0 - Normal</option>
            <option value="1">1 - None</option>
            <option value="2">2 - Contact Agency</option>
            <option value="3">3 - Contact Driver</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="drop_off_type" className="form-label">
            Drop Off Type
          </label>
          <select
            id="drop_off_type"
            name="drop_off_type"
            className="form-control"
            value={stopTimeData.drop_off_type || ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="0">0 - Normal</option>
            <option value="1">1 - None</option>
            <option value="2">2 - Contact Agency</option>
            <option value="3">3 - Contact Driver</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="shape_dist_traveled" className="form-label">
            Shape Distance (Meter)
          </label>
          <input
            type="number"
            id="shape_dist_traveled"
            name="shape_dist_traveled"
            className="form-control"
            value={stopTimeData.shape_dist_traveled || ""}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="timepoint" className="form-label">
            Time Point
          </label>
          <select
            id="timepoint"
            name="timepoint"
            className="form-control"
            value={stopTimeData.timepoint || ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="1">1 - Full Time</option>
            <option value="0">0 - Approximately</option>
          </select>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            Save
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
  stopsAndTimes: PropTypes.arrayOf(
    PropTypes.shape({
      stop_id: PropTypes.string.isRequired,
      trip_id: PropTypes.string.isRequired,
      project_id: PropTypes.string,
      stop_code: PropTypes.string,
      stop_name: PropTypes.string,
      stop_desc: PropTypes.string,
      stop_lat: PropTypes.number,
      stop_lon: PropTypes.number,
      stop_url: PropTypes.string,
      location_type: PropTypes.number,
      stop_timezone: PropTypes.string,
      wheelchair_boarding: PropTypes.number,
      arrival_time: PropTypes.string,
      departure_time: PropTypes.string,
      stop_sequence: PropTypes.number,
      stop_headsign: PropTypes.string,
      pickup_type: PropTypes.number,
      drop_off_type: PropTypes.number,
      shape_dist_traveled: PropTypes.number,
      timepoint: PropTypes.number,
    })
  ).isRequired,
  route_id: PropTypes.string.isRequired,
};

export default StopTimeEditPage;
