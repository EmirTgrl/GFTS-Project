import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { Form, Button } from "react-bootstrap";
import { X } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";

const TripFilterPanel = ({
  calendars,
  tripTimes,
  setTrips,
  setIsFiltered,
  fullTrips,
  onClose,
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    service_id: "",
    direction_id: "",
    timeRange: { start: "", end: "" },
  });

  const serviceIdRef = useRef(null);
  const directionIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  const getActiveDays = (calendar) => {
    if (!calendar) return t("N/A");
    const days = [];
    if (calendar.monday === 1) days.push(t("Mon"));
    if (calendar.tuesday === 1) days.push(t("Tue"));
    if (calendar.wednesday === 1) days.push(t("Wed"));
    if (calendar.thursday === 1) days.push(t("Thu"));
    if (calendar.friday === 1) days.push(t("Fri"));
    if (calendar.saturday === 1) days.push(t("Sat"));
    if (calendar.sunday === 1) days.push(t("Sun"));
    return days.length > 0 ? days.join(",") : t("N/A");
  };

  const compareTimes = (time1, time2) => {
    if (!time1 || !time2) return 0;
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  };

  const filterTrips = (tripsData, currentFilters) => {
    if (!tripsData || !Array.isArray(tripsData)) {
      console.warn("Invalid trips data:", tripsData);
      return [];
    }

    return tripsData.filter((trip) => {
      const times = tripTimes[trip.trip_id] || {
        firstArrival: null,
        lastDeparture: null,
      };

      const matchesService =
        !currentFilters.service_id ||
        trip.service_id === currentFilters.service_id;

      const matchesDirection =
        !currentFilters.direction_id ||
        trip.direction_id === currentFilters.direction_id;

      const matchesTime =
        (!currentFilters.timeRange.start ||
          (times.firstArrival &&
            compareTimes(times.firstArrival, currentFilters.timeRange.start) >=
              0)) &&
        (!currentFilters.timeRange.end ||
          (times.lastDeparture &&
            compareTimes(times.lastDeparture, currentFilters.timeRange.end) <=
              0));

      return matchesService && matchesDirection && matchesTime;
    });
  };

  const handleApplyFilters = () => {
    const currentFilters = {
      service_id: serviceIdRef.current.value,
      direction_id: directionIdRef.current.value,
      timeRange: {
        start: startTimeRef.current.value,
        end: endTimeRef.current.value,
      },
    };

    setFilters(currentFilters);

    const filtered = filterTrips(fullTrips, currentFilters);
    setTrips({
      data: filtered,
      total: filtered.length,
    });
    setIsFiltered(true);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      service_id: "",
      direction_id: "",
      timeRange: { start: "", end: "" },
    };
    setFilters(resetFilters);
    setTrips({ data: fullTrips, total: fullTrips.length });
    setIsFiltered(false);
  };

  return (
    <div className="trip-filter-panel">
      <div className="filter-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{t("Filter")}</h5>
        <X size={24} onClick={onClose} className="close-icon" />
      </div>
      <Form>
        <Form.Group className="mb-2">
          <Form.Label>{t("Days")}</Form.Label>
          <Form.Select
            size="sm"
            value={filters.service_id}
            ref={serviceIdRef}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, service_id: e.target.value }))
            }
          >
            <option value="">{t("All")}</option>
            {calendars.map((cal) => (
              <option key={cal.service_id} value={cal.service_id}>
                {getActiveDays(cal)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>{t("Direction")}</Form.Label>
          <Form.Select
            size="sm"
            value={filters.direction_id}
            ref={directionIdRef}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, direction_id: e.target.value }))
            }
          >
            <option value="">{t("All")}</option>
            <option value="0">{t("Outbound")}</option>
            <option value="1">{t("Inbound")}</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>{t("Start Time")}</Form.Label>
          <Form.Control
            size="sm"
            type="time"
            value={filters.timeRange.start}
            ref={startTimeRef}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                timeRange: { ...prev.timeRange, start: e.target.value },
              }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>{t("End Time")}</Form.Label>
          <Form.Control
            size="sm"
            type="time"
            value={filters.timeRange.end}
            ref={endTimeRef}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                timeRange: { ...prev.timeRange, end: e.target.value },
              }))
            }
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button size="sm" variant="primary" onClick={handleApplyFilters}>
            {t("Apply")}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleResetFilters}>
            {t("Reset")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

TripFilterPanel.propTypes = {
  calendars: PropTypes.array.isRequired,
  tripTimes: PropTypes.object.isRequired,
  setTrips: PropTypes.func.isRequired,
  setIsFiltered: PropTypes.func.isRequired,
  fullTrips: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TripFilterPanel;
