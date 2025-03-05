import { useState } from "react";
import PropTypes from "prop-types";
import { updateCalendar } from "../api/calendarApi";
import Swal from "sweetalert2";

const CalendarEditPage = ({
  token,
  project_id,
  calendar,
  setCalendar,
  onClose,
}) => {
  const [formData, setFormData] = useState({ ...calendar });
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
      text: "Bu takvimi güncellemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, güncelle!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        setError(null);
        const calendarData = { project_id, ...formData };
        delete calendarData.service_id; // service_id’yi göndermiyoruz
        await updateCalendar(calendarData, token);
        setCalendar(calendarData);
        Swal.fire("Güncellendi!", "Takvim başarıyla güncellendi.", "success");
        onClose();
      } catch (err) {
        setError("Takvim güncellenirken bir hata oluştu.");
        console.error("Error updating calendar:", err);
        Swal.fire("Hata!", "Takvim güncellenirken bir hata oluştu.", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-header">Takvimi Düzenle</div>
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
              value={formData.start_date.slice(0, 10)} // YYYY-MM-DD formatı için
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
              value={formData.end_date.slice(0, 10)} // YYYY-MM-DD formatı için
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
