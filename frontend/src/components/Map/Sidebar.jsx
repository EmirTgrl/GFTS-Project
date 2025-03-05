import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { fetchRoutesByProjectId, deleteRouteById } from "../../api/routeApi";
import { fetchTripsByRouteId, deleteTripById } from "../../api/tripApi";
import {
  fetchStopsAndStopTimesByTripId,
  deleteStopTimeById,
} from "../../api/stopTimeApi";
import { fetchCalendarByServiceId } from "../../api/calendarApi";
import {
  fetchAgenciesByProjectId,
  deleteAgencyById,
} from "../../api/agencyApi";
import AgencyAdd from "../../pages/AgencyAddPage";
import AgencyEdit from "../../pages/AgencyEditPage";
import CalendarAdd from "../../pages/CalendarAddPage";
import CalendarEdit from "../../pages/CalendarEditPage";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Sidebar = ({
  token,
  project_id,
  routes,
  setRoutes,
  selectedRoute,
  setSelectedRoute,
  trips,
  setTrips,
  selectedTrip,
  setSelectedTrip,
  stopsAndTimes,
  setStopsAndTimes,
  calendar,
  setCalendar,
  setMapCenter,
  setZoom,
  location,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("routes");
  const [agencies, setAgencies] = useState([]);
  const [showAgencyAdd, setShowAgencyAdd] = useState(false);
  const [showAgencyEdit, setShowAgencyEdit] = useState(null);
  const [showCalendarAdd, setShowCalendarAdd] = useState(false);
  const [showCalendarEdit, setShowCalendarEdit] = useState(false);
  const navigate = useNavigate();

  // Ajansları yükle
  useEffect(() => {
    const loadAgencies = async () => {
      try {
        const data = await fetchAgenciesByProjectId(project_id, token);
        setAgencies(data);
      } catch (error) {
        console.error("Error fetching agencies:", error);
        setAgencies([]);
      }
    };
    if (token && project_id) loadAgencies();
  }, [token, project_id]);

  // Rotaları yükle
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await fetchRoutesByProjectId(project_id, token);
        setRoutes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutes([]);
      }
    };
    if (token && project_id) loadInitialData();
  }, [token, project_id, setRoutes]);

  // Refresh kontrolü
  useEffect(() => {
    const { refresh } = location.state || {};
    if (refresh) {
      if (activeTab === "routes") {
        fetchRoutesByProjectId(project_id, token)
          .then(setRoutes)
          .catch(console.error);
      } else if (activeTab === "trips" && selectedRoute) {
        fetchTripsByRouteId(selectedRoute, token)
          .then(setTrips)
          .catch(console.error);
      } else if (activeTab === "stops" && selectedTrip) {
        fetchStopsAndStopTimesByTripId(selectedTrip, project_id, token)
          .then(setStopsAndTimes)
          .catch(console.error);
      }
      navigate(`/map/${project_id}`, {
        replace: true,
        state: { selectedRoute, selectedTrip },
      });
    }
  }, [
    location.state,
    activeTab,
    selectedRoute,
    selectedTrip,
    project_id,
    token,
    navigate,
    setRoutes,
    setTrips,
    setStopsAndTimes,
  ]);

  // Trip seçimi
  const handleTripSelect = useCallback(
    async (tripId) => {
      setSelectedTrip(tripId);
      setCalendar(null);
      try {
        const stopsAndTimesData = await fetchStopsAndStopTimesByTripId(
          tripId,
          project_id,
          token
        );
        setStopsAndTimes(stopsAndTimesData);

        const selectedTripData = trips.find((trip) => trip.trip_id === tripId);
        if (selectedTripData?.service_id) {
          const calendarData = await fetchCalendarByServiceId(
            selectedTripData.service_id,
            token
          );
          console.log("Fetched calendar data:", calendarData);
          setCalendar(calendarData || null);
        } else {
          console.log("No service_id found for trip:", selectedTripData);
        }

        if (stopsAndTimesData.length > 0) {
          const validStops = stopsAndTimesData.filter(
            (stop) =>
              stop.stop_lat &&
              stop.stop_lon &&
              !isNaN(parseFloat(stop.stop_lat)) &&
              !isNaN(parseFloat(stop.stop_lon))
          );
          if (validStops.length > 0) {
            const centerLat =
              validStops.reduce(
                (sum, stop) => sum + parseFloat(stop.stop_lat),
                0
              ) / validStops.length;
            const centerLon =
              validStops.reduce(
                (sum, stop) => sum + parseFloat(stop.stop_lon),
                0
              ) / validStops.length;
            setMapCenter([centerLat, centerLon]);
            setZoom(14);
          }
        }
      } catch (error) {
        console.error("Error in handleTripSelect:", error);
        setStopsAndTimes([]);
      }
    },
    [
      project_id,
      token,
      trips,
      setSelectedTrip,
      setStopsAndTimes,
      setCalendar,
      setMapCenter,
      setZoom,
    ]
  );

  // Rota seçimi
  const handleRouteSelect = useCallback(
    async (routeId) => {
      setSelectedRoute(routeId);
      setSelectedTrip(null);
      setActiveTab("trips");
      try {
        const tripsData = await fetchTripsByRouteId(routeId, token);
        setTrips(Array.isArray(tripsData) ? tripsData : []);
      } catch (error) {
        console.error("Error fetching trips:", error);
        setTrips([]);
      }
    },
    [token, setSelectedRoute, setSelectedTrip, setTrips, setActiveTab]
  );

  // Export işlemi
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/export/${project_id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.headers
          .get("content-disposition")
          .split("filename=")[1]
          .replaceAll('"', "");
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Export failed:", await response.json().message);
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Tarih formatını düzenleme fonksiyonu (ISO 8601 desteği)
  const formatDate = (dateString) => {
    if (!dateString) return "Belirtilmemiş";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Geçersiz tarih");
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Hatalı Tarih";
    }
  };

  // Gün isimlerini Türkçe yapma ve esnek format desteği
  const formatDays = (calendar) => {
    if (!calendar) return "Yok";
    const dayMap = {
      monday: "Pazartesi",
      tuesday: "Salı",
      wednesday: "Çarşamba",
      thursday: "Perşembe",
      friday: "Cuma",
      saturday: "Cumartesi",
      sunday: "Pazar",
    };
    const activeDays = Object.keys(calendar)
      .filter((k) =>
        [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ].includes(k)
      )
      .filter((k) => {
        const value = calendar[k];
        return value === "1" || value === 1 || value === true;
      })
      .map((k) => dayMap[k]);
    return activeDays.length > 0 ? activeDays.join(", ") : "Yok";
  };

  // CRUD İşlemleri (Swal ile)
  const handleDeleteRoute = async (routeId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu rotayı silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteRouteById(routeId, project_id, token);
        setRoutes((prev) => prev.filter((route) => route.route_id !== routeId));
        if (selectedRoute === routeId) setSelectedRoute(null);
        Swal.fire("Silindi!", "Rota başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting route:", error);
        Swal.fire("Hata!", "Rota silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleDeleteTrip = async (tripId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu tripi silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteTripById(tripId, token);
        setTrips((prev) => prev.filter((trip) => trip.trip_id !== tripId));
        if (selectedTrip === tripId) setSelectedTrip(null);
        Swal.fire("Silindi!", "Trip başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting trip:", error);
        Swal.fire("Hata!", "Trip silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleDeleteStop = async (tripId, stopId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu durağı silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteStopTimeById(tripId, stopId, project_id, token);
        setStopsAndTimes((prev) =>
          prev.filter((stop) => stop.stop_id !== stopId)
        );
        Swal.fire("Silindi!", "Durak başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting stop time:", error);
        Swal.fire("Hata!", "Durak silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleDeleteAgency = async (agencyId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ajansı silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteAgencyById(agencyId, project_id, token);
        setAgencies((prev) =>
          prev.filter((agency) => agency.agency_id !== agencyId)
        );
        Swal.fire("Silindi!", "Ajans başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting agency:", error);
        Swal.fire("Hata!", "Ajans silinirken bir hata oluştu.", "error");
      }
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <button
        className={`toggle-sidebar-btn ${!isSidebarOpen ? "show" : ""}`}
        onClick={toggleSidebar}
      >
        ☰
      </button>
      <div
        className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}
        tabIndex={0}
      >
        <div className="sidebar-header mb-3">
          <h2 className="sidebar-title">Proje Kontrol Paneli</h2>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={toggleSidebar}
          >
            ✕
          </button>
        </div>

        {isSidebarOpen && (
          <div className="d-flex flex-column h-100">
            <button
              className="btn btn-primary mb-3 w-100"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" />
                  Exporting...
                </>
              ) : (
                "Projeyi Dışa Aktar"
              )}
            </button>

            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "routes" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("routes")}
                >
                  Rotalar
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "trips" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("trips")}
                  disabled={!selectedRoute}
                >
                  Tripler
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "stops" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("stops")}
                  disabled={!selectedTrip}
                >
                  Duraklar
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "calendar" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("calendar")}
                  disabled={!calendar}
                >
                  Takvim
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${
                    activeTab === "agencies" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("agencies")}
                >
                  Ajanslar
                </button>
              </li>
            </ul>

            <div
              className="tab-content flex-grow-1"
              style={{ overflowY: "auto" }}
            >
              {activeTab === "routes" && (
                <div className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Rotalar</h5>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => navigate(`/add-route/${project_id}`)}
                    >
                      Yeni
                    </button>
                  </div>
                  <div>
                    {routes.length > 0 ? (
                      routes.map((route) => (
                        <div key={route.route_id} className="card mb-2">
                          <div className="card-body d-flex justify-content-between align-items-center p-2">
                            <span
                              className="text-truncate"
                              style={{ maxWidth: "60%" }}
                              title={route.route_long_name}
                              onClick={() => handleRouteSelect(route.route_id)}
                            >
                              {route.route_long_name || route.route_id}
                            </span>
                            <div>
                              <button
                                className="btn btn-outline-primary btn-sm me-1"
                                onClick={() =>
                                  navigate(
                                    `/edit-route/${project_id}/${route.route_id}`
                                  )
                                }
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  handleDeleteRoute(route.route_id)
                                }
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Henüz rota bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "trips" && selectedRoute && (
                <div className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Tripler</h5>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        navigate(`/add-trip/${project_id}`, {
                          state: { selectedRoute },
                        })
                      }
                    >
                      Yeni
                    </button>
                  </div>
                  <div>
                    {trips.length > 0 ? (
                      trips.map((trip) => (
                        <div key={trip.trip_id} className="card mb-2">
                          <div className="card-body d-flex justify-content-between align-items-center p-2">
                            <span
                              className="text-truncate"
                              style={{ maxWidth: "60%" }}
                              title={trip.trip_headsign}
                              onClick={() => handleTripSelect(trip.trip_id)}
                            >
                              {trip.trip_headsign || trip.trip_id}
                            </span>
                            <div>
                              <button
                                className="btn btn-outline-primary btn-sm me-1"
                                onClick={() =>
                                  navigate(
                                    `/edit-trip/${project_id}/${trip.trip_id}`,
                                    { state: { selectedRoute } }
                                  )
                                }
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
                      ))
                    ) : (
                      <p>Henüz trip bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "stops" && selectedTrip && (
                <div className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Duraklar</h5>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        navigate(
                          `/add-stop-time/${project_id}/${selectedTrip}`,
                          { state: { selectedRoute, selectedTrip } }
                        )
                      }
                    >
                      Yeni
                    </button>
                  </div>
                  <div>
                    {stopsAndTimes.length > 0 ? (
                      stopsAndTimes.map((stop) => (
                        <div key={stop.stop_id} className="card mb-2">
                          <div className="card-body d-flex justify-content-between align-items-center p-2">
                            <span
                              className="text-truncate"
                              style={{ maxWidth: "60%" }}
                              title={stop.stop_name}
                              onClick={() => {
                                if (stop.stop_lat && stop.stop_lon) {
                                  setMapCenter([
                                    parseFloat(stop.stop_lat),
                                    parseFloat(stop.stop_lon),
                                  ]);
                                  setZoom(16);
                                }
                              }}
                            >
                              {stop.stop_name || stop.stop_id}
                            </span>
                            <div>
                              <button
                                className="btn btn-outline-primary btn-sm me-1"
                                onClick={() =>
                                  navigate(
                                    `/edit-stop-time/${project_id}/${selectedTrip}/${stop.stop_id}`,
                                    { state: { selectedRoute, selectedTrip } }
                                  )
                                }
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  handleDeleteStop(selectedTrip, stop.stop_id)
                                }
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Henüz durak bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              )}
              {activeTab === "calendar" && (
                <div className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Takvim</h5>
                    <div>
                      <button
                        className="btn btn-success btn-sm me-1"
                        onClick={() => setShowCalendarAdd(true)}
                      >
                        Yeni
                      </button>
                      {calendar && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowCalendarEdit(true)}
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  </div>
                  {showCalendarAdd && (
                    <CalendarAdd
                      token={token}
                      project_id={project_id}
                      setCalendar={setCalendar}
                      onClose={() => setShowCalendarAdd(false)}
                    />
                  )}
                  {showCalendarEdit && calendar && (
                    <CalendarEdit
                      token={token}
                      project_id={project_id}
                      calendar={calendar}
                      setCalendar={setCalendar}
                      onClose={() => setShowCalendarEdit(false)}
                    />
                  )}
                  {calendar ? (
                    <>
                      <div className="mb-2">
                        <strong>Aktif Günler:</strong> {formatDays(calendar)}
                      </div>
                      <div className="mb-2">
                        <strong>Başlangıç Tarihi:</strong>{" "}
                        {formatDate(calendar.start_date)}
                      </div>
                      <div>
                        <strong>Bitiş Tarihi:</strong>{" "}
                        {formatDate(calendar.end_date)}
                      </div>
                    </>
                  ) : (
                    <p>Seçili trip için takvim bilgisi bulunmamaktadır.</p>
                  )}
                </div>
              )}
              {activeTab === "agencies" && (
                <div className="p-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Ajanslar</h5>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setShowAgencyAdd(true)}
                    >
                      Yeni
                    </button>
                  </div>
                  {showAgencyAdd && (
                    <AgencyAdd
                      token={token}
                      project_id={project_id}
                      setAgencies={setAgencies}
                      onClose={() => setShowAgencyAdd(false)}
                    />
                  )}
                  {showAgencyEdit && (
                    <AgencyEdit
                      token={token}
                      project_id={project_id}
                      agency={showAgencyEdit}
                      setAgencies={setAgencies}
                      onClose={() => setShowAgencyEdit(null)}
                    />
                  )}
                  <div>
                    {agencies.length > 0 ? (
                      agencies.map((agency) => (
                        <div key={agency.agency_id} className="card mb-2">
                          <div className="card-body d-flex justify-content-between align-items-center p-2">
                            <span
                              className="text-truncate"
                              style={{ maxWidth: "60%" }}
                              title={agency.agency_name}
                            >
                              {agency.agency_name}
                            </span>
                            <div>
                              <button
                                className="btn btn-outline-primary btn-sm me-1"
                                onClick={() => setShowAgencyEdit(agency)}
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  handleDeleteAgency(agency.agency_id)
                                }
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>Henüz ajans bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

Sidebar.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  routes: PropTypes.array.isRequired,
  setRoutes: PropTypes.func.isRequired,
  selectedRoute: PropTypes.string,
  setSelectedRoute: PropTypes.func.isRequired,
  trips: PropTypes.array.isRequired,
  setTrips: PropTypes.func.isRequired,
  selectedTrip: PropTypes.string,
  setSelectedTrip: PropTypes.func.isRequired,
  stopsAndTimes: PropTypes.array.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  calendar: PropTypes.object,
  setCalendar: PropTypes.func.isRequired,
  mapCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
  setMapCenter: PropTypes.func.isRequired,
  zoom: PropTypes.number.isRequired,
  setZoom: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
};

export default Sidebar;
