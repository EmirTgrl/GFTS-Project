import { useState, useContext } from "react";
import { saveCalendar } from "../api/calendarApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const CalendarAddPage = ({ project_id, onClose, setCalendars }) => {
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
      Swal.fire("Hata!", "Başlangıç ve bitiş tarihi zorunludur!", "error");
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
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const newCalendar = await saveCalendar(formData, token);
        setCalendars((prev) => [...prev, newCalendar]);
        Swal.fire("Eklendi!", "Takvim başarıyla eklendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Takvim eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Takvim Ekle</h5>
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
        <div className="mb-2">
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
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
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
