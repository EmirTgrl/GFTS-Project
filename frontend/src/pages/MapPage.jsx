import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import Sidebar from "../components/Map/Sidebar.jsx";
import MapView from "../components/Map/MapView";
import "../styles/Map.css";

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
  const { project_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { selectedRoute: prevRoute, selectedTrip: prevTrip } =
      location.state || {};
    if (prevRoute) setSelectedRoute(prevRoute);
    if (prevTrip) setSelectedTrip(prevTrip);
  }, [location.state]);

  return (
    <div className="map-container">
      <Sidebar
        token={token}
        project_id={project_id}
        routes={routes}
        setRoutes={setRoutes}
        filteredRoutes={filteredRoutes}
        setFilteredRoutes={setFilteredRoutes}
        selectedRoute={selectedRoute}
        setSelectedRoute={setSelectedRoute}
        trips={trips}
        setTrips={setTrips}
        selectedTrip={selectedTrip}
        setSelectedTrip={setSelectedTrip}
        stopsAndTimes={stopsAndTimes}
        setStopsAndTimes={setStopsAndTimes}
        calendar={calendar}
        setCalendar={setCalendar}
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        zoom={zoom}
        setZoom={setZoom}
        navigate={navigate}
        location={location}
      />
      <MapView
        mapCenter={mapCenter}
        zoom={zoom}
        stopsAndTimes={stopsAndTimes}
        selectedTrip={selectedTrip}
      />
    </div>
  );
};

export default MapPage;
