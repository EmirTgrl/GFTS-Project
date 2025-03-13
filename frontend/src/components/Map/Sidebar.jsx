import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal } from "react-bootstrap";
import { deleteRouteById} from "../../api/routeApi";
import { fetchCalendarsByProjectId } from "../../api/calendarApi";
import { fetchAgenciesByProjectId, deleteAgencyById } from "../../api/agencyApi";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, Building, Map, BusFront, Clock, Calendar, Bezier } from "react-bootstrap-icons";
import { Accordion, Pagination, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import AgencyAddPage from "../../pages/AgencyAddPage";
import AgencyEditPage from "../../pages/AgencyEditPage";
import RouteAddPage from "../../pages/RouteAddPage";
import RouteEditPage from "../../pages/RouteEditPage";
import TripAddPage from "../../pages/TripAddPage";
import TripEditPage from "../../pages/TripEditPage";
import StopTimeAddPage from "../../pages/StopTimeAddPage";
import StopTimeEditPage from "../../pages/StopTimeEditPage";
import CalendarAddPage from "../../pages/CalendarAddPage";
import CalendarEditPage from "../../pages/CalendarEditPage";
import ShapeAddPage from "../../pages/ShapeAddPage";
import ShapeEditPage from "../../pages/ShapeEditPage";
import "../../styles/Sidebar.css";

const Sidebar = ({
  token,
  project_id,
  routes,
  setRoutes,
  trips,
  setTrips,
  stopsAndTimes,
  setStopsAndTimes,
  calendars,
  setCalendars,
  agencies,
  setAgencies,
  setMapCenter,
  setZoom,
  clickedCoords,
  resetClickedCoords,
  setShapes,
  shapes,
  action,
  setAction,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeKey, setActiveKey] = useState("0");
  const [pageAgencies, setPageAgencies] = useState(1);
  const [pageRoutes, setPageRoutes] = useState(1);
  const [pageTrips, setPageTrips] = useState(1);
  const [pageStops, setPageStops] = useState(1);
  const [pageCalendars, setPageCalendars] = useState(1);
  const [pageShapes, setPageShapes] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEntities, setSelectedEntities] = useState({
    agency: null,
    route: null,
    trip: null,
    calendar: null,
    shape: null,
    stop: null, 
  });
  const [formConfig, setFormConfig] = useState(null);
  const itemsPerPage = 8;

  const categoryMap = {
    "0": "agency",
    "1": "route",
    "2": "trip",
    "3": "stop",
    "4": "calendar",
    "5": "shape",
  };

  // Load initial data (agencies and calendars)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const agencyData = await fetchAgenciesByProjectId(project_id, token);
        setAgencies(agencyData);
        const calendarData = await fetchCalendarsByProjectId(project_id, token);
        setCalendars(calendarData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setAgencies([]);
        setCalendars([]);
      }
    };
    if (token && project_id) loadInitialData();
  }, [token, project_id, setAgencies, setCalendars]);

  // Handle actions from FloatingActions
  useEffect(() => {
    if (action) {
      handleAction(action);
      setAction(""); // Reset action after handling
    }
  }, [action, activeKey, selectedCategory, selectedEntities]);

  const handleAction = (actionType) => {
    if (actionType === "add") {
      const category = categoryMap[activeKey];
      if (category) {
        if (category === "route" && !selectedEntities.agency) {
          Swal.fire("Error", "Please select an agency first.", "error");
        } else if (category === "trip" && !selectedEntities.route) {
          Swal.fire("Error", "Please select a route first.", "error");
        } else if (category === "stop" && !selectedEntities.trip) {
          Swal.fire("Error", "Please select a trip first.", "error");
        } else if (category === "shape" && !selectedEntities.trip) {
          Swal.fire("Error", "Please select a trip first.", "error");
        } else {
          setFormConfig({ action: "add", category });
        }
      }
    } else if (actionType === "edit") {
      if (selectedCategory && selectedEntities[selectedCategory]) {
        setFormConfig({
          action: "edit",
          category: selectedCategory,
          entity: selectedEntities[selectedCategory],
        });
      } else {
        Swal.fire("Error", "Please select an entity to edit.", "error");
      }
    } else if (actionType === "delete") {
      if (selectedCategory && selectedEntities[selectedCategory]) {
        handleDelete(selectedCategory, selectedEntities[selectedCategory]);
      } else {
        Swal.fire("Error", "Please select an entity to delete.", "error");
      }
    }
  };

  const handleSelectionChange = async (category, entity) => {
    switch (category) {
      case "agency":
        setSelectedEntities((prev) => ({
          ...prev,
          agency: entity,
          route: null,
          trip: null,
          stop: null,
          shape: null,
        }));
        setRoutes([]);
        setTrips([]);
        setStopsAndTimes([]);
        setShapes([]);
        setMapCenter(null);
        setActiveKey("0"); // Open "Routes" accordion
        const agencyRoutes = await fetchRoutesByAgency(entity.agency_id, token);
        setRoutes(agencyRoutes);
        break;
  
      case "route":
        setSelectedEntities((prev) => ({
          ...prev,
          route: entity,
          trip: null,
          stop: null,
          shape: null,
        }));
        setTrips([]);
        setStopsAndTimes([]);
        setShapes([]);
        setMapCenter(null);
        setActiveKey("1"); // Open "Trips" accordion
        const routeTrips = await fetchTripsByRoute(entity.route_id, token);
        setTrips(routeTrips);
        break;
  
      case "trip":
        setSelectedEntities((prev) => ({
          ...prev,
          trip: entity,
          stop: null,
          shape: null,
        }));
        setStopsAndTimes([]);
        setShapes([]);
        setMapCenter(null);
        setActiveKey("2"); // Open "Stops" accordion
        const [tripStops, tripShapes] = await Promise.all([
          fetchStopsByTrip(entity.trip_id, token),
          fetchShapesByTrip(entity.trip_id, token),
        ]);
        setStopsAndTimes(tripStops);
        setShapes(tripShapes);
        setMapCenter(tripShapes.length > 0 ? [tripShapes[0].shape_pt_lat, tripShapes[0].shape_pt_lon] : null);
        break;
  
      case "stop":
        setSelectedEntities((prev) => ({ ...prev, stop: entity }));
        setSelectedCategory("stop"); // For editing/deleting via floating actions
        setActiveKey("3"); // Keep "Stops" accordion active
        break;
  
      case "shape":
        setSelectedEntities((prev) => ({ ...prev, shape: entity }));
        setSelectedCategory("shape"); // For editing/deleting via floating actions
        setActiveKey("5"); // Keep "Shapes" accordion active
        break;
  
      default:
        break;
    }
  };

  const handleDelete = async (category, entity) => {
    try {
      if (category === "agency") {
        await deleteAgencyById(entity.agency_id, token);
        setAgencies((prev) => prev.filter((a) => a.agency_id !== entity.agency_id));
        setSelectedEntities((prev) => ({ ...prev, agency: null, route: null, trip: null, stop: null, shape: null }));
        setRoutes([]);
        setTrips([]);
        setStopsAndTimes([]);
        setShapes([]);
      } else if (category === "route") {
        await deleteRouteById(entity.route_id, token);
        setRoutes((prev) => prev.filter((r) => r.route_id !== entity.route_id));
        setSelectedEntities((prev) => ({ ...prev, route: null, trip: null, stop: null, shape: null }));
        setTrips([]);
        setStopsAndTimes([]);
        setShapes([]);
      } else if (category === "trip") {
        await deleteTripById(entity.trip_id, token);
        setTrips((prev) => prev.filter((t) => t.trip_id !== entity.trip_id));
        setSelectedEntities((prev) => ({ ...prev, trip: null, stop: null, shape: null }));
        setStopsAndTimes([]);
        setShapes([]);
      } else if (category === "stop") {
        await deleteStopById(entity.stop_id, token);
        setStopsAndTimes((prev) => prev.filter((s) => s.stop_id !== entity.stop_id));
        setSelectedEntities((prev) => ({ ...prev, stop: null }));
      } else if (category === "shape") {
        await deleteShapeById(entity.shape_id, entity.shape_pt_sequence, token);
        setShapes((prev) => prev.filter((s) => s.shape_pt_sequence !== entity.shape_pt_sequence));
        setSelectedEntities((prev) => ({ ...prev, shape: null }));
      }
      Swal.fire("Deleted!", `${category} has been deleted.`, "success");
    } catch (error) {
      Swal.fire("Error", `Failed to delete ${category}.`, "error");
    }
  };

  // Render the appropriate form in the modal
  const getFormComponent = () => {
    const { action, category, entity } = formConfig;
    if (action === "add") {
      switch (category) {
        case "agency":
          return <AgencyAddPage project_id={project_id} onClose={() => setFormConfig(null)} setAgencies={setAgencies} />;
        case "route":
          return <RouteAddPage onClose={() => setFormConfig(null)} setRoutes={setRoutes} selectedAgency={selectedEntities.agency} project_id={project_id} />;
        case "trip":
          return <TripAddPage project_id={project_id} onClose={() => setFormConfig(null)} setTrips={setTrips} calendars={calendars} selectedRoute={selectedEntities.route} />;
        case "stop":
          return <StopTimeAddPage project_id={project_id} trip_id={selectedEntities.trip?.trip_id} onClose={() => setFormConfig(null)} setStopsAndTimes={setStopsAndTimes} initialLat={clickedCoords?.lat} initialLon={clickedCoords?.lng} resetClickedCoords={resetClickedCoords} />;
        case "calendar":
          return <CalendarAddPage project_id={project_id} onClose={() => setFormConfig(null)} setCalendars={setCalendars} />;
        case "shape":
          return <ShapeAddPage project_id={project_id} onClose={() => setFormConfig(null)} shape_id={shapes[0]?.shape_id || ""} setShapes={setShapes} clickedCoords={clickedCoords} />;
        default:
          return null;
      }
    } else if (action === "edit") {
      switch (category) {
        case "agency":
          return <AgencyEditPage project_id={project_id} agency_id={entity.agency_id} onClose={() => setFormConfig(null)} setAgencies={setAgencies} agencies={agencies} />;
        case "route":
          return <RouteEditPage agencies={agencies} route_id={entity.route_id} routes={routes} onClose={() => setFormConfig(null)} setRoutes={setRoutes} project_id={project_id} />;
        case "trip":
          return <TripEditPage project_id={project_id} trip_id={entity.trip_id} onClose={() => setFormConfig(null)} setTrips={setTrips} routes={routes} calendars={calendars} selectedRoute={selectedEntities.route} trips={trips} />;
        case "stop":
          return <StopTimeEditPage project_id={project_id} trip_id={selectedEntities.trip?.trip_id} stop_id={entity.stop_id} onClose={() => setFormConfig(null)} setStopsAndTimes={setStopsAndTimes} stopsAndTimes={stopsAndTimes} />;
        case "calendar":
          return <CalendarEditPage project_id={project_id} service_id={entity.service_id} onClose={() => setFormConfig(null)} setCalendars={setCalendars} calendars={calendars} />;
        case "shape":
          return <ShapeEditPage project_id={project_id} shape_id={entity.shape_id} shape_pt_sequence={entity.shape_pt_sequence} onClose={() => setFormConfig(null)} setShapes={setShapes} shapes={shapes} clickedCoords={clickedCoords} />;
        default:
          return null;
      }
    }
    return null;
  };

  // Pagination utility
  const paginateItems = (items, currentPage) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const renderPagination = (items, currentPage, setCurrentPage) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <Pagination size="sm" className="justify-content-center mt-2">
        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
        <span className="page-info">{currentPage} / {totalPages}</span>
        <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

  const getActiveDays = (calendar) => {
    if (!calendar) return "No data";
    const days = [];
    if (calendar.monday === 1) days.push("Mon");
    if (calendar.tuesday === 1) days.push("Tue");
    if (calendar.wednesday === 1) days.push("Wed");
    if (calendar.thursday === 1) days.push("Thu");
    if (calendar.friday === 1) days.push("Fri");
    if (calendar.saturday === 1) days.push("Sat");
    if (calendar.sunday === 1) days.push("Sun");
    return days.length > 0 ? days.join(", ") : "No days";
  };

  return (
    <div className="sidebar-container">
      <div className={`new-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)} className="sidebar-accordion">
          <Accordion.Item eventKey="0">
            <Accordion.Header><Building size={20} className="me-2" /> Agencies</Accordion.Header>
            <Accordion.Body>
              {agencies.length > 0 ? (
                paginateItems(agencies, pageAgencies).map((agency) => (
                  <Card
                    key={agency.agency_id}
                    className={`mb-2 item-card ${selectedEntities.agency?.agency_id === agency.agency_id ? "active" : ""}`}
                    onClick={() => handleSelectionChange("agency", agency)}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-2">
                      <OverlayTrigger placement="top" overlay={renderTooltip(agency.agency_name)}>
                        <span className="item-title">{agency.agency_name}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">No agencies found.</p>
              )}
              {renderPagination(agencies, pageAgencies, setPageAgencies)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header><Map size={20} className="me-2" /> Routes</Accordion.Header>
            <Accordion.Body>
              {routes.length > 0 ? (
                paginateItems(routes, pageRoutes).map((route) => (
                  <Card
                    key={route.route_id}
                    className={`mb-2 item-card ${selectedEntities.route?.route_id === route.route_id ? "active" : ""}`}
                    onClick={() => handleSelectionChange("route", route)}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-2">
                      <OverlayTrigger placement="top" overlay={renderTooltip(route.route_long_name || route.route_id)}>
                        <span className="item-title">{route.route_long_name || route.route_id}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">{selectedEntities.agency ? "No routes found." : "Select an agency first."}</p>
              )}
              {renderPagination(routes, pageRoutes, setPageRoutes)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header><BusFront size={20} className="me-2" /> Trips</Accordion.Header>
            <Accordion.Body>
              {trips.length > 0 ? (
                paginateItems(trips, pageTrips).map((trip) => (
                  <Card
                    key={trip.trip_id}
                    className={`mb-2 item-card ${selectedEntities.trip?.trip_id === trip.trip_id ? "active" : ""}`}
                    onClick={() => handleSelectionChange("trip", trip)}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-2">
                      <OverlayTrigger placement="top" overlay={renderTooltip(trip.trip_headsign || trip.trip_id)}>
                        <span className="item-title">{trip.trip_headsign || trip.trip_id}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">{selectedEntities.route ? "No trips found." : "Select a route first."}</p>
              )}
              {renderPagination(trips, pageTrips, setPageTrips)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3">
            <Accordion.Header><Clock size={20} className="me-2" /> Stops</Accordion.Header>
            <Accordion.Body>
              {stopsAndTimes.length > 0 ? (
                paginateItems(stopsAndTimes, pageStops).map((stop) => (
                  <Card
                    key={stop.stop_id}
                    className={`mb-2 item-card ${selectedEntities.stop?.stop_id === stop.stop_id ? "active" : ""}`}
                    onClick={() => handleSelectionChange("stop", stop)}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-2">
                      <OverlayTrigger placement="top" overlay={renderTooltip(stop.stop_name || stop.stop_id)}>
                        <span className="item-title">{stop.stop_name || stop.stop_id}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">{selectedEntities.trip ? "No stops found." : "Select a trip first."}</p>
              )}
              {renderPagination(stopsAndTimes, pageStops, setPageStops)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="4">
            <Accordion.Header><Calendar size={20} className="me-2" /> Calendars</Accordion.Header>
            <Accordion.Body>
              {calendars.length > 0 ? (
                paginateItems(calendars, pageCalendars).map((cal) => (
                  <Card
                    key={cal.service_id}
                    className={`mb-2 item-card ${selectedEntities.calendar?.service_id === cal.service_id ? "active" : ""}`}
                    onClick={() => handleSelectionChange("calendar", cal)}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-2">
                      <OverlayTrigger placement="top" overlay={renderTooltip(getActiveDays(cal))}>
                        <span className="item-title">{getActiveDays(cal)}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">No calendars found.</p>
              )}
              {renderPagination(calendars, pageCalendars, setPageCalendars)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="5">
            <Accordion.Header><Bezier size={20} className="me-2" /> Shapes</Accordion.Header>
            <Accordion.Body>
              {shapes.length > 0 ? (
                paginateItems(shapes, pageShapes).map((shape) => (
                  <Card
                    key={shape.shape_pt_sequence}
                    className={`mb-2 item-card ${selectedEntities.shape?.shape_pt_sequence === shape.shape_pt_sequence ? "active" : ""}`}
                    onClick={() => handleSelectionChange("shape", shape)}
                  >
                    <Card.Body className="d-flex justify-content-between align-items-center p-2">
                      <OverlayTrigger placement="top" overlay={renderTooltip(`Shape Point ${shape.shape_pt_sequence}`)}>
                        <span className="item-title">Point {shape.shape_pt_sequence}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">{selectedEntities.trip ? "No shapes found." : "Select a trip first."}</p>
              )}
              {renderPagination(shapes, pageShapes, setPageShapes)}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
      <span onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="sidebar-toggle-icon">
        {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </span>
      {formConfig && (
        <Modal show onHide={() => setFormConfig(null)}>
          <Modal.Header closeButton>
            <Modal.Title>{formConfig.action === "add" ? "Add" : "Edit"} {formConfig.category}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{getFormComponent()}</Modal.Body>
        </Modal>
      )}
    </div>
  );
};

Sidebar.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  routes: PropTypes.array.isRequired,
  setRoutes: PropTypes.func.isRequired,
  trips: PropTypes.array.isRequired,
  setTrips: PropTypes.func.isRequired,
  stopsAndTimes: PropTypes.array.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  calendars: PropTypes.array.isRequired,
  setCalendars: PropTypes.func.isRequired,
  agencies: PropTypes.array.isRequired,
  setAgencies: PropTypes.func.isRequired,
  setMapCenter: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  clickedCoords: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  resetClickedCoords: PropTypes.func.isRequired,
  setShapes: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
  action: PropTypes.string.isRequired,
  setAction: PropTypes.func.isRequired,
};

export default Sidebar;