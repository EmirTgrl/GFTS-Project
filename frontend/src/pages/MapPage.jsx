import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { fetchRoutesByProjectId } from "../api/routeApi";
import { fetchTripsByRouteId, deleteTripById } from "../api/tripApi";
import {
  fetchStopsAndStopTimesByTripId,
  deleteStopTimeById,
} from "../api/stopTimeApi";
import { fetchCalendarByServiceId } from "../api/calendarApi";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "../styles/Map.css";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import L from "leaflet";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const stopIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      center[0] &&
      center[1] &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
};

const MapPage = () => {
  const { token } = useContext(AuthContext);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [stopsAndTimes, setStopsAndTimes] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [zoom, setZoom] = useState(13);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const { project_id } = useParams();
  const [exportLoading, setExportLoading] = useState(false); // Loading state for export


  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/export/${project_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        const data = await response.json();
        console.error("Export failed:", data.message);
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error("Export error:", error);
      // Optionally show an error message to the user
    } finally {
      setExportLoading(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const data = await fetchRoutesByProjectId(project_id, token);
        const routeList = Array.isArray(data) ? data : [];
        setRoutes(routeList);
        setFilteredRoutes(routeList);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutes([]);
        setFilteredRoutes([]);
      }
    };
    if (token && project_id) {
      loadRoutes();
    }
  }, [token, project_id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRouteDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        if (selectedTripData && selectedTripData.service_id) {
          const calendarData = await fetchCalendarByServiceId(
            selectedTripData.service_id,
            token
          );
          setCalendar(calendarData || null);
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
        console.error("Error fetching trip details:", error);
      }
    },
    [project_id, token, trips]
  );

  const handleRouteSelect = useCallback(
    async (routeId) => {
      setSelectedRoute(routeId);
      setSearchTerm("");
      setIsRouteDropdownOpen(false);
      setSelectedTrip(null);
      setTrips([]);
      setStopsAndTimes([]);
      setCalendar(null);

      try {
        const tripsData = await fetchTripsByRouteId(routeId, token);
        setTrips(Array.isArray(tripsData) ? tripsData : []);
      } catch (error) {
        console.error("Error fetching trips:", error);
        setTrips([]);
      }
    },
    [token]
  );

  useEffect(() => {
    const { selectedRoute: prevRoute, selectedTrip: prevTrip } =
      location.state || {};
    if (prevRoute && !selectedRoute) {
      handleRouteSelect(prevRoute);
    }
    if (prevTrip && !selectedTrip) {
      handleTripSelect(prevTrip);
    } else if (location.state?.refresh && selectedTrip) {
      handleTripSelect(selectedTrip);
      navigate(`/map/${project_id}`, {
        replace: true,
        state: { selectedRoute, selectedTrip },
      });
    }
  }, [
    location.state,
    selectedRoute,
    selectedTrip,
    project_id,
    navigate,
    handleRouteSelect,
    handleTripSelect,
  ]);

  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (/^[a-zA-Z]$/.test(key)) {
      e.preventDefault();
      setSearchTerm((prev) => prev + key);
      setIsRouteDropdownOpen(true);
    } else if (e.key === "Backspace") {
      setSearchTerm((prev) => prev.slice(0, -1));
      setIsRouteDropdownOpen(true);
    } else if (e.key === "Enter" && filteredRoutes.length > 0) {
      handleRouteSelect(filteredRoutes[0].route_id);
    } else if (e.key === "Escape") {
      setIsRouteDropdownOpen(false);
      setSearchTerm("");
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = routes.filter((route) => {
        const routeName =
          route.route_long_name || route.route_short_name || route.route_id;
        return routeName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(routes);
    }
  }, [searchTerm, routes]);

  const toggleRouteDropdown = () => {
    setIsRouteDropdownOpen((prev) => !prev);
  };

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
        setSelectedTrip(null);
        setStopsAndTimes([]);
        Swal.fire("Silindi!", "Trip başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting trip:", error);
        Swal.fire("Hata!", "Trip silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleEditStopTime = (tripId, stopId) => {
    navigate(`/edit-stop-time/${project_id}/${tripId}/${stopId}`, {
      state: { selectedRoute, selectedTrip },
    });
  };

  const handleAddStopTime = () => {
    navigate(`/add-stop-time/${project_id}/${selectedTrip}`, {
      state: { selectedRoute, selectedTrip },
    });
  };

  const handleEditTrip = (tripId) => {
    navigate(`/edit-trip/${project_id}/${tripId}`, {
      state: { selectedRoute, selectedTrip },
    });
  };

  const handleAddTrip = () => {
    navigate(`/add-trip/${project_id}`, {
      state: { selectedRoute, selectedTrip },
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="map-container" onKeyDown={handleKeyDown} tabIndex={0}>
      <button
        className={`toggle-sidebar-btn ${!isSidebarOpen ? "show" : ""}`}
        onClick={toggleSidebar}
      >
        ☰
      </button>

      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Rota Seçimi</h2>
          <button className="toggle-btn" onClick={toggleSidebar}>
            ✕
          </button>
        </div>
        {isSidebarOpen && (
          <>
          <button
                    className="export-button btn btn-primary m-3"
                    onClick={handleExport}
                    disabled={exportLoading}
                    >
                    {exportLoading ? (
                        <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Exporting...
                        </>
                    ) : (
                        "Export Project"
                    )}
                </button>
            <div className="route-dropdown" ref={dropdownRef}>
              <div className="route-select" onClick={toggleRouteDropdown}>
                {selectedRoute
                  ? routes.find((r) => r.route_id === selectedRoute)
                      ?.route_long_name ||
                    routes.find((r) => r.route_id === selectedRoute)
                      ?.route_short_name ||
                    selectedRoute
                  : "Rota Seçin"}
              </div>
              {isRouteDropdownOpen && filteredRoutes.length > 0 && (
                <ul className="route-options">
                  {filteredRoutes.map((route) => (
                    <li
                      key={route.route_id}
                      onClick={() => handleRouteSelect(route.route_id)}
                      className="route-option"
                    >
                      {route.route_long_name ||
                        route.route_short_name ||
                        route.route_id}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedRoute && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="section-title">Tripler</h3>
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleAddTrip}
                  disabled={!selectedRoute}
                >
                  Yeni Trip Ekle
                </button>
              </div>
            )}
            <select
              onChange={(e) => handleTripSelect(e.target.value)}
              className={`route-select ${
                !selectedRoute ? "inactive-select" : ""
              }`}
              value={selectedTrip || ""}
              disabled={!selectedRoute || trips.length === 0}
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

            {trips.length > 0 && (
              <div className="scrollable-section">
                {trips.map((trip) => (
                  <div key={trip.trip_id} className="section-card">
                    <div className="card-header">
                      <h4 className="card-title">
                        {trip.trip_headsign || trip.trip_id}
                      </h4>
                      <div className="card-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditTrip(trip.trip_id)}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteTrip(trip.trip_id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {calendar && (
              <div className="sidebar-section">
                <h3 className="section-title">Çalışma Günleri</h3>
                <div className="section-card">
                  <p className="section-text">
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

            )}

            {stopsAndTimes.length > 0 && (
              <div className="sidebar-section">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="section-title">Duraklar</h3>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleAddStopTime}
                    disabled={!selectedTrip}
                  >
                    Yeni Durak Ekle
                  </button>
                </div>
                <div className="scrollable-section">
                  {stopsAndTimes.map((stopAndTime) => (
                    <div
                      key={stopAndTime.stop_id + stopAndTime.stop_sequence}
                      className="section-card"
                    >
                      <div className="card-header">
                        <h4 className="card-title">
                          {stopAndTime
                            ? stopAndTime.stop_name
                            : "Bilinmeyen Durak"}
                        </h4>
                        <div className="card-actions">
                          <button
                            className="action-btn edit-btn"
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
                            className="action-btn delete-btn"
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
                      <div className="bus-info">
                        <p className="bus-time">
                          Varış: {stopAndTime.arrival_time || "Bilinmiyor"}{" "}
                          <br />
                          Kalkış: {stopAndTime.departure_time || "Bilinmiyor"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <MapContainer center={mapCenter} zoom={zoom} id="map" zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={mapCenter} zoom={zoom} />

        {stopsAndTimes.length > 0 &&
          stopsAndTimes
            .sort((a, b) => a.stop_sequence - b.stop_sequence)
            .map((stopTime) => {
              if (stopTime && stopTime.stop_lat && stopTime.stop_lon) {
                return (
                  <Marker
                    key={`${stopTime.stop_id}-${selectedTrip}`}
                    position={[
                      parseFloat(stopTime.stop_lat),
                      parseFloat(stopTime.stop_lon),
                    ]}
                    icon={stopIcon}
                  >
                    <Popup>
                      {stopTime.stop_sequence}.{" "}
                      {stopTime.stop_name || "Bilinmeyen Durak"} <br />
                      Varış: {stopTime.arrival_time || "Bilinmiyor"} <br />
                      Kalkış: {stopTime.departure_time || "Bilinmiyor"}
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}

        {stopsAndTimes.length > 1 && (
          <Polyline
            positions={stopsAndTimes
              .sort((a, b) => a.stop_sequence - b.stop_sequence)
              .map((stopTime) =>
                stopTime && stopTime.stop_lat && stopTime.stop_lon
                  ? [
                      parseFloat(stopTime.stop_lat),
                      parseFloat(stopTime.stop_lon),
                    ]
                  : null
              )
              .filter((pos) => pos !== null)}
            color="#007bff"
            weight={5}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
