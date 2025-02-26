import { useEffect, useState, useContext } from "react";
import {
  fetchRoutes,
  fetchStopsByRoute,
  fetchBusesByRoute,
  fetchCalendarByRoute,
  fetchTripsByRoute,
  fetchRoutesByProjectId,
  fetchTripsByRouteId
} from "../api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "../styles/Map.css";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import L from "leaflet";
import { useParams } from "react-router-dom";

// Özel durak ikonu
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
    try {
      map.setView(center, zoom);
    } catch (error) {
      console.error("MapUpdater error:", error);
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
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [calendar, setCalendar] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [trips, setTrips] = useState([]);
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [zoom, setZoom] = useState(13);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {project_id} = useParams();

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const data = await fetchRoutesByProjectId(project_id, token);
        setRoutes(data);
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    };
    loadRoutes();
  }, [token]);

  const handleRouteSelect = async (routeId) => {
    setSelectedRoute(routeId);
    setTrips([]);
    setStops([]);
    setBuses([]);
    setCalendar(null);

      try {
    //   const [stopsData, busesData, calendarData, tripsData] = await Promise.all(
    //     [
    //       fetchTripsByRouteId(routeId,token),
    //       fetchStopsByRoute(routeId, token),
    //       fetchBusesByRoute(routeId, token),
    //       fetchCalendarByRoute(routeId, token),
    //     ]
    //   );

      // const uniqueStops = stopsData.filter(
      //   (stop, index, self) =>
      //     index === self.findIndex((s) => s.stop_id === stop.stop_id)
      // );
      // setStops(uniqueStops);
      // setBuses(busesData);
      // setCalendar(calendarData);
      // setTrips(tripsData);

      const tripsData = await fetchTripsByRouteId(routeId,token);
      setTrips(tripsData);

      // if (uniqueStops.length > 0) {
      //   const centerLat =
      //     uniqueStops.reduce(
      //       (sum, stop) => sum + parseFloat(stop.stop_lat),
      //       0
      //     ) / uniqueStops.length;
      //   const centerLon =
      //     uniqueStops.reduce(
      //       (sum, stop) => sum + parseFloat(stop.stop_lon),
      //       0
      //     ) / uniqueStops.length;
      //   setMapCenter([centerLat, centerLon]);
      //   setZoom(14);
      // }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleTripSelect = async (trip_id) => {
    setSelectedTrip(trip_id);
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="map-container">
      <button
        className={`toggle-sidebar-btn ${!isSidebarOpen ? "show" : ""}`}
        onClick={toggleSidebar}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Rota Seçimi</h2>
          <button className="toggle-btn" onClick={toggleSidebar}>
            ✕
          </button>
        </div>
        {isSidebarOpen && (
          <>
            <select
              onChange={(e) => handleRouteSelect(e.target.value)}
              className="route-select"
              value={selectedRoute || ""}
            >
              <option value="">Rota Seçin</option>
              {routes.map((route) => (
                <option key={route.route_id} value={route.route_id}>
                  {route.route_long_name}
                </option>
              ))}
            </select>

            <select
              onChange={(f) => handleTripSelect(f.target.value)}
              className={`route-select ${!selectedRoute ? 'inactive-select' : ''}`}
              value={selectedTrip || ""}
              disabled={!selectedRoute}
            >
              <option value="">Trip Seçin</option>
              {trips.map((trip) => (
                <option key={trip.trip_id} value={trip.trip_id}>
                  {trip.trip_id +  " - "  + trip.trip_headsign}
                </option>
              ))}
            </select>
            

          


            {/* {calendar && (
              <div className="sidebar-section">
                <h3 className="section-title">Çalışma Günleri</h3>
                <div className="section-card">
                  {calendar.length > 0 ? (
                    <p className="section-text">
                      {calendar.some(
                        (c) =>
                          c.monday &&
                          c.tuesday &&
                          c.wednesday &&
                          c.thursday &&
                          c.friday &&
                          c.saturday &&
                          c.sunday
                      )
                        ? "Her gün çalışıyor"
                        : calendar
                            .map((c) => {
                              let days = [];
                              if (c.monday) days.push("Pzt");
                              if (c.tuesday) days.push("Sal");
                              if (c.wednesday) days.push("Çar");
                              if (c.thursday) days.push("Per");
                              if (c.friday) days.push("Cum");
                              if (c.saturday) days.push("Cmt");
                              if (c.sunday) days.push("Paz");
                              return days.join(", ");
                            })
                            .join(" / ")}
                    </p>
                  ) : (
                    <p className="section-text">Çalışma günleri bilgisi yok.</p>
                  )}
                </div>
              </div>
            )}

            {stops.length > 0 && (
              <div className="sidebar-section">
                <h3 className="section-title">Duraklar</h3>
                <div className="scrollable-section">
                  {stops.map((stop, index) => (
                    <div key={stop.stop_id} className="section-card">
                      <div className="card-header">
                        <h4 className="card-title">
                          {index + 1}. {stop.stop_name}
                        </h4>
                        <div className="card-actions">
                          <button className="action-btn edit-btn">✏️</button>
                          <button className="action-btn delete-btn">🗑️</button>
                        </div>
                      </div>
                      {buses
                        .filter((bus) => bus.stop_id === stop.stop_id)
                        .map((bus) => (
                          <div key={bus.trip_id} className="bus-info">
                            <p className="bus-title">
                              <span className="bus-icon">🚌</span> Otobüs{" "}
                              {bus.trip_id}
                            </p>
                            <p className="bus-time">
                              Varış: {bus.arrival_time} <br />
                              Kalkış: {bus.departure_time}
                            </p>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </>
        )}
      </div>

      <MapContainer center={mapCenter} zoom={zoom} id="map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={mapCenter} zoom={zoom} />

        {stops.map((stop) => (
          <Marker
            key={`${stop.stop_id}-${selectedRoute}`}
            position={[stop.stop_lat, stop.stop_lon]}
            icon={stopIcon}
          ></Marker>
        ))}

        {stops.length > 1 && (
          <Polyline
            positions={stops.map((stop) => [stop.stop_lat, stop.stop_lon])}
            color="#007bff"
            weight={5}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
