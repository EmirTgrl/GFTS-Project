import { useState, useEffect, useContext } from "react";
import { updateCalendar } from "../api/calendarApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const CalendarEditPage = ({
  project_id,
  service_id,
  onClose,
  setCalendars,
  calendars,
}) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        let calendar = Array.isArray(calendars)
          ? calendars.find((cal) => cal.service_id === service_id)
          : calendars.data
          ? calendars.data.find((cal) => cal.service_id === service_id)
          : null;
        if (calendar) {
          setFormData({
            service_id: calendar.service_id || "",
            monday: Number(calendar.monday) || 0,
            tuesday: Number(calendar.tuesday) || 0,
            wednesday: Number(calendar.wednesday) || 0,
            thursday: Number(calendar.thursday) || 0,
            friday: Number(calendar.friday) || 0,
            saturday: Number(calendar.saturday) || 0,
            sunday: Number(calendar.sunday) || 0,
            start_date: calendar.start_date
              ? calendar.start_date.slice(0, 10)
              : "",
            end_date: calendar.end_date ? calendar.end_date.slice(0, 10) : "",
            project_id: calendar.project_id || project_id,
          });
        } else {
          Swal.fire("Error!", "Calendar not found.", "error");
          onClose();
        }
      } catch (error) {
        console.error("Calendar loading Errors:", error);
        Swal.fire(
          "Error!",
          `Error loading the calendar: ${error.message}`,
          "error"
        );
        onClose();
      }
    };
    if (token && service_id) {
      loadCalendar();
    }
  }, [token, service_id, onClose, project_id, calendars]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData?.start_date || !formData?.end_date) {
      Swal.fire("Error!", "Start and end date is required!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to update this calendar?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const calendarData = { ...formData, service_id, project_id };
        await updateCalendar(calendarData, token);
        // Optimist güncelleme: Mevcut state'i güncelle
        setCalendars((prev) => {
          const updatedCalendars = Array.isArray(prev)
            ? prev.map((cal) =>
                cal.service_id === service_id ? calendarData : cal
              )
            : {
                ...prev,
                data: prev.data.map((cal) =>
                  cal.service_id === service_id ? calendarData : cal
                ),
              };
          return updatedCalendars;
        });
        Swal.fire("Updated!", "Calendar successfully updated.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Error!",
          `Error updating the calendar: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <div className="form-container">
      <h5>Update Calendar</h5>
      <form onSubmit={handleSubmit}>
        <div className="row mb-2">
          {[
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].map((day) => (
            <div key={day} className="col-4 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id={day}
                name={day}
                checked={formData[day] === 1}
                onChange={handleChange}
              />
              <label htmlFor={day} className="form-check-label">
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </label>
            </div>
          ))}
        </div>
        <div className="mb-2">
          <label htmlFor="start_date" className="form-label">
            Start Date
          </label>
          <input
            type="date"
            className="form-control"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="end_date" className="form-label">
            End Date
          </label>
          <input
            type="date"
            className="form-control"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

CalendarEditPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  service_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setCalendars: PropTypes.func.isRequired,
  calendars: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({ data: PropTypes.array, total: PropTypes.number }),
  ]).isRequired,
};

export default CalendarEditPage;