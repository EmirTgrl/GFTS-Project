import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
  Circle,
} from "react-leaflet";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import Swal from "sweetalert2";
import {
  saveMultipleStopsAndTimes,
  calculateRouteBetweenStops,
} from "../../api/stopTimeApi.js";
import { saveMultipleShapes, snapShapesToRoads } from "../../api/shapeApi.js";
import { CaretUpFill } from "react-bootstrap-icons";
import { renderToString } from "react-dom/server";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet-polylinedecorator";
import { debounce } from "lodash";

const stopIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick({ lat, lng });
    },
  });
  return null;
};

MapClickHandler.propTypes = {
  onMapClick: PropTypes.func.isRequired,
};

function PolylineWithDirectionalArrows({ positions, color, weight }) {
  const map = useMap();
  const decoratorRef = useRef(null);

  useEffect(() => {
    if (!map || !positions || positions.length < 2) return;

    if (decoratorRef.current) {
      map.removeLayer(decoratorRef.current);
    }

    const decorator = L.polylineDecorator(positions, {
      patterns: [
        {
          offset: 20,
          repeat: 50,
          symbol: L.Symbol.marker({
            rotate: true,
            markerOptions: {
              icon: L.divIcon({
                className: "arrow-icon",
                html: renderToString(<CaretUpFill color="white" />),
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              }),
            },
          }),
        },
      ],
    }).addTo(map);

    decoratorRef.current = decorator;

    return () => {
      if (decoratorRef.current) {
        map.removeLayer(decoratorRef.current);
      }
    };
  }, [map, positions]);

  return <Polyline positions={positions} color={color} weight={weight} />;
}

PolylineWithDirectionalArrows.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  color: PropTypes.string.isRequired,
  weight: PropTypes.number.isRequired,
};

const BoundsTracker = ({ onBoundsChange }) => {
  const map = useMap();

  const debouncedBoundsChange = useMemo(
    () =>
      debounce((bounds, zoom) => {
        onBoundsChange({ bounds, zoom });
      }, 200),
    [onBoundsChange]
  );

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      debouncedBoundsChange(bounds, zoom);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      debouncedBoundsChange(bounds, zoom);
    },
  });

  return null;
};

BoundsTracker.propTypes = {
  onBoundsChange: PropTypes.func.isRequired,
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      const [lat, lng] = center;
      if (
        typeof lat === "number" &&
        !isNaN(lat) &&
        typeof lng === "number" &&
        !isNaN(lng)
      ) {
        map.setView([lat, lng], zoom, { animate: true });
      } else {
        console.warn("MapUpdater: Invalid center coordinates:", center);
      }
    } else {
      console.warn("MapUpdater: Invalid center format:", center);
    }
  }, [center, zoom, map]);

  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
};

const MapView = ({
  mapCenter,
  zoom,
  stopsAndTimes,
  setStopsAndTimes,
  setShapes,
  onMapClick,
  shapes,
  clickedCoords,
  editorMode,
  setEditorMode,
  selectedEntities,
  setSelectedEntities,
  token,
  setSelectedCategory,
  project_id,
  areas,
}) => {
  const [tempStopsAndTimes, setTempStopsAndTimes] = useState([]);
  const [tempShapes, setTempShapes] = useState([]);
  const [visibleStops, setVisibleStops] = useState([]);
  const [visibleShapes, setVisibleShapes] = useState([]);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const prevClickedCoords = useRef(null);
  const mapRef = useRef(null);
  const prevStopsAndTimesRef = useRef(null);

  // Durakların görüneceği minimum zoom seviyesi
  const MIN_STOP_ZOOM = 12;

  const isValidLatLng = useCallback((lat, lng) => {
    return (
      typeof lat === "number" &&
      !isNaN(lat) &&
      typeof lng === "number" &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }, []);

  const calculateAreaCenters = useMemo(() => {
    if (!selectedEntities.trip || !areas || !visibleStops.length) return [];

    return areas
      .map((area) => {
        const areaStops = visibleStops.filter((stop) =>
          area.stop_ids.map(String).includes(String(stop.stop_id))
        );

        if (areaStops.length === 0) {
          console.warn(`No stops found for area: ${area.area_name}`);
          return null;
        }

        const validStops = areaStops.filter((stop) =>
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        );

        if (validStops.length === 0) {
          console.warn(`No valid stops found for area: ${area.area_name}`);
          return null;
        }

        const lats = validStops.map((stop) => parseFloat(stop.stop_lat));
        const lons = validStops.map((stop) => parseFloat(stop.stop_lon));
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        const avgLat = (minLat + maxLat) / 2;
        const avgLon = (minLon + maxLon) / 2;

        const toRadians = (deg) => (deg * Math.PI) / 180;
        const earthRadius = 6371000;
        const distances = validStops.map((stop) => {
          const lat = parseFloat(stop.stop_lat);
          const lon = parseFloat(stop.stop_lon);
          const dLat = toRadians(lat - avgLat);
          const dLon = toRadians(lon - avgLon);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(avgLat)) *
              Math.cos(toRadians(lat)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return earthRadius * c;
        });

        const radius = Math.max(...distances) * 1.2;

        return {
          area_id: area.area_id,
          area_name: area.area_name,
          center: [avgLat, avgLon],
          radius: Math.max(radius, 100),
          stops: validStops,
        };
      })
      .filter((area) => area !== null);
  }, [selectedEntities.trip, areas, visibleStops, isValidLatLng]);

  const filterVisibleStops = useCallback(() => {
    if (!currentBounds || currentZoom < MIN_STOP_ZOOM) {
      setVisibleStops([]);
      return;
    }

    const stopsToFilter = stopsAndTimes?.data || [];

    const filteredStops = stopsToFilter.filter((stop) => {
      const lat = parseFloat(stop.stop_lat);
      const lon = parseFloat(stop.stop_lon);
      return isValidLatLng(lat, lon) && currentBounds.contains([lat, lon]);
    });

    setVisibleStops(filteredStops);
  }, [currentBounds, currentZoom, stopsAndTimes, isValidLatLng]);

  useEffect(() => {
    filterVisibleStops();
  }, [filterVisibleStops]);

  useEffect(() => {
    const stopsData = stopsAndTimes?.data || [];
    if (!stopsData.length && selectedEntities.trip) return;

    if (
      JSON.stringify(stopsAndTimes) !==
      JSON.stringify(prevStopsAndTimesRef.current)
    ) {
      const newStops = stopsData
        .filter((stop) =>
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        )
        .map((stop) => ({ ...stop }));
      const newShapes = shapes ? [...shapes] : [];

      setTempStopsAndTimes(newStops);
      setTempShapes(newShapes);
      prevStopsAndTimesRef.current = stopsAndTimes;

      if (selectedEntities.trip?.trip_id) {
        setVisibleShapes(
          newShapes.filter(
            (shape) => shape.shape_id === selectedEntities.trip.shape_id
          )
        );
      } else {
        setVisibleShapes(newShapes);
      }
    }
  }, [stopsAndTimes, shapes, selectedEntities.trip, isValidLatLng]);

  // Trip seçildiğinde durakların ortalamasına göre zoom yap
  useEffect(() => {
    if (selectedEntities.trip && tempStopsAndTimes.length > 0) {
      const tripStops = tempStopsAndTimes.filter(
        (stop) => stop.trip_id === selectedEntities.trip.trip_id
      );

      if (tripStops.length > 0) {
        const validStops = tripStops.filter((stop) =>
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        );

        if (validStops.length > 0) {
          // Durakların sınırlarını hesapla
          const bounds = L.latLngBounds(
            validStops.map((stop) => [
              parseFloat(stop.stop_lat),
              parseFloat(stop.stop_lon),
            ])
          );

          if (mapRef.current) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          }

          setVisibleStops(validStops);
          setVisibleShapes(
            tempShapes.filter(
              (shape) => shape.shape_id === selectedEntities.trip.shape_id
            )
          );
        } else {
          console.warn("No valid stops with coordinates found for this trip.");
          setVisibleStops([]);
          setVisibleShapes(
            tempShapes.filter(
              (shape) => shape.shape_id === selectedEntities.trip.shape_id
            )
          );
        }
      }
    } else if (!selectedEntities.trip && tempStopsAndTimes.length > 0) {
      const validStops = tempStopsAndTimes.filter((stop) =>
        isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
      );
      setVisibleStops(currentZoom >= MIN_STOP_ZOOM ? validStops : []);
      setVisibleShapes([]);
    }
  }, [
    selectedEntities.trip,
    tempStopsAndTimes,
    tempShapes,
    isValidLatLng,
    currentZoom,
  ]);

  useEffect(() => {
    if (
      clickedCoords &&
      (!prevClickedCoords.current ||
        clickedCoords.lat !== prevClickedCoords.current.lat ||
        clickedCoords.lng !== prevClickedCoords.current.lng)
    ) {
      if (editorMode === "addStop") {
        setSelectedCategory("stop");
        onMapClick(clickedCoords);
      }
      prevClickedCoords.current = clickedCoords;
    }
  }, [clickedCoords, editorMode, onMapClick, setSelectedCategory]);

  const handleBoundsChange = useCallback(({ bounds, zoom }) => {
    setCurrentBounds(bounds);
    setCurrentZoom(zoom);
  }, []);

  const handleStopClick = useCallback(
    (stop) => {
      if (editorMode === "addStop" || editorMode === "editStop") {
        setSelectedEntities((prev) => ({ ...prev, stop }));
        setSelectedCategory("stop");
        if (stop.stop_lat && stop.stop_lon) {
          mapRef.current?.flyTo(
            [parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)],
            18
          );
        }
      }
    },
    [editorMode, setSelectedEntities, setSelectedCategory]
  );

  const handleSaveStopsAndShapes = useCallback(async () => {
    if (!selectedEntities.trip || !tempStopsAndTimes.length) {
      Swal.fire({
        icon: "warning",
        title: "No Data",
        text: "No stops or shapes to save.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
      return;
    }

    try {
      const stopsToSave = tempStopsAndTimes.map((stop, index) => ({
        ...stop,
        stop_sequence: stop.stop_sequence || index + 1,
        trip_id: selectedEntities.trip.trip_id,
      }));

      await saveMultipleStopsAndTimes(
        selectedEntities.trip.trip_id,
        project_id,
        stopsToSave,
        token
      );

      if (tempShapes.length > 0) {
        await saveMultipleShapes(
          selectedEntities.trip.shape_id,
          project_id,
          tempShapes,
          token
        );
      }

      setStopsAndTimes({ data: stopsToSave, total: stopsToSave.length });
      setShapes(tempShapes);
      setEditorMode(null);

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Stops and shapes saved successfully.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
    } catch (error) {
      console.error("Error saving stops and shapes:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save stops and shapes.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
    }
  }, [
    selectedEntities.trip,
    tempStopsAndTimes,
    tempShapes,
    project_id,
    token,
    setStopsAndTimes,
    setShapes,
    setEditorMode,
  ]);

  const handleCalculateRoute = useCallback(async () => {
    if (!selectedEntities.trip || tempStopsAndTimes.length < 2) {
      Swal.fire({
        icon: "warning",
        title: "Insufficient Stops",
        text: "At least two stops are required to calculate a route.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
      return;
    }

    try {
      const coordinates = tempStopsAndTimes
        .filter((stop) =>
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        )
        .map((stop) => ({
          lat: parseFloat(stop.stop_lat),
          lon: parseFloat(stop.stop_lon),
        }));

      const routeResponse = await calculateRouteBetweenStops(
        coordinates,
        token
      );
      const snappedShapes = await snapShapesToRoads(
        routeResponse.coordinates,
        token
      );

      const newShapes = snappedShapes.map((coord, index) => ({
        shape_id: selectedEntities.trip.shape_id,
        shape_pt_lat: coord.lat,
        shape_pt_lon: coord.lon,
        shape_pt_sequence: index + 1,
      }));

      setTempShapes(newShapes);
      setShapes(newShapes);
      setVisibleShapes(newShapes);

      Swal.fire({
        icon: "success",
        title: "Route Calculated",
        text: "Route calculated and shapes updated.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
    } catch (error) {
      console.error("Error calculating route:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to calculate route.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
    }
  }, [
    selectedEntities.trip,
    tempStopsAndTimes,
    token,
    setShapes,
    isValidLatLng,
  ]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      whenCreated={(map) => (mapRef.current = map)}
      zoomControl={false} 
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={mapCenter} zoom={zoom} />
      <MapClickHandler onMapClick={onMapClick} />
      <BoundsTracker onBoundsChange={handleBoundsChange} />

      <MarkerClusterGroup maxClusterRadius={50} disableClusteringAtZoom={15}>
        {visibleStops.map((stop) => (
          <Marker
            key={`${stop.stop_id}-${stop.trip_id || "no-trip"}`}
            position={[parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)]}
            icon={stopIcon}
            eventHandlers={{
              click: () => handleStopClick(stop),
            }}
          >
            <Popup>
              <strong>{stop.stop_name || stop.stop_id}</strong>
              {stop.arrival_time && stop.departure_time && (
                <div>
                  Arrival: {stop.arrival_time}
                  <br />
                  Departure: {stop.departure_time}
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {visibleShapes.length > 0 && (
        <PolylineWithDirectionalArrows
          positions={visibleShapes.map((shape) => [
            parseFloat(shape.shape_pt_lat),
            parseFloat(shape.shape_pt_lon),
          ])}
          color="#ff0000"
          weight={5}
        />
      )}

      {calculateAreaCenters.map((area) => (
        <Circle
          key={area.area_id}
          center={area.center}
          radius={area.radius}
          color="#ff7800"
          fillColor="#ff7800"
          fillOpacity={0.2}
        >
          <Popup>{area.area_name}</Popup>
        </Circle>
      ))}

      {editorMode && (
        <div className="map-controls">
          <button onClick={handleSaveStopsAndShapes}>Save</button>
          <button onClick={handleCalculateRoute}>Calculate Route</button>
          <button onClick={() => setEditorMode(null)}>Cancel</button>
        </div>
      )}
    </MapContainer>
  );
};

MapView.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  stopsAndTimes: PropTypes.object.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  setShapes: PropTypes.func.isRequired,
  onMapClick: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
  clickedCoords: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  editorMode: PropTypes.string,
  setEditorMode: PropTypes.func.isRequired,
  selectedEntities: PropTypes.shape({
    agency: PropTypes.object,
    route: PropTypes.object,
    calendar: PropTypes.object,
    trip: PropTypes.object,
    stop: PropTypes.object,
  }).isRequired,
  setSelectedEntities: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
  project_id: PropTypes.string.isRequired,
  areas: PropTypes.array.isRequired,
};

export default MapView;
