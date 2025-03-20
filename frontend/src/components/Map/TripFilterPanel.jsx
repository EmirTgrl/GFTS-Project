import { useState } from "react";
import PropTypes from "prop-types";
import { Form, Button } from "react-bootstrap";
import { X } from "react-bootstrap-icons";

const TripFilterPanel = ({
  calendars,
  tripTimes,
  setTrips,
  setIsFiltered,
  fullTrips,
  pageTrips,
  itemsPerPage,
  onClose,
}) => {
  const [filters, setFilters] = useState({
    service_id: "",
    direction_id: "",
    timeRange: { start: "", end: "" },
  });

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

  const compareTimes = (time1, time2) => {
    if (!time1 || !time2) return 0;
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    return h1 * 60 + m1 - (h2 * 60 + m2);
  };

  const filterTrips = (tripsData) => {
    if (!tripsData || !Array.isArray(tripsData)) {
      console.warn("Invalid trips data:", tripsData);
      return [];
    }

    const filtered = tripsData.filter((trip) => {
      const times = tripTimes[trip.trip_id] || {
        firstArrival: null,
        lastDeparture: null,
      };

      const matchesService =
        !filters.service_id ||
        trip.service_id.toString() === filters.service_id;

      const matchesDirection =
        !filters.direction_id ||
        trip.direction_id.toString() === filters.direction_id;

      const matchesTime =
        (!filters.timeRange.start ||
          (times.firstArrival &&
            compareTimes(times.firstArrival, filters.timeRange.start) >= 0)) &&
        (!filters.timeRange.end ||
          (times.lastDeparture &&
            compareTimes(times.lastDeparture, filters.timeRange.end) <= 0));

      return matchesService && matchesDirection && matchesTime;
    });

    return filtered;
  };

  const handleApplyFilters = () => {
    const filtered = filterTrips(fullTrips);
    const paginatedFiltered = filtered.slice(
      (pageTrips - 1) * itemsPerPage,
      pageTrips * itemsPerPage
    );
    setTrips({
      data: paginatedFiltered,
      total: filtered.length,
    });
    setIsFiltered(true);
  };

  const handleResetFilters = () => {
    setFilters({
      service_id: "",
      direction_id: "",
      timeRange: { start: "", end: "" },
    });
    const paginatedTrips = fullTrips.slice(
      (pageTrips - 1) * itemsPerPage,
      pageTrips * itemsPerPage
    );
    setTrips({ data: paginatedTrips, total: fullTrips.length });
    setIsFiltered(false);
  };

  return (
    <div className="trip-filter-panel">
      <div className="filter-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Filtrele</h5>
        <X size={24} onClick={onClose} className="close-icon" />
      </div>
      <Form>
        <Form.Group className="mb-2">
          <Form.Label>Günler</Form.Label>
          <Form.Select
            size="sm"
            value={filters.service_id}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, service_id: e.target.value }))
            }
          >
            <option value="">Tümü</option>
            {calendars.map((cal) => (
              <option key={cal.service_id} value={cal.service_id}>
                {getActiveDays(cal)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Yön</Form.Label>
          <Form.Select
            size="sm"
            value={filters.direction_id}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, direction_id: e.target.value }))
            }
          >
            <option value="">Tümü</option>
            <option value="0">Gidiş</option>
            <option value="1">Dönüş</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Başlangıç</Form.Label>
          <Form.Control
            size="sm"
            type="time"
            value={filters.timeRange.start}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                timeRange: { ...prev.timeRange, start: e.target.value },
              }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Bitiş</Form.Label>
          <Form.Control
            size="sm"
            type="time"
            value={filters.timeRange.end}
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
            Uygula
          </Button>
          <Button size="sm" variant="secondary" onClick={handleResetFilters}>
            Sıfırla
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
  pageTrips: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TripFilterPanel;
