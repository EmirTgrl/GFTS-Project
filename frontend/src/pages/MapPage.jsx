import { useEffect, useState } from "react";
import {
  fetchRoutes,
  fetchStopsByRoute,
  fetchRouteTimes,
  fetchBusesByRoute,
  fetchCalendarByRoute,
  fetchTripsByRoute,
} from "../api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "../styles/Map.css";
import PropTypes from "prop-types";

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
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
  // eslint-disable-next-line no-unused-vars
  const [stopTimes, setStopTimes] = useState([]);
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
    try {
      const stopsData = await fetchStopsByRoute(routeId);
      setStops(stopsData);
      const timesData = await fetchRouteTimes(routeId);
      setStopTimes(timesData);
      const busesData = await fetchBusesByRoute(routeId);
      setBuses(busesData);
      const calendarData = await fetchCalendarByRoute(routeId);
      setCalendar(calendarData);
      const tripsData = await fetchTripsByRoute(routeId);
      setTrips(tripsData);

      if (stopsData.length > 0) {
        const centerLat =
          stopsData.reduce((sum, stop) => sum + stop.stop_lat, 0) /
          stopsData.length;
        const centerLon =
          stopsData.reduce((sum, stop) => sum + stop.stop_lon, 0) /
          stopsData.length;
        setMapCenter([centerLat, centerLon]);
        setZoom(14);
      }
    } catch (error) {
      console.error("Error fetching datas:", error);
    }
  };

  return (
    <div className="map-container">
      <br />
      <h2>Rota Haritası</h2>
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
          {calendar.length > 0 ? (
            <p>
              Çalışma Günleri:{" "}
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

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "90vh", width: "calc(100vw - 20px)" }}
        id="map"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={mapCenter} zoom={zoom} />

        {stops.map((stop) => (
          <Marker
            key={`${stop.stop_id}-${selectedRoute}`}
            position={[stop.stop_lat, stop.stop_lon]}
          >
            <Popup>
              <strong>{stop.stop_name}</strong>
              <br />
              <u>Geçen Otobüsler:</u>
              <ul>
                {buses
                  .filter((bus) => bus.stop_id === stop.stop_id)
                  .map((bus) => (
                    <li
                      key={`${bus.trip_id}-${bus.stop_id}-${bus.arrival_time}`}
                    >
                      <strong>Otobüs {bus.trip_id}</strong>
                      <br />
                      Varış: {bus.arrival_time} - Kalkış: {bus.departure_time}
                    </li>
                  ))}
              </ul>

              <u>Sefer Bilgisi: </u>
              <ul>
                {trips
                  .filter((trip) => trip.route_id === selectedRoute)
                  .map((trip) => (
                    <li key={trip.trip_id}>
                      <strong>
                        {trip.trip_headsign
                          ? trip.trip_headsign
                          : "Bilinmeyen Sefer"}
                      </strong>
                      <br />
                      Başlangıç Durakları:
                      {trip.stop_times.map((stopTime, index) => (
                        <div key={index}>
                          Durak:{" "}
                          {stops.find((s) => s.stop_id === stopTime.stop_id)
                            ?.stop_name || "Bilinmeyen Durak"}
                          <br />
                          Varış: {stopTime.arrival_time} - Kalkış:{" "}
                          {stopTime.departure_time}
                        </div>
                      ))}
                    </li>
                  ))}
              </ul>
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
