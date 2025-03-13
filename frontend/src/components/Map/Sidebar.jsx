import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { deleteRouteById, fetchRoutesByAgencyId } from "../../api/routeApi";
import { fetchTripsByRouteId } from "../../api/tripApi";
import { fetchStopsAndStopTimesByTripId } from "../../api/stopTimeApi";
import { fetchShapesByTripId } from "../../api/shapeApi";
import {
  deleteCalendarById,
  fetchCalendarsByProjectId,
} from "../../api/calendarApi";
import {
  fetchAgenciesByProjectId,
  deleteAgencyById,
} from "../../api/agencyApi";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  ChevronRight,
  Map,
  BusFront,
  Clock,
  PlusCircle,
  PencilSquare,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Building,
  Bezier,
} from "react-bootstrap-icons";
import {
  Accordion,
  Pagination,
  Button,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import StopList from "./StopList";
import TripList from "./TripList";
import ShapeList from "./ShapeList";
import ShapeEditPage from "../../pages/ShapeEditPage";
import ShapeAddPage from "../../pages/ShapeAddPage";
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
import "../../styles/Sidebar.css";

const Sidebar = ({
  token,
  project_id,
  routes,
  setRoutes,
  selectedRoute,
  setSelectedRoute,
  trips,
  setTrips,
  selectedTrip,
  setSelectedTrip,
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
  openStopTimeAdd,
  closeStopTimeAdd,
  shapes,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeKey, setActiveKey] = useState("0");
  const [pageAgencies, setPageAgencies] = useState(1);
  const [pageRoutes, setPageRoutes] = useState(1);
  const [pageTrips, setPageTrips] = useState(1);
  const [pageStops, setPageStops] = useState(1);
  const [pageCalendars, setPageCalendars] = useState(1);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [pageShapes, setPageShapes] = useState(1);
  const itemsPerPage = 8;

  const [agencyFormMode, setAgencyFormMode] = useState(null);
  const [agencyEditId, setAgencyEditId] = useState(null);
  const [routeFormMode, setRouteFormMode] = useState(null);
  const [routeEditId, setRouteEditId] = useState(null);
  const [tripFormMode, setTripFormMode] = useState(null);
  const [tripEditId, setTripEditId] = useState(null);
  const [stopTimeFormMode, setStopTimeFormMode] = useState(null);
  const [stopTimeEditId, setStopTimeEditId] = useState(null);
  const [calendarFormMode, setCalendarFormMode] = useState(null);
  const [calendarEditId, setCalendarEditId] = useState(null);
  const [shapeFormMode, setShapeFormMode] = useState(null);
  const [shapeEditId, setShapeEditId] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await fetchAgenciesByProjectId(project_id, token);
        setAgencies(data);
        setPageAgencies(1);
        const calendarData = await fetchCalendarsByProjectId(project_id, token);
        setCalendars(calendarData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setAgencies([]);
        setCalendars([]);
      }
    };
    if (token && project_id) {
      loadInitialData();
    }
  }, [token, project_id, setAgencies, setCalendars]);

  const closeAllForms = () => {
    setAgencyFormMode(null);
    setAgencyEditId(null);
    setRouteFormMode(null);
    setRouteEditId(null);
    setTripFormMode(null);
    setTripEditId(null);
    setStopTimeFormMode(null);
    setStopTimeEditId(null);
    setCalendarFormMode(null);
    setCalendarEditId(null);
    setShapeFormMode(null);
    setShapeEditId(null);
    closeStopTimeAdd();
  };

  const handleSelectionChange = async (type, id) => {
    closeAllForms();

    switch (type) {
      case "agency":
        setSelectedAgency(id);
        setSelectedRoute(null);
        setSelectedTrip(null);
        setTrips([]);
        setStopsAndTimes([]);
        setShapes([]);
        setActiveKey("1");
        setPageRoutes(1);
        try {
          const routesData = await fetchRoutesByAgencyId(id, project_id, token);
          setRoutes(routesData);
        } catch (error) {
          console.error("Error fetching routes by agency:", error);
          setRoutes([]);
        }
        break;

      case "route":
        setSelectedRoute(id);
        setSelectedTrip(null);
        setStopsAndTimes([]);
        setShapes([]);
        setActiveKey("2");
        setPageTrips(1);
        try {
          const tripsData = await fetchTripsByRouteId(id, token);
          setTrips(Array.isArray(tripsData) ? tripsData : []);
        } catch (error) {
          console.error("Error fetching trips:", error);
          setTrips([]);
        }
        break;

      case "trip":
        setSelectedTrip(id);
        setActiveKey("3");
        setPageStops(1);
        try {
          const stopsAndTimesData = await fetchStopsAndStopTimesByTripId(
            id,
            project_id,
            token
          );
          setStopsAndTimes(stopsAndTimesData);

          const shapesData = await fetchShapesByTripId(project_id, id, token);
          setShapes(shapesData);

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
          console.error("Error in handleTripSelect:", error);
          setStopsAndTimes([]);
          setShapes([]);
        }
        break;

      case "calendar":
        setSelectedCalendar(id);
        break;

      default:
        console.warn("Unknown selection type:", type);
    }
  };

  const handleAddShape = () => {
    if (!selectedTrip) {
      Swal.fire("Hata!", "Lütfen önce bir trip seçin.", "error");
      return;
    }
    setShapeFormMode("add");
    setActiveKey("5");
  };

  const handleAddStop = () => {
    if (!selectedTrip) {
      Swal.fire("Hata!", "Lütfen önce bir trip seçin.", "error");
      return;
    }
    setStopTimeFormMode("add");
    setActiveKey("3");
    openStopTimeAdd();
  };

  const closeAgencyForm = () => {
    setAgencyFormMode(null);
    setAgencyEditId(null);
  };

  const openAgencyForm = (mode, agencyId = null) => {
    setAgencyFormMode(mode);
    setAgencyEditId(agencyId);
    setActiveKey("0");
  };

  const closeRouteForm = () => {
    setRouteFormMode(null);
    setRouteEditId(null);
  };

  const openRouteForm = (mode, routeId = null) => {
    setRouteFormMode(mode);
    setRouteEditId(routeId);
    setActiveKey("1");
  };

  const closeTripForm = () => {
    setTripFormMode(null);
    setTripEditId(null);
  };

  const openTripForm = (mode, tripId = null) => {
    setTripFormMode(mode);
    setTripEditId(tripId);
    setActiveKey("2");
  };

  const closeStopTimeForm = () => {
    setStopTimeFormMode(null);
    setStopTimeEditId(null);
    closeStopTimeAdd();
  };

  const openStopTimeForm = (mode, stopId = null) => {
    setStopTimeFormMode(mode);
    setStopTimeEditId(stopId);
    setActiveKey("3");
    if (mode === "add") openStopTimeAdd();
  };

  const closeCalendarForm = () => {
    setCalendarFormMode(null);
    setCalendarEditId(null);
  };

  const openCalendarForm = (mode, serviceId = null) => {
    setCalendarFormMode(mode);
    setCalendarEditId(serviceId);
    setActiveKey("4");
  };

  const closeShapeForm = () => {
    setShapeFormMode(null);
    setShapeEditId(null);
  };

  const openShapeForm = (mode, shapeId = null) => {
    setShapeFormMode(mode);
    setShapeEditId(shapeId);
    setActiveKey("5");
  };

  const handleDeleteAgency = async (agencyId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ajansı silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır",
    });
    if (result.isConfirmed) {
      try {
        await deleteAgencyById(agencyId, token);
        setAgencies((prev) => prev.filter((ag) => ag.agency_id !== agencyId));
        setPageAgencies(1);
        if (selectedAgency === agencyId) {
          setSelectedAgency(null);
          setRoutes([]);
          setTrips([]);
          setStopsAndTimes([]);
          setShapes([]);
        }
        Swal.fire("Silindi!", "Ajans başarıyla silindi.", "success");
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Ajans silinirken bir hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  const handleDeleteRoute = async (routeId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu rotayı silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır",
    });
    if (result.isConfirmed) {
      try {
        await deleteRouteById(routeId, token);
        setRoutes((prev) => prev.filter((route) => route.route_id !== routeId));
        setPageRoutes(1);
        if (selectedRoute === routeId) {
          setSelectedRoute(null);
          setTrips([]);
          setStopsAndTimes([]);
          setShapes([]);
        }
        Swal.fire("Silindi!", "Rota başarıyla silindi.", "success");
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Rota silinirken bir hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  const handleDeleteCalendar = async (serviceId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu takvimi silmek istediğinize emin misiniz?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır",
    });
    if (result.isConfirmed) {
      try {
        await deleteCalendarById(serviceId, token);
        setCalendars((prev) =>
          prev.filter((cal) => cal.service_id !== serviceId)
        );
        setPageCalendars(1);
        if (selectedCalendar === serviceId) {
          setSelectedCalendar(null);
        }
        Swal.fire("Silindi!", "Takvim başarıyla silindi.", "success");
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Takvim silinirken bir hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        <Pagination.First
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ArrowLeft size={16} />
        </Pagination.Prev>
        <span className="page-info">
          {currentPage} / {totalPages}
        </span>
        <Pagination.Next
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ArrowRight size={16} />
        </Pagination.Next>
        <Pagination.Last
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

  const getActiveDays = (calendar) => {
    if (!calendar) return "Veri yok";
    const days = [];
    if (calendar.monday === 1) days.push("Pzt");
    if (calendar.tuesday === 1) days.push("Sal");
    if (calendar.wednesday === 1) days.push("Çar");
    if (calendar.thursday === 1) days.push("Per");
    if (calendar.friday === 1) days.push("Cum");
    if (calendar.saturday === 1) days.push("Cmt");
    if (calendar.sunday === 1) days.push("Paz");
    return days.length > 0 ? days.join(", ") : "Hiçbir gün";
  };

  return (
    <div className="sidebar-container">
      <div className={`new-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <Accordion
          activeKey={activeKey}
          onSelect={(key) => setActiveKey(key)}
          className="sidebar-accordion"
        >
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <Building size={20} className="me-2" /> Ajanslar
            </Accordion.Header>
            <Accordion.Body>
              {agencyFormMode === "add" ? (
                <AgencyAddPage
                  project_id={project_id}
                  onClose={closeAgencyForm}
                  setAgencies={setAgencies}
                />
              ) : agencyFormMode === "edit" && agencyEditId ? (
                <AgencyEditPage
                  project_id={project_id}
                  agency_id={agencyEditId}
                  onClose={closeAgencyForm}
                  setAgencies={setAgencies}
                  agencies={agencies}
                />
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    className="mb-3 w-100"
                    onClick={() => openAgencyForm("add")}
                  >
                    <PlusCircle size={16} className="me-2" /> Yeni Ajans
                  </Button>
                  {agencies.length > 0 ? (
                    paginateItems(agencies, pageAgencies).map((agency) => (
                      <Card
                        key={agency.agency_id}
                        className={`mb-2 item-card ${
                          selectedAgency === agency.agency_id ? "active" : ""
                        }`}
                      >
                        <Card.Body className="d-flex justify-content-between align-items-center p-2">
                          <OverlayTrigger
                            placement="top"
                            overlay={renderTooltip(agency.agency_name)}
                          >
                            <span
                              className="item-title"
                              onClick={() =>
                                handleSelectionChange(
                                  "agency",
                                  agency.agency_id
                                )
                              }
                            >
                              {agency.agency_name}
                            </span>
                          </OverlayTrigger>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() =>
                                openAgencyForm("edit", agency.agency_id)
                              }
                            >
                              <PencilSquare size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteAgency(agency.agency_id)
                              }
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted text-center">Ajans bulunamadı.</p>
                  )}
                  {renderPagination(agencies, pageAgencies, setPageAgencies)}
                </>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>
              <Map size={20} className="me-2" /> Rotalar
            </Accordion.Header>
            <Accordion.Body>
              {routeFormMode === "add" ? (
                <RouteAddPage
                  onClose={closeRouteForm}
                  setRoutes={setRoutes}
                  selectedAgency={selectedAgency}
                  project_id={project_id}
                />
              ) : routeFormMode === "edit" && routeEditId ? (
                <RouteEditPage
                  agencies={agencies}
                  route_id={routeEditId}
                  routes={routes}
                  onClose={closeRouteForm}
                  setRoutes={setRoutes}
                  project_id={project_id}
                />
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    className="mb-3 w-100"
                    onClick={() => openRouteForm("add")}
                    disabled={!selectedAgency}
                  >
                    <PlusCircle size={16} className="me-2" /> Yeni Rota
                  </Button>
                  {routes.length > 0 ? (
                    paginateItems(routes, pageRoutes).map((route) => (
                      <Card
                        key={route.route_id}
                        className={`mb-2 item-card ${
                          selectedRoute === route.route_id ? "active" : ""
                        }`}
                      >
                        <Card.Body className="d-flex justify-content-between align-items-center p-2">
                          <OverlayTrigger
                            placement="top"
                            overlay={renderTooltip(
                              route.route_long_name || route.route_id
                            )}
                          >
                            <span
                              className="item-title"
                              onClick={() =>
                                handleSelectionChange("route", route.route_id)
                              }
                            >
                              {route.route_long_name || route.route_id}
                            </span>
                          </OverlayTrigger>
                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() =>
                                openRouteForm("edit", route.route_id)
                              }
                            >
                              <PencilSquare size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteRoute(route.route_id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted text-center">
                      {selectedAgency
                        ? "Rota bulunamadı."
                        : "Önce bir ajans seçin."}
                    </p>
                  )}
                  {renderPagination(routes, pageRoutes, setPageRoutes)}
                </>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>
              <BusFront size={20} className="me-2" /> Tripler
            </Accordion.Header>
            <Accordion.Body>
              {tripFormMode === "add" ? (
                <TripAddPage
                  project_id={project_id}
                  onClose={closeTripForm}
                  setTrips={setTrips}
                  calendars={calendars}
                  selectedRoute={selectedRoute}
                />
              ) : tripFormMode === "edit" && tripEditId ? (
                <TripEditPage
                  project_id={project_id}
                  trip_id={tripEditId}
                  onClose={closeTripForm}
                  setTrips={setTrips}
                  routes={routes}
                  calendars={calendars}
                  selectedRoute={selectedRoute}
                  trips={trips}
                />
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    className="mb-3 w-100"
                    onClick={() => openTripForm("add")}
                    disabled={!selectedRoute}
                  >
                    <PlusCircle size={16} className="me-2" /> Yeni Trip
                  </Button>
                  <TripList
                    token={token}
                    project_id={project_id}
                    trips={paginateItems(trips, pageTrips)}
                    setTrips={setTrips}
                    selectedTrip={selectedTrip}
                    setSelectedTrip={setSelectedTrip}
                    handleTripSelect={(tripId) =>
                      handleSelectionChange("trip", tripId)
                    }
                    openForm={openTripForm}
                  />
                  {renderPagination(trips, pageTrips, setPageTrips)}
                </>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3">
            <Accordion.Header>
              <Clock size={20} className="me-2" /> Duraklar
            </Accordion.Header>
            <Accordion.Body>
              {stopTimeFormMode === "add" && selectedTrip ? (
                <StopTimeAddPage
                  project_id={project_id}
                  trip_id={selectedTrip}
                  onClose={closeStopTimeForm}
                  setStopsAndTimes={setStopsAndTimes}
                  initialLat={clickedCoords?.lat}
                  initialLon={clickedCoords?.lng}
                  resetClickedCoords={resetClickedCoords}
                />
              ) : stopTimeFormMode === "edit" &&
                stopTimeEditId &&
                selectedTrip ? (
                <StopTimeEditPage
                  project_id={project_id}
                  trip_id={selectedTrip}
                  stop_id={stopTimeEditId}
                  onClose={closeStopTimeForm}
                  setStopsAndTimes={setStopsAndTimes}
                  stopsAndTimes={stopsAndTimes}
                />
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    className="mb-3 w-100"
                    onClick={handleAddStop}
                    disabled={!selectedTrip}
                  >
                    <PlusCircle size={16} className="me-2" /> Durak Ekle
                  </Button>
                  <StopList
                    token={token}
                    project_id={project_id}
                    stopsAndTimes={paginateItems(stopsAndTimes, pageStops)}
                    setStopsAndTimes={setStopsAndTimes}
                    selectedTrip={selectedTrip}
                    openForm={openStopTimeForm}
                  />
                  {renderPagination(stopsAndTimes, pageStops, setPageStops)}
                </>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="4">
            <Accordion.Header>
              <Calendar size={20} className="me-2" /> Takvimler
            </Accordion.Header>
            <Accordion.Body>
              {calendarFormMode === "add" ? (
                <CalendarAddPage
                  project_id={project_id}
                  onClose={closeCalendarForm}
                  setCalendars={setCalendars}
                />
              ) : calendarFormMode === "edit" && calendarEditId ? (
                <CalendarEditPage
                  project_id={project_id}
                  service_id={calendarEditId}
                  onClose={closeCalendarForm}
                  setCalendars={setCalendars}
                  calendars={calendars}
                />
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    className="mb-3 w-100"
                    onClick={() => openCalendarForm("add")}
                  >
                    <PlusCircle size={16} className="me-2" /> Yeni Takvim
                  </Button>
                  {calendars.length > 0 && (
                    <>
                      <h6>Tüm Takvimler:</h6>
                      {paginateItems(calendars, pageCalendars).map((cal) => (
                        <Card key={cal.service_id} className="mb-2 item-card">
                          <Card.Body className="d-flex justify-content-between align-items-center p-2">
                            <OverlayTrigger
                              placement="top"
                              overlay={renderTooltip(getActiveDays(cal))}
                            >
                              <span
                                className="item-title"
                                onClick={() =>
                                  handleSelectionChange(
                                    "calendar",
                                    cal.service_id
                                  )
                                }
                              >
                                {getActiveDays(cal)}
                              </span>
                            </OverlayTrigger>
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() =>
                                  openCalendarForm("edit", cal.service_id)
                                }
                              >
                                <PencilSquare size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleDeleteCalendar(cal.service_id)
                                }
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      {renderPagination(
                        calendars,
                        pageCalendars,
                        setPageCalendars
                      )}
                    </>
                  )}
                </>
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="5">
            <Accordion.Header>
              <Bezier size={20} className="me-2" /> Shapes
            </Accordion.Header>
            <Accordion.Body>
              {shapeFormMode === "add" && selectedTrip ? (
                <ShapeAddPage
                  project_id={project_id}
                  onClose={closeShapeForm}
                />
              ) : shapeFormMode === "edit" && shapeEditId && selectedTrip ? (
                <ShapeEditPage
                  project_id={project_id}
                  shape_id={
                    shapes.find((s) => s.shape_pt_sequence === shapeEditId)
                      ?.shape_id || ""
                  }
                  shape_pt_sequence={shapeEditId}
                  onClose={closeShapeForm}
                  setShapes={setShapes}
                  shapes={shapes}
                />
              ) : (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    className="mb-3 w-100"
                    onClick={handleAddShape}
                    disabled={!selectedTrip}
                  >
                    <PlusCircle size={16} className="me-2" /> Add Shape
                  </Button>
                  <ShapeList
                    token={token}
                    project_id={project_id}
                    shapes={paginateItems(shapes, pageShapes)}
                    setShapes={setShapes}
                    openForm={openShapeForm}
                  />
                  {renderPagination(shapes, pageShapes, setPageShapes)}
                </>
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
      <span onClick={toggleSidebar} className="sidebar-toggle-icon">
        {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </span>
    </div>
  );
};

Sidebar.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  routes: PropTypes.array.isRequired,
  setRoutes: PropTypes.func.isRequired,
  selectedRoute: PropTypes.string,
  setSelectedRoute: PropTypes.func.isRequired,
  trips: PropTypes.array.isRequired,
  setTrips: PropTypes.func.isRequired,
  selectedTrip: PropTypes.string,
  setSelectedTrip: PropTypes.func.isRequired,
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
  openStopTimeAdd: PropTypes.func.isRequired,
  closeStopTimeAdd: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
};

export default Sidebar;
