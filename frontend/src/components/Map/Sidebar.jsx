import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import RouteList from "./RouteList";
import TripList from "./TripList";
import StopList from "./StopList";
import CalendarInfo from "./CalendarInfo";
import { fetchRoutesByProjectId } from "../../api/routeApi";
import { fetchTripsByRouteId } from "../../api/tripApi";
import { fetchStopsAndStopTimesByTripId } from "../../api/stopTimeApi";
import { fetchCalendarByServiceId } from "../../api/calendarApi";

const Sidebar = ({
  token,
  project_id,
  routes,
  setRoutes,
  filteredRoutes,
  setFilteredRoutes,
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
  navigate,
  location,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("routes");
  const dropdownRef = useRef(null);

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

  const handleRouteSelect = useCallback(
    async (routeId, prevTrip = null) => {
      setSelectedRoute(routeId);
      setSearchTerm("");
      setIsRouteDropdownOpen(false);
      setSelectedTrip(null); // Trip sıfırlanıyor
      setActiveTab("trips"); // Tripler sekmesine geç

      try {
        const tripsData = await fetchTripsByRouteId(routeId, token);
        setTrips(Array.isArray(tripsData) ? tripsData : []);
        // Otomatik trip seçimi ve handleTripSelect çağrısı kaldırıldı
        if (prevTrip && tripsData.some((trip) => trip.trip_id === prevTrip)) {
          handleTripSelect(prevTrip); // Sadece önceki trip varsa seç
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
        setTrips([]);
      }
    },
    [
      token,
      handleTripSelect,
      setSelectedRoute,
      setSearchTerm,
      setIsRouteDropdownOpen,
      setSelectedTrip,
      setTrips,
      setActiveTab,
    ]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await fetchRoutesByProjectId(project_id, token);
        const routeList = Array.isArray(data) ? data : [];
        setRoutes(routeList);
        setFilteredRoutes(routeList);

        const { selectedRoute: prevRoute, selectedTrip: prevTrip } =
          location.state || {};
        if (prevRoute && !selectedRoute) {
          setSelectedRoute(prevRoute);
          await handleRouteSelect(prevRoute, prevTrip);
        } else if (prevTrip && !selectedTrip) {
          setSelectedTrip(prevTrip);
          await handleTripSelect(prevTrip);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutes([]);
        setFilteredRoutes([]);
      }
    };
    if (token && project_id) {
      loadInitialData();
    }
  }, [
    token,
    project_id,
    location.state,
    selectedRoute,
    selectedTrip,
    handleRouteSelect,
    handleTripSelect,
    setRoutes,
    setFilteredRoutes,
    setSelectedRoute,
    setSelectedTrip,
  ]);

  useEffect(() => {
    const { refresh } = location.state || {};
    if (refresh && selectedRoute) {
      handleRouteSelect(selectedRoute, selectedTrip);
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
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRouteDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsRouteDropdownOpen, setSearchTerm]);

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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/io/export/${project_id}`,
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
        const data = await response.json();
        console.error("Export failed:", data.message);
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
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
        onKeyDown={handleKeyDown}
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
            </ul>

            <div
              className="tab-content flex-grow-1"
              style={{ overflowY: "auto" }}
            >
              {activeTab === "routes" && (
                <RouteList
                  token={token}
                  project_id={project_id}
                  routes={routes}
                  setRoutes={setRoutes}
                  filteredRoutes={filteredRoutes}
                  setFilteredRoutes={setFilteredRoutes}
                  selectedRoute={selectedRoute}
                  setSelectedRoute={setSelectedRoute}
                  setTrips={setTrips}
                  setStopsAndTimes={setStopsAndTimes}
                  setMapCenter={setMapCenter}
                  setZoom={setZoom}
                  navigate={navigate}
                  dropdownRef={dropdownRef}
                  isRouteDropdownOpen={isRouteDropdownOpen}
                  setIsRouteDropdownOpen={setIsRouteDropdownOpen}
                  searchTerm={searchTerm}
                  setActiveTab={setActiveTab}
                  handleRouteSelect={handleRouteSelect}
                />
              )}
              {activeTab === "trips" && selectedRoute && (
                <TripList
                  token={token}
                  project_id={project_id}
                  trips={trips}
                  setTrips={setTrips}
                  selectedTrip={selectedTrip}
                  setSelectedTrip={setSelectedTrip}
                  setStopsAndTimes={setStopsAndTimes}
                  setCalendar={setCalendar}
                  setMapCenter={setMapCenter}
                  setZoom={setZoom}
                  navigate={navigate}
                  handleTripSelect={handleTripSelect}
                />
              )}
              {activeTab === "stops" && selectedTrip && (
                <StopList
                  token={token}
                  project_id={project_id}
                  stopsAndTimes={stopsAndTimes}
                  setStopsAndTimes={setStopsAndTimes}
                  selectedTrip={selectedTrip}
                  navigate={navigate}
                />
              )}
              {activeTab === "calendar" && calendar && (
                <CalendarInfo calendar={calendar} />
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
  filteredRoutes: PropTypes.array.isRequired,
  setFilteredRoutes: PropTypes.func.isRequired,
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
  navigate: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
};

export default Sidebar;
