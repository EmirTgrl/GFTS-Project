import { useEffect, useState } from "react";
import {
  fetchRoutes,
  fetchStopsByRoute,
  fetchBusesByRoute,
  fetchCalendarByRoute,
  fetchTripsByRoute,
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
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [trips, setTrips] = useState([]);
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const data = await fetchRoutes();
        setRoutes(data);
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    };
    loadRoutes();
  }, []);

  const handleRouteSelect = async (routeId) => {
    setSelectedRoute(routeId);
    setStops([]);
    setBuses([]);
    setCalendar(null);
    setTrips([]);

    try {
      const stopsData = await fetchStopsByRoute(routeId);
      const uniqueStops = stopsData.filter(
        (stop, index, self) =>
          index === self.findIndex((s) => s.stop_id === stop.stop_id)
      );
      setStops(uniqueStops);

      const busesData = await fetchBusesByRoute(routeId);
      setBuses(busesData);

      const calendarData = await fetchCalendarByRoute(routeId);
      setCalendar(calendarData);

      const tripsData = await fetchTripsByRoute(routeId);
      setTrips(tripsData);

      if (uniqueStops.length > 0) {
        const centerLat =
          uniqueStops.reduce(
            (sum, stop) => sum + parseFloat(stop.stop_lat),
            0
          ) / uniqueStops.length;
        const centerLon =
          uniqueStops.reduce(
            (sum, stop) => sum + parseFloat(stop.stop_lon),
            0
          ) / uniqueStops.length;
        console.log("Center Lat:", centerLat, "Center Lon:", centerLon);
        setMapCenter([centerLat, centerLon]);
        setZoom(14);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="map-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Rota Seç</h2>
        <select
          onChange={(e) => handleRouteSelect(e.target.value)}
          className="route-select"
          value={selectedRoute || ""}
        >
          <option value="">Rota Seç</option>
          {routes.map((route) => (
            <option key={route.route_id} value={route.route_id}>
              {route.route_long_name}
            </option>
          ))}
        </select>

        {calendar && (
          <div className="calendar-info">
            <h3>Çalışma Günleri</h3>
            {calendar.length > 0 ? (
              <p>
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
                        if (c.monday) days.push("Pazartesi");
                        if (c.tuesday) days.push("Salı");
                        if (c.wednesday) days.push("Çarşamba");
                        if (c.thursday) days.push("Perşembe");
                        if (c.friday) days.push("Cuma");
                        if (c.saturday) days.push("Cumartesi");
                        if (c.sunday) days.push("Pazar");
                        return days.join(", ");
                      })
                      .join(" / ")}
              </p>
            ) : (
              <p>Çalışma günleri bilgisi bulunamadı.</p>
            )}
          </div>
        )}

        {stops.length > 0 && (
          <div className="stops-list">
            <h3>Duraklar</h3>
            <ul>
              {stops.map((stop, index) => (
                <li key={stop.stop_id}>
                  <strong>
                    {index + 1}. {stop.stop_name}
                  </strong>
                  <br />
                  {buses
                    .filter((bus) => bus.stop_id === stop.stop_id)
                    .map((bus) => (
                      <div key={bus.trip_id}>
                        <p>
                          <strong>Otobüs {bus.trip_id}</strong>
                        </p>
                        <p>Varış: {bus.arrival_time}</p>
                        <p>Kalkış: {bus.departure_time}</p>
                      </div>
                    ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {buses.length > 0 && (
          <div className="buses-list">
            <h3>Geçen Otobüsler</h3>
            <ul>
              {buses.map((bus) => (
                <li key={`${bus.trip_id}-${bus.stop_id}`}>
                  <strong>Otobüs {bus.trip_id}</strong> - {bus.arrival_time} →{" "}
                  {bus.departure_time}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Harita */}
      <MapContainer center={mapCenter} zoom={zoom} id="map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={mapCenter} zoom={zoom} />

        {stops.map((stop) => (
          <Marker
            key={`${stop.stop_id}-${selectedRoute}`}
            position={[stop.stop_lat, stop.stop_lon]}
          >
            <Popup>
              {stop.stop_name}
              <br />
              {buses
                .filter((bus) => bus.stop_id === stop.stop_id)
                .map((bus) => (
                  <div key={bus.trip_id}>
                    <p>
                      <strong>Otobüs {bus.trip_id}</strong>
                    </p>
                    <p>Varış: {bus.arrival_time}</p>
                    <p>Kalkış: {bus.departure_time}</p>
                  </div>
                ))}
            </Popup>
          </Marker>
        ))}

        {stops.length > 1 && (
          <Polyline
            positions={stops.map((stop) => [stop.stop_lat, stop.stop_lon])}
            color="blue"
            weight={5}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPage;
