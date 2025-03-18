import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Form,
  Accordion,
  Pagination,
  Card,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  List,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Map as MapIcon,
  BusFront,
  Clock,
  Calendar,
  TrainFront,
  TrainFreightFront,
  LifePreserver,
  TrainLightrailFront,
  SignRailroad,
  GeoAlt, 
  BoundingBoxCircles 
} from "react-bootstrap-icons";
import Swal from "sweetalert2";
import { deleteRouteById, fetchRoutesByAgencyId } from "../../api/routeApi";
import { fetchCalendarsByProjectId } from "../../api/calendarApi";
import {
  fetchAgenciesByProjectId,
  deleteAgencyById,
} from "../../api/agencyApi";
import { deleteTripById, fetchTripsByRouteId } from "../../api/tripApi";
import {
  fetchStopsAndStopTimesByTripId,
  deleteStopTimeById,
} from "../../api/stopTimeApi";
import { deleteStopById } from "../../api/stopApi";
import { deleteShape, fetchShapesByShapeId } from "../../api/shapeApi";
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
  selectedEntities,
  setSelectedEntities,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeKey, setActiveKey] = useState("0");
  const [pageAgencies, setPageAgencies] = useState(1);
  const [pageRoutes, setPageRoutes] = useState(1);
  const [pageTrips, setPageTrips] = useState(1);
  const [pageStops, setPageStops] = useState(1);
  const [pageCalendars, setPageCalendars] = useState(1);
  const [pageShapes, setPageShapes] = useState(1);
 
  const [formConfig, setFormConfig] = useState(null);
  const [filteredAgencies, setFilteredAgencies] = useState(agencies);
  const [filteredRoutes, setFilteredRoutes] = useState(routes);
  const [filteredTrips, setFilteredTrips] = useState(trips);
  const [filteredStops, setFilteredStops] = useState([]);
  const [filteredCalendars, setFilteredCalendars] = useState(calendars);
  const [filteredShapes, setFilteredShapes] = useState(shapes);
  const [searchTerms, setSearchTerms] = useState({
    agencies: "",
    routes: "",
    trips: "",
    stops: "",
    calendars: "",
    shapes: "",
  });
  const itemsPerPage = 8;

  const categoryMap = {
    0: "agency",
    1: "route",
    2: "calendar",
    3: "trip",
    4: "shape",
    5: "stop",
  };

  useEffect(() => {
    setFilteredAgencies(agencies);
    setFilteredRoutes(routes);
    setFilteredTrips(trips);
    setFilteredCalendars(calendars);
    setFilteredShapes(shapes);
  }, [agencies, routes, trips, calendars, shapes]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const agencyData = await fetchAgenciesByProjectId(project_id, token);
        setAgencies(agencyData);
        setFilteredAgencies(agencyData);
        const calendarData = await fetchCalendarsByProjectId(project_id, token);
        setCalendars(calendarData);
        setFilteredCalendars(calendarData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setAgencies([]);
        setFilteredAgencies([]);
        setCalendars([]);
        setFilteredCalendars([]);
      }
    };
    if (token && project_id) loadInitialData();
  }, [token, project_id]);

  useEffect(() => {
    if (action) {
      handleAction(action);
      setAction("");
    }
  }, [action]);

  const loadTripTimes = async () => {
    if (!selectedEntities.route || trips.length === 0) return;
    const updatedTrips = await Promise.all(
      trips.map(async (trip) => {
        if (trip.departure_time) return trip; // Zaten saat varsa atla
        const stops = await fetchStopsAndStopTimesByTripId(
          trip.trip_id,
          project_id,
          token
        );
        return {
          ...trip,
          departure_time: stops[0]?.departure_time || "N/A",
          arrival_time: stops[stops.length - 1]?.arrival_time || "N/A",
        };
      })
    );
    setTrips(updatedTrips);
    setFilteredTrips(updatedTrips);
  };

  const handleSearch = (category, term, items, setFiltered, setPage) => {
    const filtered = items.filter((item) => {
      let searchValue = "";
      if (category === "agencies") searchValue = item.agency_name || "";
      if (category === "routes")
        searchValue = item.route_long_name || item.route_id || "";
      if (category === "trips")
        searchValue = item.trip_headsign || item.trip_id || "";
      if (category === "stops")
        searchValue = item.stop_name || item.stop_id || "";
      if (category === "calendars") searchValue = getActiveDays(item) || "";
      if (category === "shapes")
        searchValue = item.shape_pt_sequence
          ? `Point ${item.shape_pt_sequence}`
          : "";
      return searchValue.toLowerCase().includes(term.toLowerCase());
    });
    setFiltered(filtered);
    setPage(1);
  };

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
    return null;
  };

  const handleSelectionChange = async (category, entity) => {
    switch (category) {
      case "agency": {
        if (selectedEntities.agency?.agency_id === entity.agency_id) {
          setSelectedEntities((prev) => ({
            ...prev,
            agency: null,
            route: null,
            calendar: null,
            trip: null,
            shape: null,
            stop: null,
          }));
          setRoutes([]);
          setTrips([]);
          setCalendars([]);
          setShapes([]);
          setStopsAndTimes([]);
          setFilteredStops([]);
          setSelectedCategory("");
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            agency: entity,
            route: null,
            calendar: null,
            trip: null,
            shape: null,
            stop: null,
          }));
          setRoutes([]);
          setTrips([]);
          setCalendars([]);
          setShapes([]);
          setStopsAndTimes([]);
          setFilteredStops([]);
          const agencyRoutes = await fetchRoutesByAgencyId(
            entity.agency_id,
            project_id,
            token
          );
          setRoutes(agencyRoutes);
          setFilteredRoutes(agencyRoutes);
          setSelectedCategory("agency");
        }
        break;
      }

      case "route": {
        if (selectedEntities.route?.route_id === entity.route_id) {
          setSelectedEntities((prev) => ({
            ...prev,
            route: null,
            calendar: null,
            trip: null,
            shape: null,
            stop: null,
          }));
          setTrips([]);
          setShapes([]);
          setStopsAndTimes([]);
          setFilteredStops([]);
          setSelectedCategory("agency");
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            route: entity,
            calendar: null,
            trip: null,
            shape: null,
            stop: null,
          }));
          setTrips([]);
          setShapes([]);
          setStopsAndTimes([]);
          setFilteredStops([]);
          const [calendarData, routeTrips] = await Promise.all([
            fetchCalendarsByProjectId(project_id, token),
            fetchTripsByRouteId(entity.route_id, token),
          ]);
          setCalendars(calendarData);
          setFilteredCalendars(calendarData);
          setTrips(routeTrips);
          setFilteredTrips(routeTrips);
          setSelectedCategory("route");
        }
        break;
      }

      case "calendar": {
        if (selectedEntities.calendar?.service_id === entity.service_id) {
          setSelectedEntities((prev) => ({
            ...prev,
            calendar: null,
            trip: null,
            shape: null,
            stop: null,
          }));
          setShapes([]);
          setFilteredStops([]);
          const routeTrips = await fetchTripsByRouteId(
            selectedEntities.route.route_id,
            token
          );
          setTrips(routeTrips);
          setFilteredTrips(routeTrips);
          setSelectedCategory("route");
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            calendar: entity,
            trip: null,
            shape: null,
            stop: null,
          }));
          setShapes([]);
          setFilteredStops([]);
          const routeTrips = await fetchTripsByRouteId(
            selectedEntities.route.route_id,
            token
          );
          const filteredTrips = routeTrips.filter(
            (trip) => trip.service_id === entity.service_id
          );
          setTrips(filteredTrips);
          setFilteredTrips(filteredTrips);
          setSelectedCategory("calendar");
        }
        break;
      }

      case "trip": {
        if (selectedEntities.trip?.trip_id === entity.trip_id) {
          setSelectedEntities((prev) => ({
            ...prev,
            trip: null,
            shape: null,
            stop: null,
          }));
          setShapes([]);
          setFilteredStops([]);
          setSelectedCategory("calendar");
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            trip: entity,
            shape: null,
            stop: null,
          }));
          const [tripStops, tripShapes] = await Promise.all([
            fetchStopsAndStopTimesByTripId(entity.trip_id, project_id, token),
            fetchShapesByShapeId(project_id, entity.shape_id, token),
          ]);
          setShapes(tripShapes);
          setFilteredShapes(tripShapes);
          setStopsAndTimes(tripStops);
          setFilteredStops(tripStops);
          const center = calculateCenter(tripShapes, tripStops);
          if (center) {
            setMapCenter(center);
            setZoom(12);
          }
          setSelectedCategory("trip");
        }
        break;
      }

      case "shape": {
        if (
          selectedEntities.shape?.shape_pt_sequence === entity.shape_pt_sequence
        ) {
          setSelectedEntities((prev) => ({ ...prev, shape: null }));
          setSelectedCategory("trip");
        } else {
          setSelectedEntities((prev) => ({ ...prev, shape: entity }));
          setSelectedCategory("shape");
          if (entity.shape_pt_lat && entity.shape_pt_lon) {
            setMapCenter([
              parseFloat(entity.shape_pt_lat),
              parseFloat(entity.shape_pt_lon),
            ]);
            setZoom(18);
          }
        }
        break;
      }

      case "stop": {
        if (selectedEntities.stop?.stop_id === entity.stop_id) {
          setSelectedEntities((prev) => ({ ...prev, stop: null }));
          setSelectedCategory("trip");
        } else {
          setSelectedEntities((prev) => ({ ...prev, stop: entity }));
          setSelectedCategory("stop");
          if (entity.stop_lat && entity.stop_lon) {
            setMapCenter([
              parseFloat(entity.stop_lat),
              parseFloat(entity.stop_lon),
            ]);
            setZoom(18);
          }
        }
        break;
      }

      default:
        break;
    }
  };

  const handleDelete = async (category, entity) => {
    try {
      if (category === "agency") {
        await deleteAgencyById(entity.agency_id, token);
        setAgencies((prev) =>
          prev.filter((a) => a.agency_id !== entity.agency_id)
        );
        setFilteredAgencies((prev) =>
          prev.filter((a) => a.agency_id !== entity.agency_id)
        );
        setSelectedEntities((prev) => ({
          ...prev,
          agency: null,
          route: null,
          trip: null,
          stop: null,
          shape: null,
        }));
        setRoutes([]);
        setFilteredRoutes([]);
        setTrips([]);
        setFilteredTrips([]);
        setStopsAndTimes([]);
        setFilteredStops([]);
        setShapes([]);
        setFilteredShapes([]);
      } else if (category === "route") {
        await deleteRouteById(entity.route_id, token);
        setRoutes((prev) => prev.filter((r) => r.route_id !== entity.route_id));
        setFilteredRoutes((prev) =>
          prev.filter((r) => r.route_id !== entity.route_id)
        );
        setSelectedEntities((prev) => ({
          ...prev,
          route: null,
          trip: null,
          stop: null,
          shape: null,
        }));
        setTrips([]);
        setFilteredTrips([]);
        setStopsAndTimes([]);
        setFilteredStops([]);
        setShapes([]);
        setFilteredShapes([]);
      } else if (category === "trip") {
        await deleteTripById(entity.trip_id, token);
        setTrips((prev) => prev.filter((t) => t.trip_id !== entity.trip_id));
        setFilteredTrips((prev) =>
          prev.filter((t) => t.trip_id !== entity.trip_id)
        );
        setSelectedEntities((prev) => ({
          ...prev,
          trip: null,
          stop: null,
          shape: null,
        }));
        setStopsAndTimes((prev) =>
          prev.filter((s) => s.trip_id !== entity.trip_id)
        );
        setFilteredStops([]);
        setShapes([]);
        setFilteredShapes([]);
      } else if (category === "stop") {
        await deleteStopTimeById(entity.trip_id, entity.stop_id, token);
        await deleteStopById(entity.stop_id, token);
        setStopsAndTimes((prev) =>
          prev.filter((s) => s.stop_id !== entity.stop_id)
        );
        setFilteredStops((prev) =>
          prev.filter((s) => s.stop_id !== entity.stop_id)
        );
        setSelectedEntities((prev) => ({ ...prev, stop: null }));
      } else if (category === "shape") {
        await deleteShape(entity.shape_id, entity.shape_pt_sequence, token);
        setShapes((prev) =>
          prev.filter((s) => s.shape_pt_sequence !== entity.shape_pt_sequence)
        );
        setFilteredShapes((prev) =>
          prev.filter((s) => s.shape_pt_sequence !== entity.shape_pt_sequence)
        );
        setSelectedEntities((prev) => ({ ...prev, shape: null }));
      }
      Swal.fire("Deleted!", `${category} has been deleted.`, "success");
    } catch (error) {
      console.error("Error deleting entity:", error);
      Swal.fire("Error", `Failed to delete ${category}.`, "error");
    }
  };

  const getFormComponent = () => {
    const { action, category, entity } = formConfig;
    if (action === "add") {
      switch (category) {
        case "agency":
          return (
            <AgencyAddPage
              project_id={project_id}
              onClose={() => setFormConfig(null)}
              setAgencies={setAgencies}
            />
          );
        case "route":
          return (
            <RouteAddPage
              onClose={() => setFormConfig(null)}
              setRoutes={setRoutes}
              selectedAgency={selectedEntities.agency}
              project_id={project_id}
            />
          );
        case "trip":
          return (
            <TripAddPage
              project_id={project_id}
              onClose={() => setFormConfig(null)}
              setTrips={setTrips}
              calendars={calendars}
              selectedRoute={selectedEntities.route}
            />
          );
        case "stop":
          return (
            <StopTimeAddPage
              project_id={project_id}
              trip_id={selectedEntities.trip?.trip_id}
              onClose={() => setFormConfig(null)}
              setStopsAndTimes={setStopsAndTimes}
              initialLat={clickedCoords?.lat}
              initialLon={clickedCoords?.lng}
              resetClickedCoords={resetClickedCoords}
            />
          );
        case "calendar":
          return (
            <CalendarAddPage
              project_id={project_id}
              onClose={() => setFormConfig(null)}
              setCalendars={setCalendars}
            />
          );
        case "shape":
          return (
            <ShapeAddPage
              project_id={project_id}
              onClose={() => setFormConfig(null)}
              shape_id={shapes[0]?.shape_id || ""}
              setShapes={setShapes}
              clickedCoords={clickedCoords}
            />
          );
        default:
          return null;
      }
    } else if (action === "edit") {
      switch (category) {
        case "agency":
          return (
            <AgencyEditPage
              project_id={project_id}
              agency_id={entity.agency_id}
              onClose={() => setFormConfig(null)}
              setAgencies={setAgencies}
              agencies={agencies}
            />
          );
        case "route":
          return (
            <RouteEditPage
              agencies={agencies}
              route_id={entity.route_id}
              routes={routes}
              onClose={() => setFormConfig(null)}
              setRoutes={setRoutes}
              project_id={project_id}
            />
          );
        case "trip":
          return (
            <TripEditPage
              project_id={project_id}
              trip_id={entity.trip_id}
              onClose={() => setFormConfig(null)}
              setTrips={setTrips}
              routes={routes}
              calendars={calendars}
              selectedRoute={selectedEntities.route}
              trips={trips}
            />
          );
        case "stop":
          return (
            <StopTimeEditPage
              project_id={project_id}
              trip_id={selectedEntities.trip?.trip_id}
              stop_id={selectedEntities.stop.stop_id}
              onClose={() => setFormConfig(null)}
              setStopsAndTimes={setStopsAndTimes}
              stopsAndTimes={stopsAndTimes}
            />
          );
        case "calendar":
          return (
            <CalendarEditPage
              project_id={project_id}
              service_id={entity.service_id}
              onClose={() => setFormConfig(null)}
              setCalendars={setCalendars}
              calendars={calendars}
            />
          );
        case "shape":
          return (
            <ShapeEditPage
              project_id={project_id}
              shape_id={entity.shape_id}
              shape_pt_sequence={entity.shape_pt_sequence}
              onClose={() => setFormConfig(null)}
              setShapes={setShapes}
              shapes={shapes}
              clickedCoords={clickedCoords}
            />
          );
        default:
          return null;
      }
    }
    return null;
  };

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
        />
        <span className="page-info">
          {currentPage} / {totalPages}
        </span>
        <Pagination.Next
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

  const getActiveDays = (calendar) => {
    if (!calendar) return "N/A";
    const days = [];
    if (calendar.monday === 1) days.push("Pzt");
    if (calendar.tuesday === 1) days.push("Sal");
    if (calendar.wednesday === 1) days.push("Çar");
    if (calendar.thursday === 1) days.push("Per");
    if (calendar.friday === 1) days.push("Cum");
    if (calendar.saturday === 1) days.push("Cts");
    if (calendar.sunday === 1) days.push("Paz");
    return days.length > 0 ? days.join(",") : "N/A";
  };

  const getTripDays = (tripId) => {
    const trip = trips.find((t) => t.trip_id === tripId);
    if (!trip || !calendars) return "N/A";
    const calendar = calendars.find((c) => c.service_id === trip.service_id);
    return getActiveDays(calendar);
  };

  const getRouteTypeIcon = (routeType) => {
    switch (routeType) {
      case 0:
        return <TrainLightrailFront />;
      case 1:
        return <TrainFreightFront />;
      case 2:
        return <TrainFront />;
      case 3:
        return <BusFront />;
      case 4:
        return <LifePreserver />;
      case 5:
        return <TrainLightrailFront />;
      case 7:
        return <SignRailroad />;
      case 11:
        return <BusFront />;
      case 12:
        return <SignRailroad />;
      default:
        return <BusFront />;
    }
  };

  const parseTimeToDate = (timeStr) => {
    if (!timeStr || timeStr === "N/A") return null;
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds, 0);
    return date;
  };

  const getTripTimes = (tripId) => {
    const trip = trips.find((t) => t.trip_id === tripId);
    return {
      departure: trip?.departure_time || "N/A",
      arrival: trip?.arrival_time || "N/A",
    };
  };

  const getTripStyle = (tripId) => {
    const now = new Date();
    const times = getTripTimes(tripId);
    const departureTime = parseTimeToDate(times.departure);

    if (!departureTime) return {};

    if (departureTime < now) {
      return { opacity: 0.5, backgroundColor: "#f8f9fa" };
    }

    return {};
  };

  return (
    <div className="sidebar-container">
      <div className={`new-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <Accordion
          activeKey={activeKey}
          onSelect={(key) => {
            setActiveKey(key);
            if (key === "3" && trips.length > 0 && !trips[0].departure_time) {
              loadTripTimes();
            }
          }}
          className="sidebar-accordion"
        >
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <Building size={20} className="me-2" /> Agencies
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search agencies..."
                  value={searchTerms.agencies}
                  onChange={(e) => {
                    setSearchTerms({
                      ...searchTerms,
                      agencies: e.target.value,
                    });
                    handleSearch(
                      "agencies",
                      e.target.value,
                      agencies,
                      setFilteredAgencies,
                      setPageAgencies
                    );
                  }}
                />
              </Form.Group>
              {filteredAgencies.length > 0 ? (
                paginateItems(filteredAgencies, pageAgencies).map((agency) => (
                  <Card
                    key={agency.agency_id}
                    className={`mb-2 item-card ${
                      selectedEntities.agency?.agency_id === agency.agency_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectionChange("agency", agency)}
                  >
                    <Card.Body className="d-flex align-items-center p-2">
                      <OverlayTrigger
                        placement="top"
                        overlay={renderTooltip(agency.agency_name)}
                      >
                        <span className="item-title">{agency.agency_name}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">No agencies found.</p>
              )}
              {renderPagination(
                filteredAgencies,
                pageAgencies,
                setPageAgencies
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>
              <MapIcon size={20} className="me-2" /> Routes
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search routes..."
                  value={searchTerms.routes}
                  onChange={(e) => {
                    setSearchTerms({ ...searchTerms, routes: e.target.value });
                    handleSearch(
                      "routes",
                      e.target.value,
                      routes,
                      setFilteredRoutes,
                      setPageRoutes
                    );
                  }}
                />
              </Form.Group>
              {filteredRoutes.length > 0 ? (
                paginateItems(filteredRoutes, pageRoutes).map((route) => (
                  <Card
                    key={route.route_id}
                    className={`mb-2 item-card ${
                      selectedEntities.route?.route_id === route.route_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectionChange("route", route)}
                  >
                    <Card.Body className="d-flex align-items-center p-2">
                      {getRouteTypeIcon(route.route_type)}
                      <OverlayTrigger
                        placement="top"
                        overlay={renderTooltip(
                          route.route_long_name || route.route_id
                        )}
                      >
                        <span className="item-title ms-2">
                          {route.route_long_name || route.route_id}
                        </span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">
                  {selectedEntities.agency
                    ? "No routes found."
                    : "Select an agency first."}
                </p>
              )}
              {renderPagination(filteredRoutes, pageRoutes, setPageRoutes)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>
              <Calendar size={20} className="me-2" /> Calendars
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search calendars..."
                  value={searchTerms.calendars}
                  onChange={(e) => {
                    setSearchTerms({
                      ...searchTerms,
                      calendars: e.target.value,
                    });
                    handleSearch(
                      "calendars",
                      e.target.value,
                      calendars,
                      setFilteredCalendars,
                      setPageCalendars
                    );
                  }}
                />
              </Form.Group>
              {filteredCalendars.length > 0 ? (
                paginateItems(filteredCalendars, pageCalendars).map((cal) => (
                  <Card
                    key={cal.service_id}
                    className={`mb-2 item-card ${
                      selectedEntities.calendar?.service_id === cal.service_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectionChange("calendar", cal)}
                  >
                    <Card.Body className="d-flex align-items-center p-2">
                      <OverlayTrigger
                        placement="top"
                        overlay={renderTooltip(getActiveDays(cal))}
                      >
                        <span className="item-title">{getActiveDays(cal)}</span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">No calendars found.</p>
              )}
              {renderPagination(
                filteredCalendars,
                pageCalendars,
                setPageCalendars
              )}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3">
            <Accordion.Header>
              <BusFront size={20} className="me-2" /> Trips
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerms.trips}
                  onChange={(e) => {
                    setSearchTerms({ ...searchTerms, trips: e.target.value });
                    handleSearch(
                      "trips",
                      e.target.value,
                      trips,
                      setFilteredTrips,
                      setPageTrips
                    );
                  }}
                />
              </Form.Group>
              {filteredTrips.length > 0 ? (
                paginateItems(filteredTrips, pageTrips).map((trip, index) => {
                  const times = getTripTimes(trip.trip_id);
                  const days = getTripDays(trip.trip_id);
                  return (
                    <Card
                      key={`${trip.trip_id}-${index}`}
                      className={`mb-2 item-card ${
                        selectedEntities.trip?.trip_id === trip.trip_id
                          ? "active"
                          : ""
                      }`}
                      onClick={() => handleSelectionChange("trip", trip)}
                      style={getTripStyle(trip.trip_id)}
                    >
                      <Card.Body className="d-flex align-items-center p-2">
                        {trip.direction_id === 0 ? (
                          <ArrowDownLeft className="me-2" />
                        ) : (
                          <ArrowUpRight className="me-2" />
                        )}
                        <div className="flex-grow-1">
                          <OverlayTrigger
                            placement="top"
                            overlay={renderTooltip(
                              trip.trip_headsign || trip.trip_id
                            )}
                          >
                            <span className="item-title d-block">
                              {trip.trip_headsign || trip.trip_id}
                            </span>
                          </OverlayTrigger>
                          <span style={{ fontSize: "0.8em" }}>
                            {times.departure !== "N/A" &&
                            times.arrival !== "N/A"
                              ? `${times.departure} - ${times.arrival}`
                              : "N/A"}
                            {" | "}
                            <span
                              style={{ fontSize: "0.7em", color: "#6c757d" }}
                            >
                              {days}
                            </span>
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })
              ) : (
                <p className="text-muted text-center">
                  {selectedEntities.route
                    ? "No trips found."
                    : "Select a route first."}
                </p>
              )}
              {renderPagination(filteredTrips, pageTrips, setPageTrips)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="4">
            <Accordion.Header>
              <BoundingBoxCircles size={20} className="me-2" /> Shapes
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search shapes..."
                  value={searchTerms.shapes}
                  onChange={(e) => {
                    setSearchTerms({ ...searchTerms, shapes: e.target.value });
                    handleSearch(
                      "shapes",
                      e.target.value,
                      shapes,
                      setFilteredShapes,
                      setPageShapes
                    );
                  }}
                />
              </Form.Group>
              {filteredShapes.length > 0 ? (
                paginateItems(filteredShapes, pageShapes).map((shape) => (
                  <Card
                    key={`${shape.shape_id}-${shape.shape_pt_sequence}`}
                    className={`mb-2 item-card ${
                      selectedEntities.shape?.shape_pt_sequence ===
                      shape.shape_pt_sequence
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectionChange("shape", shape)}
                  >
                    <Card.Body className="d-flex align-items-center p-2">
                      <OverlayTrigger
                        placement="top"
                        overlay={renderTooltip(
                          `Shape Point ${shape.shape_pt_sequence}`
                        )}
                      >
                        <span className="item-title">
                          Point {shape.shape_pt_sequence}
                        </span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">
                  {selectedEntities.trip
                    ? "No shapes found."
                    : "Select a trip first."}
                </p>
              )}
              {renderPagination(filteredShapes, pageShapes, setPageShapes)}
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="5">
            <Accordion.Header>
              <Clock size={20} className="me-2" /> Stops
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search stops..."
                  value={searchTerms.stops}
                  onChange={(e) => {
                    setSearchTerms({ ...searchTerms, stops: e.target.value });
                    handleSearch(
                      "stops",
                      e.target.value,
                      filteredStops,
                      setFilteredStops,
                      setPageStops
                    );
                  }}
                />
              </Form.Group>
              {filteredStops.length > 0 && selectedEntities.trip ? (
                paginateItems(filteredStops, pageStops).map((stop) => (
                  <Card
                    key={`${stop.trip_id}-${stop.stop_id}-${stop.stop_sequence}`}
                    className={`mb-2 item-card ${
                      selectedEntities.stop?.stop_id === stop.stop_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectionChange("stop", stop)}
                  >
                    <Card.Body className="d-flex align-items-center p-2">
                      <OverlayTrigger
                        placement="top"
                        overlay={renderTooltip(stop.stop_name || stop.stop_id)}
                      >
                        <span className="item-title">
                          {stop.stop_sequence}. {stop.stop_name || stop.stop_id}
                        </span>
                      </OverlayTrigger>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-muted text-center">
                  {selectedEntities.trip
                    ? "No stops found."
                    : "Select a trip first."}
                </p>
              )}
              {renderPagination(filteredStops, pageStops, setPageStops)}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
      <span
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="sidebar-toggle-icon"
      >
        <List size={30} />
      </span>
      {formConfig && (
        <Modal show onHide={() => setFormConfig(null)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {formConfig.action === "add" ? "Add" : "Edit"}{" "}
              {formConfig.category}
            </Modal.Title>
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
