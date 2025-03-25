import PropTypes from "prop-types";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import "../../styles/BreadcrumbBar.css";

const BreadcrumbBar = ({
  selectedEntities,
  setSelectedEntities,
  setActiveAccordionKey,
  trips,
  setPageTrips,
  itemsPerPage,
}) => {
  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text}`} className="custom-tooltip">
      {text}
    </Tooltip>
  );

  const handleBreadcrumbClick = (category, item) => {
    switch (category) {
      case "agency":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: null,
          calendar: null,
          trip: null,
          shape: null,
          stop: null,
        });
        setActiveAccordionKey("0"); // Agencies accordion
        break;
      case "route":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: null,
          trip: null,
          shape: null,
          stop: null,
        });
        setActiveAccordionKey("1"); // Routes accordion
        break;
      case "calendar":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: selectedEntities.calendar,
          trip: null,
          shape: null,
          stop: null,
        });
        setActiveAccordionKey("2"); // Calendars accordion
        break;
      case "trip":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: selectedEntities.calendar,
          trip: selectedEntities.trip,
          shape: null,
          stop: null,
        });
        setActiveAccordionKey("3"); // Trips accordion
        if (item && trips.data) {
          const tripIndex = trips.data.findIndex(
            (trip) => trip.trip_id === item.trip_id
          );
          if (tripIndex !== -1) {
            const page = Math.floor(tripIndex / itemsPerPage) + 1;
            setPageTrips(page);
          }
        }
        break;
      case "shape":
        setSelectedEntities({
          agency: selectedEntities.agency,
          route: selectedEntities.route,
          calendar: selectedEntities.calendar,
          trip: selectedEntities.trip,
          shape: selectedEntities.shape,
          stop: null,
        });
        setActiveAccordionKey("4"); // Shapes accordion
        break;
      case "stop":
        setSelectedEntities({
          ...selectedEntities,
          stop: selectedEntities.stop,
        });
        setActiveAccordionKey("5"); // Stops accordion
        break;
      default:
        break;
    }
  };

  const truncateText = (text, maxLength = 12) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const breadcrumbItems = [];
  if (selectedEntities.agency) {
    breadcrumbItems.push({
      label: truncateText(selectedEntities.agency.agency_name),
      fullLabel: selectedEntities.agency.agency_name,
      category: "agency",
      entity: selectedEntities.agency,
    });
  }
  if (selectedEntities.route) {
    breadcrumbItems.push({
      label: truncateText(
        selectedEntities.route.route_long_name ||
          selectedEntities.route.route_id
      ),
      fullLabel:
        selectedEntities.route.route_long_name ||
        selectedEntities.route.route_id,
      category: "route",
      entity: selectedEntities.route,
    });
  }
  if (selectedEntities.calendar) {
    breadcrumbItems.push({
      label: truncateText(`Cal (${selectedEntities.calendar.service_id})`),
      fullLabel: `Calendar (${selectedEntities.calendar.service_id})`,
      category: "calendar",
      entity: selectedEntities.calendar,
    });
  }
  if (selectedEntities.trip) {
    breadcrumbItems.push({
      label: truncateText(
        selectedEntities.trip.trip_headsign || selectedEntities.trip.trip_id
      ),
      fullLabel:
        selectedEntities.trip.trip_headsign || selectedEntities.trip.trip_id,
      category: "trip",
      entity: selectedEntities.trip,
    });
  }
  if (selectedEntities.shape) {
    breadcrumbItems.push({
      label: truncateText(`Shp ${selectedEntities.shape.shape_pt_sequence}`),
      fullLabel: `Shape Point ${selectedEntities.shape.shape_pt_sequence}`,
      category: "shape",
      entity: selectedEntities.shape,
    });
  }
  if (selectedEntities.stop) {
    breadcrumbItems.push({
      label: truncateText(
        selectedEntities.stop.stop_name || selectedEntities.stop.stop_id
      ),
      fullLabel:
        selectedEntities.stop.stop_name || selectedEntities.stop.stop_id,
      category: "stop",
      entity: selectedEntities.stop,
    });
  }

  return (
    <div className="breadcrumb-bar">
      {breadcrumbItems.length > 0 ? (
        breadcrumbItems.map((item, index) => (
          <OverlayTrigger
            key={item.category}
            placement="top"
            overlay={renderTooltip(item.fullLabel)}
          >
            <span
              className={`breadcrumb-item ${
                index === breadcrumbItems.length - 1 ? "active" : ""
              }`}
              onClick={() => handleBreadcrumbClick(item.category, item.entity)}
            >
              {item.label}
              {index < breadcrumbItems.length - 1 && (
                <span className="separator">›</span>
              )}
            </span>
          </OverlayTrigger>
        ))
      ) : (
        <span className="breadcrumb-item no-selection">No Selection</span>
      )}
    </div>
  );
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
  setActiveAccordionKey: PropTypes.func.isRequired,
  trips: PropTypes.object.isRequired,
  setPageTrips: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
};

export default BreadcrumbBar;
