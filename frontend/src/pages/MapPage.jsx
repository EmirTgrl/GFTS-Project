import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import Sidebar from "../components/Map/Sidebar.jsx";
import MapView from "../components/Map/MapView";
import BreadcrumbBar from "../components/Map/BreadcrumbBar.jsx";
import "../styles/Map.css";
import FloatingActions from "../components/FloatingActions/FloatingActions.jsx";
import Swal from "sweetalert2";
import { Modal, Button } from "react-bootstrap";
import { fetchShapesByTripId } from "../api/shapeApi";
import { fetchStopsAndStopTimesByTripId } from "../api/stopTimeApi";

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
  const [mapCenter, setMapCenter] = useState([39.0, 35.0]);
  const [zoom, setZoom] = useState(6);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [isStopTimeAddOpen, setIsStopTimeAddOpen] = useState(false);
  const { project_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [action, setAction] = useState("");
  const [editorMode, setEditorMode] = useState("close");
  const [pageTrips, setPageTrips] = useState([]);
  const [selectedEntities, setSelectedEntities] = useState({
    agency: null,
    route: null,
    trip: null,
    calendar: null,
    shape: null,
    stop: null,
  });
  const [selectedCategory, setSelectedCategory] = useState("agency");
  const [activeKey, setActiveKey] = useState("0");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  useEffect(() => {
    const { selectedRoute: prevRoute, selectedTrip: prevTrip } =
      location.state || {};
    if (prevRoute) {
      setSelectedRoute(prevRoute);
      setSelectedEntities((prev) => ({ ...prev, route: prevRoute }));
      setSelectedCategory("route");
      setActiveKey("1");
    }
    if (prevTrip) {
      setSelectedTrip(prevTrip);
      setSelectedEntities((prev) => ({ ...prev, trip: prevTrip }));
      setSelectedCategory("trip");
      setActiveKey("3");
    }
  }, [location.state]);

  const calculateCenter = (shapes, stops) => {
    let latSum = 0;
    let lonSum = 0;
    let count = 0;

    if (shapes && shapes.length > 0) {
      shapes.forEach((shape) => {
        latSum += parseFloat(shape.shape_pt_lat);
        lonSum += parseFloat(shape.shape_pt_lon);
        count++;
      });
    }
    if (stops && stops.length > 0) {
      stops.forEach((stop) => {
        latSum += parseFloat(stop.stop_lat);
        lonSum += parseFloat(stop.stop_lon);
        count++;
      });
    }

    if (count > 0) {
      return [latSum / count, lonSum / count];
    }
    return [25.009, 54.9867];
  };

  useEffect(() => {
    const loadFromUrl = async () => {
      const query = new URLSearchParams(location.search);
      const agencyId = query.get("agency");
      const routeId = query.get("route");
      const calendarId = query.get("calendar"); 
      const tripId = query.get("trip");
      const stopId = query.get("stop");

      if (
        !agencies.data?.length ||
        !routes.data?.length ||
        !trips.data?.length ||
        !calendars.data?.length 
      ) {
        return; 
      }

      let updatedEntities = { ...selectedEntities };

      if (agencyId) {
        const agency = agencies.data.find((a) => a.agency_id === agencyId);
        if (agency && updatedEntities.agency?.agency_id !== agencyId) {
          updatedEntities.agency = agency;
          setSelectedCategory("agency");
          setActiveKey("0");
        }
      }

      if (routeId) {
        const route = routes.data.find((r) => r.route_id === routeId);
        if (route && updatedEntities.route?.route_id !== routeId) {
          updatedEntities.route = route;
          setSelectedCategory("route");
          setActiveKey("1");
        }
      }

      if (calendarId) {
        const calendar = calendars.data.find(
          (c) => c.service_id === calendarId
        );
        if (calendar && updatedEntities.calendar?.service_id !== calendarId) {
          updatedEntities.calendar = calendar;
          setSelectedCategory("calendar");
          setActiveKey("2");
        }
      }

      if (tripId) {
        const trip = trips.data.find((t) => t.trip_id === tripId);
        if (trip && updatedEntities.trip?.trip_id !== tripId) {
          updatedEntities.trip = trip;
          setSelectedCategory("trip");
          setActiveKey("3");

          if (!shapes.length || !stopsAndTimes.length) {
            try {
              const shapesResponse = await fetchShapesByTripId(
                project_id,
                trip.shape_id,
                token
              );
              const stopsResponse = await fetchStopsAndStopTimesByTripId(
                trip.trip_id,
                project_id,
                token
              );

              setShapes(shapesResponse || []);
              setStopsAndTimes(stopsResponse || []);

              const center = calculateCenter(shapesResponse, stopsResponse);
              setMapCenter(center);
              setZoom(12);
            } catch (error) {
              console.error("Trip verileri yüklenirken hata:", error);
            }
          }
        }
      }

      if (stopId && stopsAndTimes.length > 0) {
        const stop = stopsAndTimes.find((s) => s.stop_id === stopId);
        if (stop && updatedEntities.stop?.stop_id !== stopId) {
          updatedEntities.stop = stop;
          setSelectedCategory("stop");
          setActiveKey("5");

          if (stop.stop_lat && stop.stop_lon) {
            setMapCenter([
              parseFloat(stop.stop_lat),
              parseFloat(stop.stop_lon),
            ]);
            setZoom(18);
          }
        }
      }

      if (
        JSON.stringify(updatedEntities) !== JSON.stringify(selectedEntities)
      ) {
        setSelectedEntities(updatedEntities);
      }
    };

    loadFromUrl();
  }, [
    location.search,
    agencies.data,
    routes.data,
    trips.data,
    calendars.data,
    project_id,
    token,
  ]);

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

  const createLink = () => {
    if (!selectedEntities.agency) {
      Swal.fire("Hata", "Lütfen en az bir agency seçin!", "error");
      return;
    }

    const baseUrl = window.location.origin + `/map/${project_id}`;
    let queryParams = `?agency=${encodeURIComponent(
      selectedEntities.agency.agency_id
    )}`;

    if (selectedEntities.route) {
      queryParams += `&route=${encodeURIComponent(
        selectedEntities.route.route_id
      )}`;
    }
    if (selectedEntities.calendar) {
      queryParams += `&calendar=${encodeURIComponent(
        selectedEntities.calendar.service_id
      )}`;
    }
    if (selectedEntities.trip) {
      queryParams += `&trip=${encodeURIComponent(
        selectedEntities.trip.trip_id
      )}`;
    }
    if (selectedEntities.stop) {
      queryParams += `&stop=${encodeURIComponent(
        selectedEntities.stop.stop_id
      )}`;
    }

    const fullUrl = `${baseUrl}${queryParams}`;
    setGeneratedUrl(fullUrl);
    setShowUrlModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      Swal.fire("Kopyalandı!", "URL panoya kopyalandı.", "success");
    });
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
        activeKey={activeKey}
        setActiveKey={setActiveKey}
      />

      <BreadcrumbBar
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        setActiveKey={setActiveKey}
        trips={trips}
        setPageTrips={setPageTrips}
        itemsPerPage={8}
        isFilterOpen={false}
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
        project_id={project_id}
      />

      <FloatingActions
        setAction={setAction}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        selectedCategory={selectedCategory}
        selectedEntities={selectedEntities}
        createLink={createLink}
      />

      <Modal show={showUrlModal} onHide={() => setShowUrlModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Link Created</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You can return to your selection using this URL:</p>
          <input
            type="text"
            value={generatedUrl}
            readOnly
            className="form-control mb-3"
          />
          <Button variant="primary" onClick={copyToClipboard}>
            Copy URL
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUrlModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MapPage;
