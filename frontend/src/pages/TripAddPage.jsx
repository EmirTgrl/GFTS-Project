import { useState, useContext } from "react";
import { saveTrip } from "../api/tripApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { useTranslation } from "react-i18next";

const TripAddPage = ({
  project_id,
  onClose,
  setTrips,
  calendars,
  selectedRoute,
}) => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [tripData, setTripData] = useState({
    trip_id: "",
    service_id: "",
    route_id: selectedRoute?.route_id || "",
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
      { name: t("Mon"), value: calendar.monday },
      { name: t("Tue"), value: calendar.tuesday },
      { name: t("Wed"), value: calendar.wednesday },
      { name: t("Thu"), value: calendar.thursday },
      { name: t("Fri"), value: calendar.friday },
      { name: t("Sat"), value: calendar.saturday },
      { name: t("Sun"), value: calendar.sunday },
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
    if (!tripData.trip_id || !tripData.service_id || !tripData.trip_headsign) {
      Swal.fire(
        t("Error!"),
        t("Trip ID, service and trip title are mandatory!"),
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Are you sure you want to add this trip?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t("Yes, add!"),
      cancelButtonText: t("No"),
    });

    if (result.isConfirmed) {
      try {
        const formData = {
          ...tripData,
          project_id,
          route_id: selectedRoute.route_id,
        };
        const response = await saveTrip(formData, token);
        const trip_id = response.trip_id;
        setTrips((prev) => ({
          ...prev,
          data: [...prev.data, { ...formData, trip_id }],
        }));
        Swal.fire(t("Added!"), t("Trip successfully added."), "success");
        onClose();
      } catch (error) {
        Swal.fire(
          t("Error!"),
          t("Error adding Trip:") + " " + error.message,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      {/* <h5>{t("Add New Trip")}</h5> */}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="trip_id" className="form-label">
            {t("Trip ID")} (*)
          </label>
          <input
            type="text"
            id="trip_id"
            name="trip_id"
            className="form-control"
            value={tripData.trip_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="service_id" className="form-label">
            {t("Calendar")} (*)
          </label>
          <select
            id="service_id"
            name="service_id"
            className="form-control"
            value={tripData.service_id}
            onChange={handleChange}
            required
          >
            <option value="">{t("Select a Calendar")}</option>
            {calendars.map((calendar) => (
              <option key={calendar.service_id} value={calendar.service_id}>
                {getServiceName(calendar)}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="trip_headsign" className="form-label">
            {t("Trip Headsign")} (*)
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
            {t("Trip Short Name")}
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
            {t("Direction")}
          </label>
          <select
            id="direction_id"
            name="direction_id"
            className="form-control"
            value={tripData.direction_id ?? ""}
            onChange={handleChange}
          >
            <option value="">{t("Select")}</option>
            <option value="0">{t("0 - Departure")}</option>
            <option value="1">{t("1 - Return")}</option>
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            {t("Add")}
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
  selectedRoute: PropTypes.shape({
    route_id: PropTypes.string.isRequired,
  }),
};

export default TripAddPage;
