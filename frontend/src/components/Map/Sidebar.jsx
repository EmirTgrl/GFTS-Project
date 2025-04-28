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
  Button,
  Collapse,
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
  Funnel,
  SortUp,
  SortDown,
  PlusLg,
  Pencil,
  Trash,
  CashStack,
  ChevronDown,
  ChevronUp,
} from "react-bootstrap-icons";
import Swal from "sweetalert2";
import {
  deleteRouteById,
  fetchRoutesByAgencyId,
  fetchRoutesByProjectId,
} from "../../api/routeApi";
import {
  deleteCalendarById,
  fetchCalendarsByProjectId,
} from "../../api/calendarApi";
import {
  fetchAgenciesByProjectId,
  deleteAgencyById,
} from "../../api/agencyApi";
import {
  deleteTripById,
  fetchTripsByProjectId,
  fetchTripsByRouteId,
  copyTripWithOffset,
} from "../../api/tripApi";
import {
  fetchStopsAndStopTimesByTripId,
  deleteStopTimeById,
} from "../../api/stopTimeApi";
import { deleteStopById, fetchStopsByProjectId } from "../../api/stopApi";
import { deleteShape, fetchShapesByTripId } from "../../api/shapeApi";
import { fetchDetailedFareForRoute } from "../../api/fareApi.js";
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
// import FareAddPage from "../../pages/FareAddPage";
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
  activeKey,
  setActiveKey,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pageAgencies, setPageAgencies] = useState(1);
  const [pageRoutes, setPageRoutes] = useState(1);
  const [pageTrips, setPageTrips] = useState(1);
  const [pageStops, setPageStops] = useState(1);
  const [pageCalendars, setPageCalendars] = useState(1);
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
  const [fareDetails, setFareDetails] = useState(null);
  const [expandedFare, setExpandedFare] = useState(null);
  const [expandedTransfer, setExpandedTransfer] = useState(null);
  const itemsPerPage = 8;

  const categoryMap = {
    0: "agency",
    1: "route",
    2: "calendar",
    3: "trip",
    4: "shape",
    5: "stop",
    6: "fare",
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
    let filteredTrips = [...tripsToFilter];
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
        if (!token || !project_id) return;

        const agencyData = await fetchAgenciesByProjectId(
          project_id,
          token,
          pageAgencies,
          itemsPerPage,
          searchTerms.agencies
        );
        setAgencies(agencyData);

        let routeData;
        if (selectedEntities.agency) {
          routeData = await fetchRoutesByAgencyId(
            selectedEntities.agency.agency_id,
            project_id,
            token,
            pageRoutes,
            itemsPerPage,
            searchTerms.routes
          );
        } else {
          routeData = await fetchRoutesByProjectId(
            project_id,
            token,
            pageRoutes,
            itemsPerPage,
            searchTerms.routes
          );
        }
        setRoutes(routeData);

        const calendarData = await fetchCalendarsByProjectId(
          project_id,
          token,
          pageCalendars,
          itemsPerPage
        );
        setCalendars(calendarData);

        if (isFiltered) {
          console.log(
            "Skipping fetch due to filtering, using current trips:",
            trips
          );
          return;
        }

        let tripResponse;
        if (selectedEntities.route) {
          tripResponse = await fetchTripsByRouteId(
            selectedEntities.route.route_id,
            project_id,
            token,
            pageTrips,
            itemsPerPage,
            searchTerms.trips
          );
        } else {
          tripResponse = await fetchTripsByProjectId(
            project_id,
            token,
            pageTrips,
            itemsPerPage,
            searchTerms.trips
          );
        }

        const allTrips = tripResponse.data || [];
        const totalTrips = tripResponse.total || allTrips.length;
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
                    firstArrival: stops[0].arrival_time || "N/A",
                    lastDeparture:
                      stops[stops.length - 1].departure_time || "N/A",
                  }
                : { firstArrival: "N/A", lastDeparture: "N/A" };
          })
        );
        setTripTimes(tripTimesData);

        let filteredTrips = [...allTrips];
        if (selectedEntities.calendar && !isFiltered) {
          filteredTrips = filteredTrips.filter(
            (trip) => trip.service_id === selectedEntities.calendar.service_id
          );
        }

        const sortedTrips = sortTripsByDeparture(filteredTrips);
        setTrips({
          data: sortedTrips,
          total: totalTrips,
        });

        if (!selectedEntities.trip) {
          const stopsResponse = await fetchStopsByProjectId(
            project_id,
            token,
            pageStops,
            itemsPerPage,
            searchTerms.stops || ""
          );
          setStopsAndTimes(stopsResponse.data || stopsResponse || []);
          setShapes([]);
        }

        if (selectedEntities.route) {
          const fareResponse = await fetchDetailedFareForRoute(
            selectedEntities.route.route_id,
            project_id,
            token
          );
          setFareDetails(fareResponse || null);
        } else {
          setFareDetails(null);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        setAgencies({ data: [], total: 0 });
        setRoutes({ data: [], total: 0 });
        setCalendars([]);
        setFullTrips([]);
        setTrips({ data: [], total: 0 });
        setShapes([]);
        setStopsAndTimes([]);
        setTripTimes({});
        setFareDetails(null);
      }
    };

    fetchData();
  }, [
    token,
    project_id,
    pageAgencies,
    pageRoutes,
    pageTrips,
    pageStops,
    itemsPerPage,
    searchTerms.agencies,
    searchTerms.routes,
    searchTerms.trips,
    searchTerms.stops,
    selectedEntities.agency,
    selectedEntities.route,
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
    } else if (actionType === "copy") {
      if (selectedEntities.trip) {
        handleCopy(selectedEntities.trip);
      }
    }
  };

  const handleCopy = async (trip) => {
    Swal.fire({
      title: "Copy Trip",
      text: "Enter the offset (in minutes) to be applied to all stop times:",
      input: "number",
      showCancelButton: true,
      confirmButtonText: "Copy",
      cancelButtonText: "Cancel",
      showLoaderOnConfirm: true,
      preConfirm: (offset) => {
        if (offset === "" || isNaN(offset)) {
          Swal.showValidationMessage("Please enter a valid number.");
          return false;
        }
        return Number(offset);
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then(async (result) => {
      if (result.isConfirmed) {
        const offsetMinutes = result.value;
        try {
          const copyResult = await copyTripWithOffset(
            trip.trip_id,
            offsetMinutes,
            token
          );
          const newTrip = copyResult.trip;
          const newStopTimes = copyResult.stop_times || [];

          const enrichedStopTimes = newStopTimes
            .map((stopTime) => {
              const originalStop = stopsAndTimes.find(
                (s) => s.stop_id === stopTime.stop_id
              );
              return {
                ...stopTime,
                stop_lat: stopTime.stop_lat || originalStop?.stop_lat || 0,
                stop_lon: stopTime.stop_lon || originalStop?.stop_lon || 0,
              };
            })
            .sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));

          setFullTrips((prev) => [...prev, newTrip]);
          const updatedTrips = applyTripFiltersAndSort([...fullTrips, newTrip]);
          setTrips(updatedTrips);

          if (enrichedStopTimes.length > 0) {
            setTripTimes((prev) => ({
              ...prev,
              [newTrip.trip_id]: {
                firstArrival: enrichedStopTimes[0].arrival_time || "N/A",
                lastDeparture:
                  enrichedStopTimes[enrichedStopTimes.length - 1]
                    .departure_time || "N/A",
              },
            }));
          }

          if (selectedEntities.trip?.trip_id === trip.trip_id) {
            setStopsAndTimes(enrichedStopTimes);
            setSelectedEntities((prev) => ({
              ...prev,
              trip: newTrip,
            }));
          }

          Swal.fire(
            "Copied!",
            `Trip copied with an offset of ${offsetMinutes} minutes. New times: ${
              enrichedStopTimes[0]?.arrival_time || "N/A"
            } - ${
              enrichedStopTimes[enrichedStopTimes.length - 1]?.departure_time ||
              "N/A"
            }`,
            "success"
          );
        } catch (error) {
          console.error("Error copying trip:", error);
          Swal.fire("Error!", `Failed to copy trip: ${error.message}`, "error");
        }
      }
    });
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
        const currentAgencyId = String(selectedEntities.agency?.agency_id);
        const clickedAgencyId = String(entity.agency_id);
        if (currentAgencyId === clickedAgencyId) {
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
          setActiveKey("0");
          setFareDetails(null);
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
          setActiveKey("0");
          setIsFilterOpen(false);
          setIsFiltered(false);
          setFareDetails(null);
        }
        break;
      }
      case "route": {
        const currentRouteId = String(selectedEntities.route?.route_id);
        const clickedRouteId = String(entity.route_id);
        if (currentRouteId === clickedRouteId) {
          setSelectedEntities((prev) => ({
            ...prev,
            route: null,
            trip: null,
            shape: null,
            stop: null,
          }));
          setSelectedCategory("agency");
          setActiveKey("1");
          setFareDetails(null);
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            route: entity,
            trip: null,
            shape: null,
            stop: null,
          }));
          setSelectedCategory("route");
          setActiveKey("1");
          setIsFilterOpen(false);
          setIsFiltered(false);
          setFareDetails(null);
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
          setActiveKey("2");
          const updatedTrips = applyTripFiltersAndSort(fullTrips);
          setTrips(updatedTrips);
          setFareDetails(null);
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            calendar: entity,
            trip: null,
            shape: null,
            stop: null,
          }));
          setSelectedCategory("calendar");
          setActiveKey("2");
          const updatedTrips = applyTripFiltersAndSort(fullTrips);
          setTrips(updatedTrips);
          setFareDetails(null);
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
          setActiveKey("3");
          setShapes([]);
          setStopsAndTimes([]);
          setFareDetails(null);
        } else {
          setSelectedEntities((prev) => ({
            ...prev,
            trip: entity,
            shape: null,
            stop: null,
          }));
          setSelectedCategory("trip");
          setActiveKey("3");

          try {
            // Yolculuğa ait şekilleri çek
            const shapesResponse = await fetchShapesByTripId(
              project_id,
              entity.shape_id,
              token
            );
            setShapes(shapesResponse || []);

            // Yolculuğa ait durakları ve durak zamanlarını çek
            const stopsResponse = await fetchStopsAndStopTimesByTripId(
              entity.trip_id,
              project_id,
              token
            );
            setStopsAndTimes(stopsResponse || []);

            // Yolculuğa ait ücret detaylarını çek
            const fareResponse = await fetchDetailedFareForRoute(
              entity.route_id,
              project_id,
              token
            );
            setFareDetails(fareResponse || null);

            // Harita merkezini ayarla
            const center = calculateCenter(shapesResponse, stopsResponse);
            if (center) {
              setMapCenter(center);
              setZoom(12);
            }
          } catch (error) {
            console.error("Trip seçilirken veriler yüklenemedi:", error);
            setShapes([]);
            setStopsAndTimes([]);
            setFareDetails(null);
            Swal.fire(
              "Hata",
              "Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.",
              "error"
            );
          }
        }
        break;
      }
      case "shape": {
        if (
          selectedEntities.shape?.shape_pt_sequence === entity.shape_pt_sequence
        ) {
          setSelectedEntities((prev) => ({ ...prev, shape: null }));
          setSelectedCategory("trip");
          setActiveKey("4");
          setFareDetails(null);
        } else {
          setSelectedEntities((prev) => ({ ...prev, shape: entity }));
          setSelectedCategory("shape");
          setActiveKey("4");
          if (entity.shape_pt_lat && entity.shape_pt_lon) {
            setMapCenter([
              parseFloat(entity.shape_pt_lat),
              parseFloat(entity.shape_pt_lon),
            ]);
            setZoom(18);
          }
          setFareDetails(null);
        }
        break;
      }
      case "stop": {
        if (selectedEntities.stop?.stop_id === entity.stop_id) {
          setSelectedEntities((prev) => ({ ...prev, stop: null }));
          setSelectedCategory("trip");
          setActiveKey("5");
          setFareDetails(null);
        } else {
          setSelectedEntities((prev) => ({ ...prev, stop: entity }));
          setSelectedCategory("stop");
          setActiveKey("5");
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
      case "fare": {
        setFormConfig({ action: "add", category: "fare" });
        setSelectedCategory("fare");
        setActiveKey("6");
        break;
      }
      default:
        break;
    }
  };

  const handleDelete = async (category, entity) => {
    const entityName =
      category === "agency"
        ? entity.agency_name
        : category === "route"
        ? entity.route_long_name || entity.route_id
        : category === "trip"
        ? entity.trip_headsign || entity.trip_id
        : category === "stop"
        ? entity.stop_name || entity.stop_id
        : category === "shape"
        ? `Sequence ${entity.shape_pt_sequence}`
        : category === "calendar"
        ? getActiveDays(entity)
        : category;

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } "${entityName}" silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
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
          setFareDetails(null);
        } else if (category === "stop") {
          await deleteStopTimeById(entity.trip_id, entity.stop_id, token);
          await deleteStopById(entity.stop_id, token);
          setStopsAndTimes((prev) =>
            prev ? prev.filter((s) => s.stop_id !== entity.stop_id) : []
          );
          setSelectedEntities((prev) => ({ ...prev, stop: null }));
          setFareDetails(null);
        } else if (category === "shape") {
          await deleteShape(entity.shape_id, entity.shape_pt_sequence, token);
          setShapes((prev) =>
            prev.filter((s) => s.shape_pt_sequence !== entity.shape_pt_sequence)
          );
          setSelectedEntities((prev) => ({ ...prev, shape: null }));
          setFareDetails(null);
        } else if (category === "calendar") {
          await deleteCalendarById(entity.service_id, token);
          setCalendars((prevCalendars) =>
            prevCalendars.filter(
              (calendar) => calendar.service_id !== entity.service_id
            )
          );
          setFareDetails(null);
        }
        Swal.fire("Silindi!", `${category} başarıyla silindi.`, "success");
      } catch (error) {
        console.error("Error deleting entity:", error);
        Swal.fire("Hata", `${category} silinirken bir hata oluştu.`, "error");
      }
    } else {
      Swal.fire("İptal Edildi", `${category} silinmedi.`, "info");
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
              calendars={calendars.data || []}
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
        // case "fare":
        //   return (
        //     <FareAddPage
        //       project_id={project_id}
        //       trip_id={selectedEntities.trip?.trip_id}
        //       onClose={() => setFormConfig(null)}
        //       onFareAdded={async () => {
        //         try {
        //           const fareResponse = await fetchDetailedFareForTrip(
        //             selectedEntities.trip.trip_id,
        //             project_id,
        //             token
        //           );
        //           setFareDetails(fareResponse || null);
        //         } catch (error) {
        //           console.error("Ücret güncellenemedi:", error);
        //           Swal.fire("Hata", "Ücret bilgileri güncellenemedi.", "error");
        //         }
        //       }}
        //     />
        //   );
        // default:
        //   return null;
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
              calendars={calendars.data || []}
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
              calendars={calendars.data || []}
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

  const renderActionButtons = (category) => {
    const isSelected = selectedEntities[category] != null;
    return (
      <div className="action-buttons-container">
        <div className="overlay-trigger-wrapper">
          <OverlayTrigger
            placement="top"
            overlay={renderTooltip(`Add ${category}`, `add-${category}`)}
          >
            <div
              className="sidebar-action-btn add-btn custom-action-icon"
              onClick={(e) => {
                e.stopPropagation();
                setActiveKey(
                  Object.keys(categoryMap).find(
                    (key) => categoryMap[key] === category
                  )
                );
                setSelectedCategory(category);
                setAction("add");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setActiveKey(
                    Object.keys(categoryMap).find(
                      (key) => categoryMap[key] === category
                    )
                  );
                  setSelectedCategory(category);
                  setAction("add");
                }
              }}
            >
              <PlusLg size={16} />
            </div>
          </OverlayTrigger>
        </div>
        {isSelected && (
          <>
            <div className="overlay-trigger-wrapper">
              <OverlayTrigger
                placement="top"
                overlay={renderTooltip(`Edit ${category}`, `edit-${category}`)}
              >
                <div
                  className="sidebar-action-btn edit-btn custom-action-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAction("edit");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setAction("edit");
                    }
                  }}
                >
                  <Pencil size={16} />
                </div>
              </OverlayTrigger>
            </div>
            <div className="overlay-trigger-wrapper">
              <OverlayTrigger
                placement="top"
                overlay={renderTooltip(
                  `Delete ${category}`,
                  `delete-${category}`
                )}
              >
                <div
                  className="sidebar-action-btn delete-btn custom-action-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAction("delete");
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setAction("delete");
                    }
                  }}
                >
                  <Trash size={16} />
                </div>
              </OverlayTrigger>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTripsAccordion = () => {
    const tripData = trips.data || [];

    return (
      <Accordion.Item eventKey="3">
        <Accordion.Header>
          <BusFront size={20} className="me-2" /> Trips
          {renderActionButtons("trip")}
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
          {tripData.length > 0 ? (
            tripData.map((trip) => {
              const times = tripTimes[trip.trip_id] || {
                firstArrival: "N/A",
                lastDeparture: "N/A",
              };
              const calendar = calendars.data.find(
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
                    {trip.direction_id === "0" ? (
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
                          {`${times.firstArrival} - ${times.lastDeparture}`}{" "}
                          {activeDays !== "N/A" && `(${activeDays})`}
                        </span>
                      </div>
                    </OverlayTrigger>
                  </Card.Body>
                </Card>
              );
            })
          ) : (
            <p className="text-muted text-center">No trips found.</p>
          )}
          {renderPagination(trips.total || 0, pageTrips, setPageTrips)}
        </Accordion.Body>
      </Accordion.Item>
    );
  };

  const renderFareAccordion = () => {
    const toggleFareExpand = (index) => {
      setExpandedFare(expandedFare === index ? null : index);
    };

    const toggleTransferExpand = (index) => {
      setExpandedTransfer(expandedTransfer === index ? null : index);
    };

    const getTransferCategory = (transferRule) => {
      if (!fareDetails.fixed_fares) return "Belirtilmemiş";
      const relatedFareRule = fareDetails.fixed_fares.find(
        (rule) =>
          rule.leg_group_id === transferRule.from_leg_group_id ||
          rule.leg_group_id === transferRule.to_leg_group_id
      );
      return relatedFareRule?.rider_category_name || "Belirtilmemiş";
    };

    return (
      <Accordion.Item eventKey="6">
        <Accordion.Header>
          <CashStack size={20} className="me-2" /> Fares
          {selectedEntities.route && renderActionButtons("fare")}
        </Accordion.Header>
        <Accordion.Body>
          {selectedEntities.route ? (
            fareDetails ? (
              <div>
                {/* Hat Bilgileri */}
                <div className="mb-4 border-bottom pb-2">
                  <h6 className="mb-3">Hat Bilgileri</h6>
                  <div className="mb-2">
                    <strong>Hat:</strong>{" "}
                    {fareDetails.route_name || "Belirtilmemiş"}
                  </div>
                  <div className="mb-2">
                    <strong>Ağ:</strong>{" "}
                    {fareDetails.network_name || "Bilinmeyen Ağ"}
                  </div>
                </div>

                {/* İndi-Bindi Ücretlendirme */}
                <div className="mb-4">
                  <h6 className="mb-3">Normal Ücretlendirme</h6>
                  {fareDetails.fixed_fares &&
                  fareDetails.fixed_fares.length > 0 ? (
                    fareDetails.fixed_fares.map((fare, index) => (
                      <div key={index} className="mb-2">
                        <Card
                          className="fare-card"
                          onClick={() => toggleFareExpand(index)}
                          style={{
                            cursor: "pointer",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                          }}
                        >
                          <Card.Body className="p-2 d-flex justify-content-between align-items-center">
                            <div>
                              <strong>
                                {fare.rider_category_name || "Belirtilmemiş"}
                              </strong>{" "}
                              -{" "}
                              {fare.amount
                                ? `${fare.amount} ${fare.currency}`
                                : "N/A"}
                            </div>
                            {expandedFare === index ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Card.Body>
                        </Card>
                        <Collapse in={expandedFare === index}>
                          <div
                            className="fare-details p-2"
                            style={{
                              backgroundColor: "#f9f9f9",
                              borderRadius: "0 0 8px 8px",
                              border: "1px solid #e0e0e0",
                              borderTop: "none",
                            }}
                          >
                            <div className="mb-1">
                              <strong>Ödeme Yöntemi:</strong>{" "}
                              {fare.fare_media_name || "Belirtilmemiş"}
                            </div>
                            <div className="mb-1">
                              <strong>Zaman Aralığı:</strong>{" "}
                              {fare.start_time && fare.end_time
                                ? `${fare.start_time} - ${fare.end_time}`
                                : "Tüm gün"}
                            </div>
                            <div className="mb-1">
                              <strong>Başlangıç Alanı:</strong>{" "}
                              {fare.from_area_name || "Belirtilmemiş"}
                            </div>
                            <div className="mb-1">
                              <strong>Bitiş Alanı:</strong>{" "}
                              {fare.to_area_name || "Belirtilmemiş"}
                            </div>
                          </div>
                        </Collapse>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">
                      Bu hat için indi-bindi ücret kuralı tanımlanmamış.
                    </p>
                  )}
                </div>

                {/* Mesafeye Dayalı Ücretlendirme */}
                <div className="mb-4">
                  <h6 className="mb-3">
                    Mesafeye Dayalı Ücretlendirme (Gittiğin Kadar Öde)
                  </h6>
                  {fareDetails.distance_based_fares &&
                  fareDetails.distance_based_fares.length > 0 ? (
                    fareDetails.distance_based_fares.map((fare, index) => (
                      <div key={index} className="mb-2">
                        <Card
                          className="fare-card"
                          onClick={() => toggleFareExpand(`distance-${index}`)}
                          style={{
                            cursor: "pointer",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                          }}
                        >
                          <Card.Body className="p-2 d-flex justify-content-between align-items-center">
                            <div>
                              <strong>
                                {fare.rider_category_name || "Belirtilmemiş"}
                              </strong>{" "}
                              -{" "}
                              {fare.amount
                                ? `${fare.amount} ${fare.currency}`
                                : "N/A"}{" "}
                              ({fare.from_area_name || "Belirtilmemiş"} →{" "}
                              {fare.to_area_name || "Belirtilmemiş"})
                            </div>
                            {expandedFare === `distance-${index}` ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Card.Body>
                        </Card>
                        <Collapse in={expandedFare === `distance-${index}`}>
                          <div
                            className="fare-details p-2"
                            style={{
                              backgroundColor: "#f9f9f9",
                              borderRadius: "0 0 8px 8px",
                              border: "1px solid #e0e0e0",
                              borderTop: "none",
                            }}
                          >
                            <div className="mb-1">
                              <strong>Ücret Ürünü:</strong>{" "}
                              {fare.fare_product_name || "Belirtilmemiş"}
                            </div>
                            <div className="mb-1">
                              <strong>Başlangıç Alanı:</strong>{" "}
                              {fare.from_area_name || "Belirtilmemiş"}
                            </div>
                            <div className="mb-1">
                              <strong>Bitiş Alanı:</strong>{" "}
                              {fare.to_area_name || "Belirtilmemiş"}
                            </div>
                            <div className="mb-1">
                              <strong>Not:</strong> Bu ücret, gidilen mesafeye
                              göre hesaplanır.
                            </div>
                          </div>
                        </Collapse>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">
                      Bu hat için mesafeye dayalı ücret kuralı tanımlanmamış.
                    </p>
                  )}
                </div>

                {/* Transfer Ücret Kuralları */}
                <div className="mb-4">
                  <h6 className="mb-3">Transfer Ücret Kuralları</h6>
                  {fareDetails.transfer_rules &&
                  fareDetails.transfer_rules.length > 0 ? (
                    fareDetails.transfer_rules.map((rule, index) => (
                      <div key={index} className="mb-2">
                        <Card
                          className="transfer-card"
                          onClick={() => toggleTransferExpand(index)}
                          style={{
                            cursor: "pointer",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                          }}
                        >
                          <Card.Body className="p-2 d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{getTransferCategory(rule)}</strong> -{" "}
                              {rule.transfer_amount
                                ? `${rule.transfer_amount} ${rule.transfer_currency}`
                                : "Ücretsiz"}
                            </div>
                            {expandedTransfer === index ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Card.Body>
                        </Card>
                        <Collapse in={expandedTransfer === index}>
                          <div
                            className="transfer-details p-2"
                            style={{
                              backgroundColor: "#f9f9f9",
                              borderRadius: "0 0 8px 8px",
                              border: "1px solid #e0e0e0",
                              borderTop: "none",
                            }}
                          >
                            <div className="mb-1">
                              <strong>Nereden:</strong>{" "}
                              {`${rule.from_network_name || "Belirtilmemiş"} (${
                                rule.from_stop_name || "Bilinmeyen Durak"
                              } → ${
                                rule.from_to_stop_name || "Bilinmeyen Durak"
                              })`}
                            </div>
                            <div className="mb-1">
                              <strong>Nereye:</strong>{" "}
                              {`${rule.to_network_name || "Belirtilmemiş"} (${
                                rule.to_from_stop_name || "Bilinmeyen Durak"
                              } → ${rule.to_stop_name || "Bilinmeyen Durak"})`}
                            </div>
                            <div className="mb-1">
                              <strong>Transfer Sayısı:</strong>{" "}
                              {rule.transfer_count || "1"}
                            </div>
                            <div className="mb-1">
                              <strong>Süre Limiti:</strong>{" "}
                              {rule.duration_limit
                                ? `${rule.duration_limit / 60} dakika`
                                : "Sınırsız"}
                            </div>
                            <div className="mb-1">
                              <strong>Süre Türü:</strong>{" "}
                              {rule.duration_limit_type || "Belirtilmemiş"}
                            </div>
                            <div className="mb-1">
                              <strong>Transfer Türü:</strong>{" "}
                              {rule.fare_transfer_type || "Belirtilmemiş"}
                            </div>
                          </div>
                        </Collapse>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">
                      Bu hat için transfer kuralı tanımlanmamış.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted">
                  Bu hat için ücret bilgisi bulunamadı.
                </p>
                <Button
                  variant="primary"
                  onClick={() => handleSelectionChange("fare", {})}
                >
                  Ücret Kuralı Ekle
                </Button>
              </div>
            )
          ) : (
            <p className="text-muted text-center">Lütfen bir hat seçin.</p>
          )}
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
              {renderActionButtons("agency")}
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
              {renderActionButtons("route")}
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
              {renderActionButtons("calendar")}
            </Accordion.Header>
            <Accordion.Body>
              {calendars.data && calendars.data.length > 0 ? (
                calendars.data.map((cal) => (
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
                calendars.total || 0,
                pageCalendars,
                setPageCalendars
              )}
            </Accordion.Body>
          </Accordion.Item>

          {renderTripsAccordion()}

          {renderFareAccordion()}

          <Accordion.Item eventKey="5">
            <Accordion.Header>
              <Clock size={20} className="me-2" /> Stops
              {renderActionButtons("stop")}
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
                    (a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0)
                  ),
                  pageStops
                ).map((stop) => (
                  <Card
                    key={`${stop.trip_id || "no-trip"}-${
                      stop.stop_sequence || stop.stop_id
                    }`}
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
                            {selectedEntities.trip && (
                              <div style={{ fontSize: "0.8em" }}>
                                {stop.departure_time && stop.arrival_time
                                  ? `${stop.arrival_time} - ${stop.departure_time}`
                                  : "N/A"}
                              </div>
                            )}
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
                    : "All stops in the project."}
                </p>
              )}
              {renderPagination(stopsAndTimes.length, pageStops, setPageStops)}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
      {isFilterOpen && selectedEntities.route && (
        <TripFilterPanel
          calendars={calendars.data || []}
          tripTimes={tripTimes}
          setTrips={(newTrips) => {
            setTrips(newTrips);
            setPageTrips(1);
          }}
          setIsFiltered={setIsFiltered}
          fullTrips={fullTrips}
          onClose={() => {
            setIsFilterOpen(false);
            setIsFiltered(false);
            const updatedTrips = applyTripFiltersAndSort(fullTrips);
            setTrips(updatedTrips);
            setPageTrips(1);
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
  stopsAndTimes: PropTypes.array.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  calendars: PropTypes.object.isRequired,
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
  activeKey: PropTypes.string.isRequired,
  setActiveKey: PropTypes.func.isRequired,
};

export default Sidebar;
