import { useState, useEffect, useContext } from "react";
import { updateCalendar, fetchCalendarByServiceId } from "../api/calendarApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const CalendarEditPage = ({
  project_id,
  service_id,
  onClose,
  setCalendars,
}) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const calendar = await fetchCalendarByServiceId(service_id, token);
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
          Swal.fire("Hata!", "Takvim bulunamadı.", "error");
          onClose();
        }
      } catch (error) {
        console.error("Takvim yükleme hatası:", error);
        Swal.fire(
          "Hata!",
          `Takvim yüklenirken hata oluştu: ${error.message}`,
          "error"
        );
        onClose();
      }
    };
    if (token && service_id) {
      loadCalendar();
    }
  }, [token, service_id, onClose, project_id]);

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
      Swal.fire("Hata!", "Başlangıç ve bitiş tarihi zorunludur!", "error");
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
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const calendarData = { ...formData, service_id, project_id };
        const response = await updateCalendar(calendarData, token);
        setCalendars((prev) =>
          prev.map((cal) =>
            cal.service_id === service_id ? calendarData : cal
          )
        );
        Swal.fire("Güncellendi!", "Takvim başarıyla güncellendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Takvim güncellenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!formData) return <p>Yükleniyor...</p>;

  return (
    <div className="form-container">
      <h5>Takvim Düzenle</h5>
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
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
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
};

export default CalendarEditPage;
