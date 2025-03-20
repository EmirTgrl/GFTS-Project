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

  const timeToSeconds = (time) => {
    if (!time) return null;
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + (seconds || 0);
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

      // Service ID filtresi
      const matchesService =
        !filters.service_id || trip.service_id === filters.service_id;

      // Direction ID filtresi
      const matchesDirection =
        !filters.direction_id ||
        trip.direction_id.toString() === filters.direction_id;

      // Zaman filtresi
      const startTime = filters.timeRange.start
        ? timeToSeconds(filters.timeRange.start)
        : null;
      const endTime = filters.timeRange.end
        ? timeToSeconds(filters.timeRange.end)
        : null;
      const tripStart = times.firstArrival
        ? timeToSeconds(times.firstArrival)
        : null;
      const tripEnd = times.lastDeparture
        ? timeToSeconds(times.lastDeparture)
        : null;

      const matchesTime =
        (!startTime || (tripStart && tripStart >= startTime)) &&
        (!endTime || (tripEnd && tripEnd <= endTime));

      // Debugging
      console.log({
        tripId: trip.trip_id,
        firstArrival: times.firstArrival,
        lastDeparture: times.lastDeparture,
        tripStartSeconds: tripStart,
        tripEndSeconds: tripEnd,
        filterStartSeconds: startTime,
        filterEndSeconds: endTime,
        matchesService,
        matchesDirection,
        matchesTime,
      });

      return matchesService && matchesDirection && matchesTime;
    });

    return filtered;
  };

  const handleApplyFilters = () => {
    const filtered = filterTrips(fullTrips);
    console.log("Filtrelenmiş Trip'ler:", filtered);
    setTrips({
      data: filtered, // Tüm filtrelenmiş veriler
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
    setTrips({ data: fullTrips, total: fullTrips.length });
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
  onClose: PropTypes.func.isRequired,
};

export default TripFilterPanel;
