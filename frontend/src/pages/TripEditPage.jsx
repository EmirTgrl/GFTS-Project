import { useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { updateTrip } from "../api/tripApi";

const TripEditPage = ({
  project_id,
  trip_id,
  onClose,
  setTrips,
  routes,
  calendars,
  trips,
}) => {
  const { token } = useContext(AuthContext);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tripList = trips.data || trips;
        const trip = tripList.find((t) => t.trip_id === trip_id);

        if (!trip) {
          throw new Error("Trip bulunamadı");
        }

        setTripData({
          trip_id: trip.trip_id || trip_id,
          service_id: trip.service_id || "",
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
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [trip_id, project_id, trips]);

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
      { name: "Mon", value: calendar.monday },
      { name: "Tue", value: calendar.tuesday },
      { name: "Wed", value: calendar.wednesday },
      { name: "Thu", value: calendar.thursday },
      { name: "Fri", value: calendar.friday },
      { name: "Sat", value: calendar.saturday },
      { name: "Sun", value: calendar.sunday },
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
    if (!tripData.service_id || !tripData.trip_headsign || !tripData.route_id) {
      Swal.fire(
        "Error!",
        "Service, trip title and route are required!",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to update this trip?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        const tripDataForApi = { ...tripData, project_id, trip_id };
        await updateTrip(tripDataForApi, token);
        setTrips((prev) => {
          const tripList = prev.data || prev;
          return {
            ...prev,
            data: tripList.map((t) =>
              t.trip_id === trip_id ? { ...t, ...tripData } : t
            ),
          };
        });
        Swal.fire("Updated!", "Trip successfully updated.", "success");
        onClose();
      } catch (error) {
        Swal.fire("Error!", `Error updating Trip: ${error.message}`, "error");
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!tripData) return <p>No data found for this trip. Trip ID: {trip_id}</p>;

  return (
    <div className="form-container">
      <h5>Update Trip</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="trip_id" className="form-label">
            Trip ID (Cannot be changed)
          </label>
          <input
            type="text"
            id="trip_id"
            name="trip_id"
            className="form-control"
            value={tripData.trip_id}
            disabled
          />
        </div>
        <div className="mb-2">
          <label htmlFor="route_id" className="form-label">
            Route (*)
          </label>
          <select
            id="route_id"
            name="route_id"
            className="form-control"
            value={tripData.route_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a Route</option>
            {routes.map((route) => (
              <option key={route.route_id} value={route.route_id}>
                {route.route_long_name ||
                  route.route_short_name ||
                  route.route_id}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="service_id" className="form-label">
            Calendar (*)
          </label>
          <select
            id="service_id"
            name="service_id"
            className="form-control"
            value={tripData.service_id}
            onChange={handleChange}
            required
          >
            <option value="">Select a Calendar</option>
            {calendars.map((calendar) => (
              <option key={calendar.service_id} value={calendar.service_id}>
                {getServiceName(calendar)}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="trip_headsign" className="form-label">
            Trip Headsign (*)
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
            Trip Short Name
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
            Direction
          </label>
          <select
            id="direction_id"
            name="direction_id"
            className="form-control"
            value={tripData.direction_id ?? ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="0">0 - Departure</option>
            <option value="1">1 - Return</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="block_id" className="form-label">
            Block ID
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
        <div className="mb-2">
          <label htmlFor="wheelchair_accessible" className="form-label">
            Wheelchair Access
          </label>
          <select
            id="wheelchair_accessible"
            name="wheelchair_accessible"
            className="form-control"
            value={tripData.wheelchair_accessible ?? ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="0">0 - No Information</option>
            <option value="1">1 - Accessible</option>
            <option value="2">2 - Inaccessible</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="bikes_allowed" className="form-label">
            Bikes Allowed
          </label>
          <select
            id="bikes_allowed"
            name="bikes_allowed"
            className="form-control"
            value={tripData.bikes_allowed ?? ""}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="0">0 - No Information</option>
            <option value="1">1 - Permission Available</option>
            <option value="2">2 - No Permission</option>
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

TripEditPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  trip_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setTrips: PropTypes.func.isRequired,
  calendars: PropTypes.arrayOf(
    PropTypes.shape({
      service_id: PropTypes.string.isRequired,
      monday: PropTypes.number,
      tuesday: PropTypes.number,
      wednesday: PropTypes.number,
      thursday: PropTypes.number,
      friday: PropTypes.number,
      saturday: PropTypes.number,
      sunday: PropTypes.number,
    })
  ).isRequired,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      route_id: PropTypes.string.isRequired,
      route_long_name: PropTypes.string,
      route_short_name: PropTypes.string,
    })
  ).isRequired,
  trips: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        trip_id: PropTypes.string.isRequired,
        service_id: PropTypes.string,
        route_id: PropTypes.string,
        project_id: PropTypes.string,
        trip_headsign: PropTypes.string,
        trip_short_name: PropTypes.string,
        direction_id: PropTypes.number,
        block_id: PropTypes.string,
        wheelchair_accessible: PropTypes.number,
        bikes_allowed: PropTypes.number,
      })
    ),
    PropTypes.shape({
      data: PropTypes.arrayOf(
        PropTypes.shape({
          trip_id: PropTypes.string.isRequired,
          service_id: PropTypes.string,
          route_id: PropTypes.string,
          project_id: PropTypes.string,
          trip_headsign: PropTypes.string,
          trip_short_name: PropTypes.string,
          direction_id: PropTypes.number,
          block_id: PropTypes.string,
          wheelchair_accessible: PropTypes.number,
          bikes_allowed: PropTypes.number,
        })
      ).isRequired,
    }),
  ]).isRequired,
};

export default TripEditPage;
