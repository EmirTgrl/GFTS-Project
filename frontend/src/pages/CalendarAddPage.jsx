import { useState, useContext } from "react";
import { saveCalendar } from "../api/calendarApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { useTranslation } from "react-i18next";

const CalendarAddPage = ({ project_id, onClose, setCalendars }) => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
    start_date: "",
    end_date: "",
    project_id,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      Swal.fire(t("Error!"), t("Start and end date is required!"), "error");
      return;
    }

    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Are you sure you want to add this calendar?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: t("Yes, add!"),
      cancelButtonText: t("No"),
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const newCalendar = await saveCalendar(formData, token);
        setCalendars((prev) => [...prev, newCalendar]);
        Swal.fire(t("Added!"), t("Calendar successfully added."), "success");
        onClose();
      } catch (error) {
        Swal.fire(
          t("Error!"),
          t("Error adding a calendar:") + " " + error.message,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      {/* <h5>{t("Add New Calendar")}</h5> */}
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
                {t(day.charAt(0).toUpperCase() + day.slice(1, 3))}
              </label>
            </div>
          ))}
        </div>
        <div className="mb-2">
          <label htmlFor="start_date" className="form-label">
            {t("Start Date")} (*)
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
            {t("End Date")} (*)
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
            {loading ? t("Adding...") : t("Add")}
          </button>
        </div>
      </form>
    </div>
  );
};

CalendarAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setCalendars: PropTypes.func.isRequired,
};

export default CalendarAddPage;
