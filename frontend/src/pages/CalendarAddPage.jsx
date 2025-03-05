import { useState } from "react";
import PropTypes from "prop-types";
import { saveCalendar } from "../api/calendarApi";
import Swal from "sweetalert2";

const CalendarAddPage = ({ token, project_id, setCalendar, onClose }) => {
  const [formData, setFormData] = useState({
    monday: "0",
    tuesday: "0",
    wednesday: "0",
    thursday: "0",
    friday: "0",
    saturday: "0",
    sunday: "0",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "1" : "0") : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      setError("Başlangıç ve bitiş tarihi zorunludur!");
      return;
    }

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu takvimi eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        setError(null);
        const calendarData = { project_id, ...formData }; // service_id yok
        const result = await saveCalendar(calendarData, token);
        setCalendar(result);
        Swal.fire("Eklendi!", "Takvim başarıyla eklendi.", "success");
        onClose();
      } catch (err) {
        setError("Takvim eklenirken bir hata oluştu.");
        console.error("Error adding calendar:", err);
        Swal.fire("Hata!", "Takvim eklenirken bir hata oluştu.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header">Yeni Takvim Ekle</div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
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
                  checked={
                    formData[day] === "1" ||
                    formData[day] === 1 ||
                    formData[day] === true
                  }
                  onChange={handleChange}
                />
                <label htmlFor={day} className="form-check-label">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              </div>
            ))}
          </div>
          <div className="mb-3">
            <label htmlFor="start_date" className="form-label">
              Başlangıç Tarihi
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
          <div className="mb-3">
            <label htmlFor="end_date" className="form-label">
              Bitiş Tarihi
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
          {error && <div className="alert alert-danger">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={loading}
          >
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </form>
      </div>
    </div>
  );
};

CalendarAddPage.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  setCalendar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CalendarAddPage;
