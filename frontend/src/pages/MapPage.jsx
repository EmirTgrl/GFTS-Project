import { useEffect, useState, useContext, useRef } from "react";
import {
  fetchRoutesByProjectId,
  fetchTripsByRouteId,
  fetchCalendarByServiceId,
  fetchStopsAndStopTimesByTripId,
} from "../api";
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
import { useParams } from "react-router-dom";

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

  const handleRouteSelect = async (routeId) => {
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
  };

  const toggleRouteDropdown = () => {
    setIsRouteDropdownOpen((prev) => !prev);
  };

  const handleTripSelect = async (tripId) => {
    setSelectedTrip(tripId);
    setCalendar(null);

    try {
      const stopsAndTimesData = await fetchStopsAndStopTimesByTripId(
        tripId,
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
                <h3 className="section-title">Duraklar</h3>
                <div className="scrollable-section">
                  {stopsAndTimes.map((stopAndTime) => {
                    return (
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
                            <button className="action-btn edit-btn">
                              ✏️
                            </button>
                            <button className="action-btn delete-btn">
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
                    );
                  })}
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
              .map((stopTime) => {
                return stopTime && stopTime.stop_lat && stopTime.stop_lon
                  ? [parseFloat(stopTime.stop_lat), parseFloat(stopTime.stop_lon)]
                  : null;
              })
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
