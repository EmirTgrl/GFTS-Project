import PropTypes from "prop-types";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import "../../styles/BreadcrumbBar.css";
import React from "react";

const BreadcrumbBar = ({
  selectedEntities,
  setSelectedEntities,
  setActiveKey,
  trips,
  setPageTrips,
  itemsPerPage,
  isFilterOpen,
}) => {
  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text}`} className="custom-tooltip">
      {text || "N/A"}
    </Tooltip>
  );

  const handleBreadcrumbClick = (category, item) => {
    switch (category) {
      case "agency":
        setSelectedEntities({
          agency: item,
          route: null,
          calendar: null,
          trip: null,
          stop: null,
        });
        setActiveKey("0");
        break;
      case "route":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: item,
          calendar: null,
          trip: null,
          stop: null,
        });
        setActiveKey("1");
        break;
      case "calendar":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: item,
          trip: null,
          stop: null,
        });
        setActiveKey("2");
        break;
      case "trip":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: selectedEntities.calendar,
          trip: item,
          stop: null,
        });
        setActiveKey("3");
        if (item && trips.data) {
          const tripIndex = trips.data.findIndex(
            (t) => t.trip_id === item.trip_id
          );
          if (tripIndex !== -1) {
            const page = Math.floor(tripIndex / itemsPerPage) + 1;
            setPageTrips(page);
          }
        }
        break;
      case "stop":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: selectedEntities.calendar,
          trip: selectedEntities.trip,
          shape: selectedEntities.shape,
          stop: item,
        });
        setActiveKey("5");
        break;
      default:
        break;
    }
  };

  const truncateText = (text, maxLength = 12) => {
    if (!text || typeof text !== "string") return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const formatCalendarDays = (calendar) => {
    if (!calendar) return "N/A";

    const days = [
      { key: "monday", label: "Pzt", value: calendar.monday },
      { key: "tuesday", label: "Sal", value: calendar.tuesday },
      { key: "wednesday", label: "Çar", value: calendar.wednesday },
      { key: "thursday", label: "Per", value: calendar.thursday },
      { key: "friday", label: "Cum", value: calendar.friday },
      { key: "saturday", label: "Cmt", value: calendar.saturday },
      { key: "sunday", label: "Paz", value: calendar.sunday },
    ];

    const activeDays = days
      .filter((day) => day.value === "1")
      .map((day) => day.label);

    if (activeDays.length === 7) {
      return "Her Gün";
    } else if (
      activeDays.length === 5 &&
      activeDays.every((day) =>
        ["Pzt", "Sal", "Çar", "Per", "Cum"].includes(day)
      )
    ) {
      return "Hafta İçi";
    } else if (
      activeDays.length === 2 &&
      activeDays.includes("Cmt") &&
      activeDays.includes("Paz")
    ) {
      return "Hafta Sonu";
    } else if (activeDays.length > 0) {
      return activeDays.join("-");
    } else {
      return calendar.service_id || "N/A";
    }
  };

  const breadcrumbItems = [];
  if (selectedEntities.agency) {
    breadcrumbItems.push({
      label: truncateText(selectedEntities.agency?.agency_name),
      fullLabel:
        selectedEntities.agency?.agency_name ||
        selectedEntities.agency?.agency_id ||
        "Unknown Agency",
      category: "agency",
      entity: selectedEntities.agency,
    });
  }
  if (selectedEntities.route) {
    breadcrumbItems.push({
      label: truncateText(
        selectedEntities.route?.route_long_name ||
          selectedEntities.route?.route_id
      ),
      fullLabel:
        selectedEntities.route?.route_long_name ||
        selectedEntities.route?.route_id ||
        "Unknown Route",
      category: "route",
      entity: selectedEntities.route,
    });
  }
  if (selectedEntities.calendar) {
    const calendarLabel = formatCalendarDays(selectedEntities.calendar);
    breadcrumbItems.push({
      label: truncateText(calendarLabel),
      fullLabel: calendarLabel,
      category: "calendar",
      entity: selectedEntities.calendar,
    });
  }
  if (selectedEntities.trip) {
    breadcrumbItems.push({
      label: truncateText(
        selectedEntities.trip?.trip_headsign || selectedEntities.trip?.trip_id
      ),
      fullLabel:
        selectedEntities.trip?.trip_headsign ||
        selectedEntities.trip?.trip_id ||
        "Unknown Trip",
      category: "trip",
      entity: selectedEntities.trip,
    });
  }
  if (selectedEntities.shape) {
    breadcrumbItems.push({
      label: truncateText(`Shp ${selectedEntities.shape?.shape_pt_sequence}`),
      fullLabel: `Shape Point ${
        selectedEntities.shape?.shape_pt_sequence || "N/A"
      }`,
      category: "shape",
      entity: selectedEntities.shape,
    });
  }
  if (selectedEntities.stop) {
    breadcrumbItems.push({
      label: truncateText(
        selectedEntities.stop?.stop_name || selectedEntities.stop?.stop_id
      ),
      fullLabel:
        selectedEntities.stop?.stop_name ||
        selectedEntities.stop?.stop_id ||
        "Unknown Stop",
      category: "stop",
      entity: selectedEntities.stop,
    });
  }

  return breadcrumbItems.length > 0 ? (
    <div className={`breadcrumb-bar ${isFilterOpen ? "filter-open" : ""}`}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.category}>
          {index > 0 && <span className="breadcrumb-separator">/</span>}
          <OverlayTrigger
            placement="bottom"
            overlay={renderTooltip(item.fullLabel)}
          >
            <div
              className={`kk-bg-none breadcrumb-item ${
                index === breadcrumbItems.length - 1 ? "active" : ""
              }`}
              onClick={() => handleBreadcrumbClick(item.category, item.entity)}
            >
              <span className="breadcrumb-category">{item.category}</span>
              <span className="breadcrumb-label">{item.label}</span>
            </div>
          </OverlayTrigger>
        </React.Fragment>
      ))}
    </div>
  ) : null;
};

BreadcrumbBar.propTypes = {
  selectedEntities: PropTypes.shape({
    agency: PropTypes.object,
    route: PropTypes.object,
    calendar: PropTypes.object,
    trip: PropTypes.object,
    shape: PropTypes.object,
    stop: PropTypes.object,
  }).isRequired,
  setSelectedEntities: PropTypes.func.isRequired,
  setActiveKey: PropTypes.func.isRequired,
  trips: PropTypes.object.isRequired,
  setPageTrips: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  isFilterOpen: PropTypes.bool.isRequired,
};

export default BreadcrumbBar;
