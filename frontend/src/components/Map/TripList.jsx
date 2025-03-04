import PropTypes from "prop-types";
import { deleteTripById } from "../../api/tripApi";
import Swal from "sweetalert2";

const TripList = ({
  token,
  project_id,
  trips,
  setTrips,
  selectedTrip,
  setSelectedTrip,
  setStopsAndTimes,
  navigate,
  handleTripSelect,
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
          setStopsAndTimes([]);
        }
        Swal.fire("Silindi!", "Trip başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting trip:", error);
        Swal.fire("Hata!", "Trip silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleEditTrip = (tripId) => {
    navigate(`/edit-trip/${project_id}/${tripId}`, {
      state: { selectedRoute: null, selectedTrip },
    });
  };

  const handleAddTrip = () => {
    navigate(`/add-trip/${project_id}`, {
      state: { selectedRoute: null, selectedTrip },
    });
  };

  return (
    <div className="tab-pane fade show active h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Tripler</h5>
        <button className="btn btn-success btn-sm" onClick={handleAddTrip}>
          Yeni Trip
        </button>
      </div>
      <select
        className="form-select mb-3"
        value={selectedTrip || ""}
        onChange={(e) => handleTripSelect(e.target.value)}
        disabled={trips.length === 0}
      >
        <option value="">Trip Seçin</option>
        {trips.map((trip) => (
          <option key={trip.trip_id} value={trip.trip_id}>
            {trip.trip_headsign
              ? `${trip.trip_headsign} (${trip.trip_id})`
              : trip.trip_id}
          </option>
        ))}
      </select>
      <div>
        {trips.map((trip) => (
          <div key={trip.trip_id} className="card mb-2">
            <div className="card-body d-flex justify-content-between align-items-center p-2">
              <span
                className="text-truncate"
                style={{ maxWidth: "60%" }}
                title={trip.trip_headsign || trip.trip_id}
              >
                {trip.trip_headsign || trip.trip_id}
              </span>
              <div>
                <button
                  className="btn btn-outline-primary btn-sm me-1"
                  onClick={() => handleEditTrip(trip.trip_id)}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteTrip(trip.trip_id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
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
  setCalendar: PropTypes.func.isRequired,
  setMapCenter: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  handleTripSelect: PropTypes.func.isRequired,
};

export default TripList;
