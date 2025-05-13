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
import { CaretUpFill, XCircleFill } from "react-bootstrap-icons";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet-polylinedecorator";
import { debounce } from "lodash";
import { renderToString } from "react-dom/server";
import { Button } from "react-bootstrap";
import { snapShapesToRoads, saveMultipleShapes } from "../../api/shapeApi.js";
import {
  saveMultipleStopsAndTimes,
  calculateRouteBetweenStops,
} from "../../api/stopTimeApi.js";
import { fetchRoutesByStopId } from "../../api/stopApi.js";

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
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
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
  allStops,
  openStopTimeAdd,
}) => {
  const [tempStopsAndTimes, setTempStopsAndTimes] = useState([]);
  const [tempShapes, setTempShapes] = useState([]);
  const [visibleStops, setVisibleStops] = useState([]);
  const [visibleShapes, setVisibleShapes] = useState([]);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const prevClickedCoords = useRef(null);
  const mapRef = useRef(null);
  const prevStopsAndTimesRef = useRef(null);
  const hasLoggedAreaWarnings = useRef(new Set());

  const MIN_STOP_ZOOM = 15;

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

        if (
          areaStops.length === 0 &&
          !hasLoggedAreaWarnings.current.has(area.area_name)
        ) {
          console.warn(`No stops found for area: ${area.area_name}`);
          hasLoggedAreaWarnings.current.add(area.area_name);
          return null;
        }

        const validStops = areaStops.filter((stop) =>
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        );

        if (
          validStops.length === 0 &&
          !hasLoggedAreaWarnings.current.has(`${area.area_name}-valid`)
        ) {
          console.warn(`No valid stops found for area: ${area.area_name}`);
          hasLoggedAreaWarnings.current.add(`${area.area_name}-valid`);
          return null;
        }

        if (validStops.length === 0) return null;

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

    const stopsToFilter =
      allStops?.length > 0 ? allStops : stopsAndTimes?.data || [];

    const filteredStops = stopsToFilter.filter((stop) => {
      const lat = parseFloat(stop.stop_lat);
      const lon = parseFloat(stop.stop_lon);
      return isValidLatLng(lat, lon) && currentBounds.contains([lat, lon]);
    });

    setVisibleStops(filteredStops);
  }, [currentBounds, currentZoom, stopsAndTimes, allStops, isValidLatLng]);

  useEffect(() => {
    filterVisibleStops();
  }, [filterVisibleStops]);

  useEffect(() => {
    const stopsData =
      allStops?.length > 0 ? allStops : stopsAndTimes?.data || [];
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
  }, [stopsAndTimes, shapes, selectedEntities.trip, isValidLatLng, allStops]);

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
      if (editorMode === "add-stop") {
        setSelectedCategory("stop");
        if (openStopTimeAdd) {
          openStopTimeAdd(clickedCoords.lat, clickedCoords.lng);
        } else {
          console.warn("openStopTimeAdd fonksiyonu tanımlı değil!");
        }
      } else if (editorMode === "add-shape") {
        const newShape = {
          shape_id: selectedEntities.trip?.shape_id,
          shape_pt_lat: clickedCoords.lat,
          shape_pt_lon: clickedCoords.lng,
          shape_pt_sequence: tempShapes.length + 1,
          project_id: project_id,
        };
        setTempShapes((prev) => [...prev, newShape]);
        setVisibleShapes((prev) => [...prev, newShape]);
        onMapClick(clickedCoords);
      }
      prevClickedCoords.current = clickedCoords;
    }
  }, [
    clickedCoords,
    editorMode,
    onMapClick,
    setSelectedCategory,
    selectedEntities.trip,
    tempShapes,
    project_id,
    openStopTimeAdd,
  ]);

  const handleBoundsChange = useCallback(({ bounds, zoom }) => {
    setCurrentBounds(bounds);
    setCurrentZoom(zoom);
  }, []);

  const handleStopClick = useCallback(
    async (stop) => {
      if (editorMode === "add-stop" || editorMode === "edit-stop") {
        setSelectedEntities((prev) => ({ ...prev, stop }));
        setSelectedCategory("stop");
        if (
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        ) {
          mapRef.current?.flyTo(
            [parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)],
            18,
            { animate: true }
          );
        } else {
          console.warn(
            "Invalid coordinates for stop:",
            stop.stop_id,
            stop.stop_lat,
            stop.stop_lon
          );
        }
      } else {
        setSelectedStop({ ...stop, route_names: [], error: false });
        setIsMenuOpen(true);
        try {
          const response = await fetchRoutesByStopId(
            project_id,
            stop.stop_id,
            token
          );
          console.log("Fetch routes response:", response); // API yanıtını logla
          const routeNames = response.data?.route_names || []; // Orijinal mantığı geri yükledim
          setSelectedStop((prev) => ({
            ...prev,
            route_names: routeNames,
            error: false,
          }));
          if (
            isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
          ) {
            mapRef.current?.flyTo(
              [parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)],
              18,
              { animate: true }
            );
          } else {
            console.warn(
              "Invalid coordinates for stop:",
              stop.stop_id,
              stop.stop_lat,
              stop.stop_lon
            );
          }
        } catch (error) {
          console.error("Error fetching routes for stop:", error);
          setSelectedStop((prev) => ({
            ...prev,
            route_names: [],
            error: true,
          }));
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch routes for this stop.",
            toast: true,
            position: "top-end",
            timer: 3000,
          });
        }
      }
    },
    [
      editorMode,
      setSelectedEntities,
      setSelectedCategory,
      project_id,
      token,
      isValidLatLng,
    ]
  );

  const handleSaveStopsAndShapes = useCallback(async () => {
    if (
      !selectedEntities.trip ||
      (!tempStopsAndTimes.length && !tempShapes.length)
    ) {
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
      if (tempStopsAndTimes.length > 0) {
        const stopsToSave = tempStopsAndTimes.map((stop, index) => ({
          ...stop,
          stop_sequence: stop.stop_sequence || index + 1,
          trip_id: selectedEntities.trip.trip_id,
        }));

        await saveMultipleStopsAndTimes(stopsToSave, token);
        setStopsAndTimes({ data: stopsToSave, total: stopsToSave.length });
      }

      if (tempShapes.length > 0) {
        await saveMultipleShapes(
          tempShapes,
          selectedEntities.trip.trip_id,
          token
        );
        setShapes(tempShapes);
      }

      setEditorMode("close");

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
          stop_lat: parseFloat(stop.stop_lat),
          stop_lon: parseFloat(stop.stop_lon),
          stop_sequence: stop.stop_sequence || 0,
        }));

      const routeResponse = await calculateRouteBetweenStops(
        coordinates,
        token
      );

      const shapesToSnap = routeResponse.geometry.map((coord, index) => ({
        shape_id: selectedEntities.trip.shape_id,
        shape_pt_lat: coord[1],
        shape_pt_lon: coord[0],
        shape_pt_sequence: index + 1,
        project_id: project_id,
      }));

      const snappedShapes = await snapShapesToRoads(shapesToSnap, token);

      setTempShapes(snappedShapes);
      setShapes(snappedShapes);
      setVisibleShapes(snappedShapes);

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
    project_id,
    isValidLatLng,
  ]);

  useEffect(() => {
    if (editorMode === "save") {
      handleSaveStopsAndShapes();
    }
  }, [editorMode, handleSaveStopsAndShapes]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        position: "relative",
        margin: 0,
        padding: 0,
      }}
    >
      <MapContainer
        center={mapCenter || [39.9255, 32.8663]}
        zoom={zoom || 6}
        style={{
          height: "100%",
          width: "100%",
          margin: 0,
          padding: 0,
        }}
        whenCreated={(map) => {
          mapRef.current = map;
          map.invalidateSize();
        }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={mapCenter || [39.9255, 32.8663]} zoom={zoom || 6} />
        <MapClickHandler onMapClick={onMapClick} />
        <BoundsTracker onBoundsChange={handleBoundsChange} />

        <MarkerClusterGroup maxClusterRadius={50} disableClusteringAtZoom={15}>
          {visibleStops.length > 0 ? (
            visibleStops.map((stop) => (
              <Marker
                key={`${stop.stop_id}-${stop.trip_id || "no-trip"}`}
                position={[
                  parseFloat(stop.stop_lat),
                  parseFloat(stop.stop_lon),
                ]}
                icon={stopIcon}
                eventHandlers={{
                  click: () => handleStopClick(stop),
                }}
              >
                <Popup>
                  {stop.stop_name || stop.stop_id}
                  <br />
                  {stop.arrival_time && stop.departure_time
                    ? `${stop.arrival_time} - ${stop.departure_time}`
                    : "N/A"}
                </Popup>
              </Marker>
            ))
          ) : (
            <></>
          )}
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

        {editorMode === "add-stop" && clickedCoords && (
          <Marker position={[clickedCoords.lat, clickedCoords.lng]} />
        )}
      </MapContainer>

      <div
        style={{
          position: "fixed",
          top: "56px",
          right: isMenuOpen ? "0" : "-300px",
          width: "300px",
          height: "calc(100vh - 56px)",
          background: "linear-gradient(135deg, #ffffff, #f0f4f8)",
          boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.2)",
          padding: "20px",
          transition: "right 0.3s ease-in-out",
          zIndex: 1000,
          borderLeft: "1px solid #e0e0e0",
          borderRadius: "10px 0 0 10px",
          overflowY: "auto",
        }}
      >
        {selectedStop && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
                borderBottom: "1px solid #e0e0e0",
                paddingBottom: "10px",
              }}
            >
              <h5
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  color: "#2c3e50",
                  fontWeight: "600",
                }}
              >
                {selectedStop.stop_name || selectedStop.stop_id}
              </h5>
              <button
                onClick={() => {
                  setSelectedStop(null);
                  setIsMenuOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "#e74c3c",
                  cursor: "pointer",
                  padding: "0",
                }}
              >
                <XCircleFill />
              </button>
            </div>
            <div>
              <strong
                style={{
                  fontSize: "0.95rem",
                  color: "#34495e",
                  marginBottom: "10px",
                  display: "block",
                }}
              >
                Hatlar:
              </strong>
              {selectedStop.route_names === null ? (
                <p
                  style={{
                    color: "#7f8c8d",
                    fontSize: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  Yükleniyor...
                </p>
              ) : selectedStop.error ? (
                <p
                  style={{
                    color: "#e74c3c",
                    fontSize: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  Durak bilgileri yüklenemedi.
                </p>
              ) : Array.isArray(selectedStop.route_names) &&
                selectedStop.route_names.length > 0 ? (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {selectedStop.route_names.map((routeName, index) => (
                    <button
                      key={index}
                      style={{
                        background: "#3498db",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        width: "100%",
                        textAlign: "center",
                        whiteSpace: "normal",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.target.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) =>
                        (e.target.style.transform = "scale(1)")
                      }
                    >
                      {routeName}
                    </button>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: "#7f8c8d",
                    fontSize: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  Bu duraktan geçen hat bulunmamaktadır.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {editorMode && editorMode !== "close" && editorMode !== "save" && (
        <Button
          variant="primary"
          style={{
            position: "absolute",
            top: "7px",
            right: isMenuOpen ? "320px" : "20px", // Menü açıkken 300px + 20px margin
            zIndex: 1000,
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "12px",
            backgroundColor: "#007bff",
            border: "none",
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.15)",
            transition:
              "transform 0.2s ease, background-color 0.3s ease, right 0.3s ease",
          }}
          onClick={handleCalculateRoute}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.backgroundColor = "#0056b3";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.backgroundColor = "#007bff";
          }}
        >
          Snap the Routes
        </Button>
      )}
    </div>
  );
};

MapView.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
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
  allStops: PropTypes.array.isRequired,
  openStopTimeAdd: PropTypes.func,
  setMapCenter: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
};

export default MapView;
