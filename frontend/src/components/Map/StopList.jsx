import PropTypes from "prop-types";
import { deleteStopTimeById } from "../../api/stopTimeApi";
import Swal from "sweetalert2";

const StopList = ({
  token,
  project_id,
  stopsAndTimes,
  setStopsAndTimes,
  selectedTrip,
  navigate,
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
        await deleteStopTimeById(tripId, stopId, project_id, token);
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
    navigate(`/edit-stop-time/${project_id}/${tripId}/${stopId}`, {
      state: { selectedRoute: null, selectedTrip },
    });
  };

  const handleAddStopTime = () => {
    navigate(`/add-stop-time/${project_id}/${selectedTrip}`, {
      state: { selectedRoute: null, selectedTrip },
    });
  };

  return (
    <div className="tab-pane fade show active h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Duraklar</h5>
        <button className="btn btn-success btn-sm" onClick={handleAddStopTime}>
          Yeni Durak
        </button>
      </div>
      <div>
        {stopsAndTimes.map((stopAndTime) => (
          <div
            key={stopAndTime.stop_id + stopAndTime.stop_sequence}
            className="card mb-2"
          >
            <div className="card-body p-2">
              <div className="d-flex justify-content-between align-items-center">
                <h6
                  className="card-title mb-0 text-truncate"
                  style={{ maxWidth: "60%" }}
                  title={
                    stopAndTime ? stopAndTime.stop_name : "Bilinmeyen Durak"
                  }
                >
                  {stopAndTime ? stopAndTime.stop_name : "Bilinmeyen Durak"}
                </h6>
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
        ))}
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
  navigate: PropTypes.func.isRequired,
};

export default StopList;
