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
  BoundingBoxCircles,
  Funnel,
  SortUp,
  SortDown,
} from "react-bootstrap-icons";
import Swal from "sweetalert2";
import { deleteRouteById, fetchRoutesByAgencyId } from "../../api/routeApi";
import {
  deleteCalendarById,
  fetchCalendarsByProjectId,
} from "../../api/calendarApi";
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
import { deleteShape, fetchShapesByTripId } from "../../api/shapeApi";
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
import TripFilterPanel from "./TripFilterPanel.jsx";
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
  const [searchTerms, setSearchTerms] = useState({
    agencies: "",
    routes: "",
    trips: "",
    stops: "",
    calendars: "",
  });
  const [tripTimes, setTripTimes] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [fullTrips, setFullTrips] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const itemsPerPage = 8;

  const categoryMap = {
    0: "agency",
    1: "route",
    2: "calendar",
    3: "trip",
    4: "shape",
    5: "stop",
  };

  const sortTripsByDeparture = (tripsData) => {
    return [...tripsData].sort((a, b) => {
      const timeA = tripTimes[a.trip_id]?.lastDeparture || "00:00:00";
      const timeB = tripTimes[b.trip_id]?.lastDeparture || "00:00:00";
      const [hA, mA, sA] = timeA.split(":").map(Number);
      const [hB, mB, sB] = timeB.split(":").map(Number);
      const secondsA = hA * 3600 + mA * 60 + sA;
      const secondsB = hB * 3600 + mB * 60 + sB;

      return sortDirection === "asc"
        ? secondsA - secondsB
        : secondsB - secondsA;
    });
  };

  const applyTripFiltersAndSort = (tripsToFilter) => {
    let filteredTrips = tripsToFilter;
    if (selectedEntities.calendar && !isFiltered) {
      filteredTrips = filteredTrips.filter(
        (trip) => trip.service_id === selectedEntities.calendar.service_id
      );
    }
    const sortedTrips = sortTripsByDeparture(filteredTrips);
    const paginatedTrips = sortedTrips.slice(
      (pageTrips - 1) * itemsPerPage,
      pageTrips * itemsPerPage
    );
    return { data: paginatedTrips, total: sortedTrips.length };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token && project_id) {
          const agencyData = await fetchAgenciesByProjectId(
            project_id,
            token,
            pageAgencies,
            itemsPerPage,
            searchTerms.agencies
          );
          setAgencies(agencyData);
        }

        if (selectedEntities.agency) {
          const routeData = await fetchRoutesByAgencyId(
            selectedEntities.agency.agency_id,
            project_id,
            token,
            pageRoutes,
            itemsPerPage,
            searchTerms.routes
          );
          setRoutes(routeData);
        }

        if (selectedEntities.route) {
          const [calendarData, routeTrips] = await Promise.all([
            fetchCalendarsByProjectId(project_id, token),
            fetchTripsByRouteId(
              selectedEntities.route.route_id,
              project_id,
              token,
              1,
              9999,
              searchTerms.trips
            ),
          ]);

          setCalendars(
            Array.isArray(calendarData) ? calendarData : calendarData.data || []
          );

          const allTrips = routeTrips.data;
          setFullTrips(allTrips);

          const tripTimesData = {};
          await Promise.all(
            allTrips.map(async (trip) => {
              const stops = await fetchStopsAndStopTimesByTripId(
                trip.trip_id,
                project_id,
                token
              );
              tripTimesData[trip.trip_id] =
                stops.length > 0
                  ? {
                      firstArrival: stops[0].arrival_time,
                      lastDeparture: stops[stops.length - 1].departure_time,
                    }
                  : { firstArrival: null, lastDeparture: null };
            })
          );
          setTripTimes(tripTimesData);

          const updatedTrips = applyTripFiltersAndSort(allTrips);
          setTrips(updatedTrips);
        } else {
          setFullTrips([]);
          setTrips({ data: [], total: 0 });
          setTripTimes({});
          setIsFilterOpen(false);
          setIsFiltered(false);
        }

        if (selectedEntities.trip) {
          const shapesResponse = await fetchShapesByTripId(
            project_id,
            selectedEntities.trip.shape_id,
            token
          );
          setShapes(shapesResponse);

          const stopsResponse = await fetchStopsAndStopTimesByTripId(
            selectedEntities.trip.trip_id,
            project_id,
            token
          );
          setStopsAndTimes(stopsResponse);

          const center = calculateCenter(shapesResponse, stopsResponse);
          if (center) {
            setMapCenter(center);
            setZoom(12);
          }
        } else {
          setShapes([]);
          setStopsAndTimes({ data: [], total: 0 });
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        setAgencies({ data: [], total: 0 });
        setRoutes({ data: [], total: 0 });
        setFullTrips([]);
        setTrips({ data: [], total: 0 });
        setShapes([]);
        setStopsAndTimes({ data: [], total: 0 });
        setTripTimes({});
      }
    };

    fetchData();
  }, [
    token,
    project_id,
    pageAgencies,
    pageRoutes,
    pageTrips,
    searchTerms,
    selectedEntities.agency,
    selectedEntities.route,
    selectedEntities.trip,
    selectedEntities.calendar,
    isFiltered,
    sortDirection,
  ]);

  useEffect(() => {
    if (action) {
      handleAction(action);
      setAction("");
    }
  }, [action]);

  const handleSearch = (category, term) => {
    setSearchTerms({ ...searchTerms, [category]: term });
    if (category === "agencies") setPageAgencies(1);
    if (category === "routes") setPageRoutes(1);
    if (category === "trips") setPageTrips(1);
    if (category === "stops") setPageStops(1);
    if (category === "calendars") setPageCalendars(1);
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
    if (stops && stops.data && stops.data.length > 0) {
      stops.data.forEach((stop) => {
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
          setSelectedCategory("agency");
          setIsFilterOpen(false);
          setIsFiltered(false);
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
          setSelectedCategory("route");
          setIsFiltered(false);
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
          setSelectedCategory("route");
          const updatedTrips = applyTripFiltersAndSort(fullTrips);
          setTrips(updatedTrips);
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            calendar: entity,
            trip: null,
            shape: null,
            stop: null,
          }));
          setSelectedCategory("calendar");
          const updatedTrips = applyTripFiltersAndSort(fullTrips);
          setTrips(updatedTrips);
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
          setSelectedCategory("calendar");
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            trip: entity,
            shape: null,
            stop: null,
          }));
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
        setAgencies((prev) => ({
          ...prev,
          data: prev.data.filter((a) => a.agency_id !== entity.agency_id),
        }));
        setSelectedEntities((prev) => ({
          ...prev,
          agency: null,
          route: null,
          trip: null,
          stop: null,
          shape: null,
        }));
      } else if (category === "route") {
        await deleteRouteById(entity.route_id, token);
        setRoutes((prev) => ({
          ...prev,
          data: prev.data.filter((r) => r.route_id !== entity.route_id),
        }));
        setSelectedEntities((prev) => ({
          ...prev,
          route: null,
          trip: null,
          stop: null,
          shape: null,
        }));
      } else if (category === "trip") {
        await deleteTripById(entity.trip_id, token);
        setFullTrips((prev) =>
          prev.filter((t) => t.trip_id !== entity.trip_id)
        );
        setTrips((prev) => ({
          ...prev,
          data: prev.data.filter((t) => t.trip_id !== entity.trip_id),
          total: prev.total - 1,
        }));
        setSelectedEntities((prev) => ({
          ...prev,
          trip: null,
          stop: null,
          shape: null,
        }));
        setTripTimes((prev) => {
          const newTripTimes = { ...prev };
          delete newTripTimes[entity.trip_id];
          return newTripTimes;
        });
      } else if (category === "stop") {
        await deleteStopTimeById(entity.trip_id, entity.stop_id, token);
        await deleteStopById(entity.stop_id, token);
        setStopsAndTimes((prev) =>
          prev ? prev.filter((s) => s.stop_id !== entity.stop_id) : []
        );
        setSelectedEntities((prev) => ({ ...prev, stop: null }));
      } else if (category === "shape") {
        await deleteShape(entity.shape_id, entity.shape_pt_sequence, token);
        setShapes((prev) =>
          prev.filter((s) => s.shape_pt_sequence !== entity.shape_pt_sequence)
        );
        setSelectedEntities((prev) => ({ ...prev, shape: null }));
      } else if (category === "calendar") {
        await deleteCalendarById(entity.service_id, token);
        setCalendars((prevCalendars) =>
          prevCalendars.filter(
            (calendar) => calendar.service_id !== entity.service_id
          )
        );
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
              route_id={selectedEntities.route.route_id}
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
              agencies={agencies.data}
            />
          );
        case "route":
          return (
            <RouteEditPage
              agencies={agencies.data}
              route_id={entity.route_id}
              routes={routes.data}
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
              routes={routes.data}
              calendars={calendars}
              selectedRoute={selectedEntities.route}
              trips={trips.data}
            />
          );
        case "stop":
          return (
            <StopTimeEditPage
              project_id={project_id}
              trip_id={selectedEntities.trip?.trip_id}
              stop_id={entity.stop_id}
              onClose={() => setFormConfig(null)}
              setStopsAndTimes={setStopsAndTimes}
              stopsAndTimes={stopsAndTimes}
              route_id={selectedEntities.route.route_id}
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

  const renderPagination = (total, currentPage, setCurrentPage) => {
    const totalPages = Math.ceil(total / itemsPerPage);
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

  const isTripInPast = (tripId) => {
    const times = tripTimes[tripId];
    if (!times || !times.lastDeparture) return false;
    const now = new Date();
    const [hours, minutes] = times.lastDeparture.split(":").map(Number);
    const departureTime = new Date();
    departureTime.setHours(hours, minutes, 0, 0);
    return departureTime < now;
  };

  const paginateItems = (items, currentPage) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return items.slice(indexOfFirstItem, indexOfLastItem);
  };

  const toggleSortDirection = (e) => {
    e.stopPropagation();
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    const sortedTrips = sortTripsByDeparture(trips.data);
    setTrips({ data: sortedTrips, total: sortedTrips.length });
  };

  const renderTripsAccordion = () => {
    const paginatedTrips = paginateItems(trips.data, pageTrips);
    return (
      <Accordion.Item eventKey="3">
        <Accordion.Header>
          <BusFront size={20} className="me-2" /> Trips
          {selectedEntities.route && (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFilterOpen((prev) => !prev);
                }}
                className="ms-2 p-0"
                style={{ cursor: "pointer" }}
              >
                <Funnel size={20} />
              </span>
              <span
                onClick={toggleSortDirection}
                className="ms-2 p-0"
                style={{ cursor: "pointer" }}
              >
                {sortDirection === "asc" ? (
                  <SortUp size={20} />
                ) : (
                  <SortDown size={20} />
                )}
              </span>
            </>
          )}
        </Accordion.Header>
        <Accordion.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search trips..."
              value={searchTerms.trips}
              onChange={(e) => handleSearch("trips", e.target.value)}
            />
          </Form.Group>
          {paginatedTrips.length > 0 ? (
            paginatedTrips.map((trip) => {
              const times = tripTimes[trip.trip_id] || {
                firstArrival: null,
                lastDeparture: null,
              };
              const calendar = calendars.find(
                (cal) => cal.service_id === trip.service_id
              );
              const activeDays = getActiveDays(calendar);
              return (
                <Card
                  key={trip.trip_id}
                  className={`mb-2 item-card ${
                    selectedEntities.trip?.trip_id === trip.trip_id
                      ? "active"
                      : ""
                  } ${isTripInPast(trip.trip_id) ? "past-trip" : ""}`}
                  onClick={() => handleSelectionChange("trip", trip)}
                >
                  <Card.Body className="d-flex align-items-center p-2">
                    {trip.direction_id === 0 ? (
                      <ArrowDownLeft className="me-2" />
                    ) : (
                      <ArrowUpRight className="me-2" />
                    )}
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip(
                        trip.trip_headsign || trip.trip_id
                      )}
                    >
                      <div className="d-flex flex-column">
                        <span className="item-title">
                          {trip.trip_headsign || trip.trip_id}
                        </span>
                        <span className="trip-times">
                          {times.firstArrival && times.lastDeparture
                            ? `${times.firstArrival} - ${times.lastDeparture}`
                            : "No times available"}{" "}
                          {activeDays !== "N/A" && `(${activeDays})`}
                        </span>
                      </div>
                    </OverlayTrigger>
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
          {renderPagination(trips.total, pageTrips, setPageTrips)}
        </Accordion.Body>
      </Accordion.Item>
    );
  };

  return (
    <div className="sidebar-container d-flex">
      <div className={`new-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <Accordion
          activeKey={activeKey}
          onSelect={(key) => {
            setActiveKey(key);
            setSelectedCategory(categoryMap[key]);
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
                  onChange={(e) => handleSearch("agencies", e.target.value)}
                />
              </Form.Group>
              {agencies.data && agencies.data.length > 0 ? (
                agencies.data.map((agency) => (
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
              {renderPagination(agencies.total, pageAgencies, setPageAgencies)}
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
                  onChange={(e) => handleSearch("routes", e.target.value)}
                />
              </Form.Group>
              {routes.data && routes.data.length > 0 ? (
                routes.data.map((route) => (
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
              {renderPagination(routes.total, pageRoutes, setPageRoutes)}
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
                  onChange={(e) => handleSearch("calendars", e.target.value)}
                />
              </Form.Group>
              {calendars.length > 0 ? (
                calendars.map((cal) => (
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
                calendars.length,
                pageCalendars,
                setPageCalendars
              )}
            </Accordion.Body>
          </Accordion.Item>

          {renderTripsAccordion()}

          <Accordion.Item eventKey="4">
            <Accordion.Header>
              <BoundingBoxCircles size={20} className="me-2" /> Shapes
            </Accordion.Header>
            <Accordion.Body>
              {shapes.length > 0 ? (
                paginateItems(shapes, pageShapes).map((shape) => (
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
              {renderPagination(shapes.length, pageShapes, setPageShapes)}
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
                  placeholder="Search stops by name..."
                  value={searchTerms.stops}
                  onChange={(e) => handleSearch("stops", e.target.value)}
                />
              </Form.Group>
              {stopsAndTimes && stopsAndTimes.length > 0 ? (
                paginateItems(
                  stopsAndTimes.sort(
                    (a, b) => a.stop_sequence - b.stop_sequence
                  ),
                  pageStops
                ).map((stop) => (
                  <Card
                    key={`${stop.trip_id}-${stop.stop_sequence}`}
                    className={`mb-2 item-card ${
                      selectedEntities.stop?.stop_id === stop.stop_id
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleSelectionChange("stop", stop)}
                  >
                    <Card.Body className="d-flex align-items-center p-2">
                      <div className="flex-grow-1">
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip(
                            stop.stop_name || stop.stop_id
                          )}
                        >
                          <div className="d-flex flex-column">
                            <div className="item-title">
                              {stop.stop_name || stop.stop_id}
                            </div>
                            <div style={{ fontSize: "0.8em" }}>
                              {stop.departure_time !== "N/A" &&
                              stop.arrival_time !== "N/A"
                                ? `${stop.departure_time} - ${stop.arrival_time}`
                                : "N/A"}
                            </div>
                          </div>
                        </OverlayTrigger>
                      </div>
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
              {renderPagination(stopsAndTimes.length, pageStops, setPageStops)}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
      {isFilterOpen && selectedEntities.route && (
        <TripFilterPanel
          calendars={calendars}
          tripTimes={tripTimes}
          setTrips={(newTrips) => {
            setTrips(newTrips);
            setPageTrips(1); // Filtreleme sonrası ilk sayfaya dön
          }}
          setIsFiltered={setIsFiltered}
          fullTrips={fullTrips}
          onClose={() => {
            setIsFilterOpen(false);
            setIsFiltered(false);
            const updatedTrips = applyTripFiltersAndSort(fullTrips);
            setTrips(updatedTrips);
            setPageTrips(1); // Kapatıldığında da ilk sayfaya dön
          }}
        />
      )}
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
  routes: PropTypes.object.isRequired,
  setRoutes: PropTypes.func.isRequired,
  trips: PropTypes.object.isRequired,
  setTrips: PropTypes.func.isRequired,
  stopsAndTimes: PropTypes.object.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  calendars: PropTypes.array.isRequired,
  setCalendars: PropTypes.func.isRequired,
  agencies: PropTypes.object.isRequired,
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
  selectedEntities: PropTypes.shape({
    agency: PropTypes.object,
    route: PropTypes.object,
    calendar: PropTypes.object,
    trip: PropTypes.object,
    shape: PropTypes.object,
    stop: PropTypes.object,
  }).isRequired,
  setSelectedEntities: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
};

export default Sidebar;
