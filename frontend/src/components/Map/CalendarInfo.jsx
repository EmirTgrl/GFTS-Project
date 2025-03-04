import PropTypes from "prop-types";

const CalendarInfo = ({ calendar }) => {
  return (
    <div className="tab-pane fade show active h-100">
      <h5 className="mb-2">Çalışma Günleri</h5>
      <div className="card">
        <div className="card-body p-2">
          <p className="card-text">
            {calendar.monday &&
            calendar.tuesday &&
            calendar.wednesday &&
            calendar.thursday &&
            calendar.friday &&
            calendar.saturday &&
            calendar.sunday
              ? "Her gün çalışıyor"
              : [
                  calendar.monday && "Pzt",
                  calendar.tuesday && "Sal",
                  calendar.wednesday && "Çar",
                  calendar.thursday && "Per",
                  calendar.friday && "Cum",
                  calendar.saturday && "Cmt",
                  calendar.sunday && "Paz",
                ]
                  .filter(Boolean)
                  .join(", ") || "Veri yok"}
          </p>
        </div>
      </div>
    </div>
  );
};

CalendarInfo.propTypes = {
  calendar: PropTypes.object.isRequired,
};

export default CalendarInfo;
