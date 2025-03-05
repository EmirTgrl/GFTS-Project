import { useState } from "react";
import PropTypes from "prop-types";
import { updateCalendar } from "../api/calendarApi";

const CalendarEditPage = ({ token, project_id, calendar, setCalendar, onClose }) => {
  const [formData, setFormData] = useState({ ...calendar });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      setError("Başlangıç ve bitiş tarihi zorunludur!");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const calendarData = { project_id, ...formData };
      await updateCalendar(calendarData, token);
      setCalendar(calendarData);
      onClose(); // Formu kapat
    } catch (err) {
      setError("Takvim güncellenirken bir hata oluştu.");
      console.error("Error updating calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header">Takvimi Düzenle</div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="service_id" className="form-label">Servis ID</label>
            <input
              type="text"
              className="form-control"
              id="service_id"
              name="service_id"
              value={formData.service_id}
              readOnly
            />
          </div>
          <div className="row mb-3">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <div key={day} className="col-4">
                <label htmlFor={day} className="form-label">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                <select
                  className="form-select"
                  id={day}
                  name={day}
                  value={formData[day]}
                  onChange={handleChange}
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label htmlFor="start_date" className="form-label">Başlangıç Tarihi (YYYYMMDD)</label>
            <input
              type="text"
              className="form-control"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="end_date" className="form-label">Bitiş Tarihi (YYYYMMDD)</label>
            <input
              type="text"
              className="form-control"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <button type="submit" className="btn btn-primary me-2" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </form>
      </div>
    </div>
  );
};

CalendarEditPage.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  calendar: PropTypes.object.isRequired,
  setCalendar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CalendarEditPage;