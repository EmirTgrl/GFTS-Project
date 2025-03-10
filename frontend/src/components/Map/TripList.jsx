import PropTypes from "prop-types";
import { deleteTripById } from "../../api/tripApi";
import Swal from "sweetalert2";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const TripList = ({
  token,
  trips,
  setTrips,
  selectedTrip,
  setSelectedTrip,
  // setStopsAndTimes,
  handleTripSelect,
  openForm, // openForm prop’u eklendi
}) => {
  const handleDeleteTrip = async (tripId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu trip’i silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteTripById(tripId, token);
        setTrips((prevTrips) =>
          prevTrips.filter((trip) => trip.trip_id !== tripId)
        );
        if (selectedTrip === tripId) {
          setSelectedTrip(null);
          // setStopsAndTimes([]);
        }
        Swal.fire("Silindi!", "Trip başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting trip:", error);
        Swal.fire("Hata!", "Trip silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleEditTrip = (tripId) => {
    openForm("edit", tripId); // navigate yerine openForm kullanılıyor
  };

  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

  return (
    <div className="tab-pane fade show active h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Tripler</h5>
      </div>
      <div>
        {trips.length > 0 ? (
          trips.map((trip) => (
            <div
              key={trip.trip_id}
              className={`card mb-2 ${
                selectedTrip === trip.trip_id ? "border-primary" : ""
              }`}
              onClick={() => handleTripSelect(trip.trip_id)}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body d-flex justify-content-between align-items-center p-2">
                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip(trip.trip_headsign || trip.trip_id)}
                >
                  <span className="text-truncate" style={{ maxWidth: "60%" }}>
                    {trip.trip_headsign || trip.trip_id}
                  </span>
                </OverlayTrigger>
                <div>
                  <button
                    className="btn btn-outline-primary btn-sm me-1"
                    onClick={(e) => {
                      e.stopPropagation(); // Kartın tıklanmasını engelle
                      handleEditTrip(trip.trip_id);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.trip_id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center">Trip bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

TripList.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  trips: PropTypes.array.isRequired,
  setTrips: PropTypes.func.isRequired,
  selectedTrip: PropTypes.string,
  setSelectedTrip: PropTypes.func.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  handleTripSelect: PropTypes.func.isRequired,
  openForm: PropTypes.func.isRequired, // openForm prop’u eklendi
};

export default TripList;
