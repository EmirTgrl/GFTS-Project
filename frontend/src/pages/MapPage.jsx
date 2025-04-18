import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import Sidebar from "../components/Map/Sidebar.jsx";
import MapView from "../components/Map/MapView";
import "../styles/Map.css";
import FloatingActions from "../components/FloatingActions/FloatingActions.jsx";

const MapPage = () => {
  const { token } = useContext(AuthContext);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [stopsAndTimes, setStopsAndTimes] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [mapCenter, setMapCenter] = useState([25.009, 54.9867]);
  const [zoom, setZoom] = useState(13);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [isStopTimeAddOpen, setIsStopTimeAddOpen] = useState(false);
  const { project_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [action, setAction] = useState("");
  const [editorMode, setEditorMode] = useState("close");
  const [selectedEntities, setSelectedEntities] = useState({
    agency: null,
    route: null,
    trip: null,
    calendar: null,
    shape: null,
    stop: null,
  });
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const { selectedRoute: prevRoute, selectedTrip: prevTrip } =
      location.state || {};
    if (prevRoute) {
      setSelectedRoute(prevRoute);
      setSelectedEntities((prev) => ({ ...prev, route: prevRoute }));
    }
    if (prevTrip) {
      setSelectedTrip(prevTrip);
      setSelectedEntities((prev) => ({ ...prev, trip: prevTrip }));
    }
  }, [location.state]);

  const handleMapClick = (coords) => {
    setClickedCoords(coords);
  };

  const resetClickedCoords = () => {
    setClickedCoords(null);
  };

  const openStopTimeAdd = () => {
    setIsStopTimeAddOpen(true);
  };

  const closeStopTimeAdd = () => {
    setIsStopTimeAddOpen(false);
    resetClickedCoords();
  };

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
        calendars={calendars}
        setCalendars={setCalendars}
        agencies={agencies}
        setAgencies={setAgencies}
        mapCenter={mapCenter}
        setMapCenter={setMapCenter}
        zoom={zoom}
        setZoom={setZoom}
        navigate={navigate}
        location={location}
        clickedCoords={clickedCoords}
        resetClickedCoords={resetClickedCoords}
        shapes={shapes}
        setShapes={setShapes}
        openStopTimeAdd={openStopTimeAdd}
        closeStopTimeAdd={closeStopTimeAdd}
        isStopTimeAddOpen={isStopTimeAddOpen}
        action={action}
        setAction={setAction}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <MapView
        mapCenter={mapCenter}
        zoom={zoom}
        stopsAndTimes={stopsAndTimes}
        setStopsAndTimes={setStopsAndTimes}
        setShapes={setShapes}
        onMapClick={handleMapClick}
        shapes={shapes}
        clickedCoords={clickedCoords}
        isStopTimeAddOpen={isStopTimeAddOpen}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        setSelectedCategory={setSelectedCategory}
        token={token}
      />

      <FloatingActions
        setAction={setAction}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        selectedCategory={selectedCategory}
        selectedEntities={selectedEntities}
      />
    </div>
  );
};

export default MapPage;
