import PropTypes from "prop-types";
import { deleteStopTimeById } from "../../api/stopTimeApi";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const StopList = ({
  token,
  stopsAndTimes,
  setStopsAndTimes,
  openForm, 
}) => {
  const handleDeleteStopTime = async (tripId, stopId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu durak zamanını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteStopTimeById(tripId, stopId, token); // project_id burada gerekli değil
        setStopsAndTimes((prevStopsAndTimes) =>
          prevStopsAndTimes.filter(
            (stopTime) =>
              stopTime.stop_id !== stopId || stopTime.trip_id !== tripId
          )
        );
        Swal.fire("Silindi!", "Durak zamanı başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting stop time:", error);
        Swal.fire("Hata!", "Durak zamanı silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleEditStopTime = (tripId, stopId) => {
    console.log("Editing stop time with trip_id:", tripId, "stop_id:", stopId);
    openForm("edit", stopId); // Sidebar’daki openStopTimeForm’u tetikliyoruz
  };

  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

  return (
    <div className="tab-pane fade show active h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Duraklar</h5>
      </div>
      <div>
        {stopsAndTimes.length > 0 ? (
          stopsAndTimes.map((stopAndTime) => (
            <div
              key={stopAndTime.stop_id + stopAndTime.stop_sequence}
              className="card mb-2"
            >
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-center">
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(
                      stopAndTime ? stopAndTime.stop_name : "Bilinmeyen Durak"
                    )}
                  >
                    <h6
                      className="card-title mb-0 text-truncate"
                      style={{ maxWidth: "60%" }}
                    >
                      {stopAndTime ? stopAndTime.stop_name : "Bilinmeyen Durak"}
                    </h6>
                  </OverlayTrigger>
                  <div>
                    <button
                      className="btn btn-outline-primary btn-sm me-1"
                      onClick={() =>
                        handleEditStopTime(
                          stopAndTime.trip_id,
                          stopAndTime.stop_id
                        )
                      }
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        handleDeleteStopTime(
                          stopAndTime.trip_id,
                          stopAndTime.stop_id
                        )
                      }
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="card-text small mt-1">
                  Varış: {stopAndTime.arrival_time || "Bilinmiyor"} <br />
                  Kalkış: {stopAndTime.departure_time || "Bilinmiyor"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center">Durak bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

StopList.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  stopsAndTimes: PropTypes.array.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  selectedTrip: PropTypes.string,
  openForm: PropTypes.func.isRequired, // openForm prop’u eklendi
};

export default StopList;
