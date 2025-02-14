import { useEffect, useState } from "react";
import {
  fetchRoutes,
  fetchStopsByRoute,
  fetchRouteTimes,
  fetchBusesByRoute,
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
  const [stopTimes, setStopTimes] = useState([]);
  const [buses, setBuses] = useState([]);
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
      // Durakları al
      const stopsData = await fetchStopsByRoute(routeId);
      setStops(stopsData);

      // Kalkış/Varış saatlerini al
      const timesData = await fetchRouteTimes(routeId);
      setStopTimes(timesData);

      // Otobüsleri al
      const busesData = await fetchBusesByRoute(routeId);
      setBuses(busesData);

      // Harita merkezini güncelle
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
      console.error("Error fetching stops or times:", error);
    }
  };

  return (
    <div className="map-container">
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
                  .filter((bus) => bus.stop_id === stop.stop_id) // Sadece ilgili durağa gelen otobüsleri göster
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
