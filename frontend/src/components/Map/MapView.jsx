import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import MapUpdater from "./MapUpdater.jsx";
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

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      onBoundsChange({ bounds, zoom });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      onBoundsChange({ bounds, zoom });
    },
  });

  return null;
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

  const isValidLatLng = (lat, lng) => {
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
  };

  useEffect(() => {
    if (!stopsAndTimes || stopsAndTimes.length === 0) return;

    if (
      JSON.stringify(stopsAndTimes) !==
      JSON.stringify(prevStopsAndTimesRef.current)
    ) {
      const newStops = stopsAndTimes
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
      }
    }
  }, [stopsAndTimes, shapes, selectedEntities.trip?.trip_id]);

  useEffect(() => {
    if (selectedEntities.trip && tempStopsAndTimes.length > 0) {
      const tripStops = tempStopsAndTimes.filter(
        (stop) => stop.trip_id === selectedEntities.trip.trip_id
      );
      const tripShapes = tempShapes.filter(
        (shape) => shape.shape_id === selectedEntities.trip.shape_id
      );

      if (tripStops.length > 0) {
        const validStops = tripStops.filter((stop) =>
          isValidLatLng(parseFloat(stop.stop_lat), parseFloat(stop.stop_lon))
        );
        if (validStops.length > 0) {
          const avgLat =
            validStops.reduce(
              (sum, stop) => sum + parseFloat(stop.stop_lat),
              0
            ) / validStops.length;
          const avgLon =
            validStops.reduce(
              (sum, stop) => sum + parseFloat(stop.stop_lon),
              0
            ) / validStops.length;
          const newCenter = [avgLat, avgLon];
          if (mapRef.current && isValidLatLng(avgLat, avgLon)) {
            mapRef.current.setView(newCenter, 12);
          }
          setVisibleStops(validStops);
          setVisibleShapes(tripShapes);
        } else {
          console.warn("No valid stops with coordinates found for this trip.");
          setVisibleStops([]);
          setVisibleShapes(tripShapes);
        }
      }
    }
  }, [selectedEntities.trip, tempStopsAndTimes, tempShapes]);

  const handleBoundsChange = ({ bounds, zoom }) => {
    setCurrentBounds(bounds);
    setCurrentZoom(zoom);

    if (!selectedEntities.trip) {
      if (zoom >= 10) {
        const filteredStops = tempStopsAndTimes.filter(
          (stop) =>
            isValidLatLng(
              parseFloat(stop.stop_lat),
              parseFloat(stop.stop_lon)
            ) &&
            bounds.contains([
              parseFloat(stop.stop_lat),
              parseFloat(stop.stop_lon),
            ])
        );
        setVisibleStops(filteredStops);
        setVisibleShapes(tempShapes);
      } else {
        setVisibleStops([]);
        setVisibleShapes([]);
      }
    }
  };

  useEffect(() => {
    if (editorMode === "save") {
      const saveData = async () => {
        try {
          await saveMultipleShapes(
            tempShapes,
            selectedEntities.trip.trip_id,
            token
          );
          await saveMultipleStopsAndTimes(tempStopsAndTimes, token);
          setStopsAndTimes(tempStopsAndTimes);
          setShapes(tempShapes);
          Swal.fire("Success!", "Stops and shapes are saved.", "success");
        } catch (error) {
          console.error("Saving error:", error);
          Swal.fire("Hata!", "Saving unsuccessful: " + error.message, "error");
        } finally {
          setEditorMode("close");
        }
      };
      saveData();
    }
  }, [editorMode, selectedEntities.trip, token, tempStopsAndTimes, tempShapes]);

  useEffect(() => {
    if (!clickedCoords || clickedCoords === prevClickedCoords.current) return;

    prevClickedCoords.current = clickedCoords;

    if (editorMode === "add-shape") {
      if (tempShapes.length === 0) {
        Swal.fire({
          title: "Enter Shape ID (Number)",
          input: "number",
          inputAttributes: { autocapitalize: "off" },
          showCancelButton: true,
          confirmButtonText: "Save",
          cancelButtonText: "Cancel",
          showLoaderOnConfirm: true,
          preConfirm: (shapeId) => {
            const parsedShapeId = parseInt(shapeId);
            if (!shapeId || isNaN(parsedShapeId)) {
              Swal.showValidationMessage(`Shape ID must be a valid number`);
            }
            return parsedShapeId;
          },
          allowOutsideClick: () => !Swal.isLoading(),
        }).then((result) => {
          if (result.isConfirmed) {
            const shapeId = result.value;
            setTempShapes((prev) => [
              ...prev,
              {
                shape_id: shapeId,
                shape_pt_lat: clickedCoords.lat,
                shape_pt_lon: clickedCoords.lng,
                shape_pt_sequence:
                  prev.length > 0
                    ? Math.max(...prev.map((s) => s.shape_pt_sequence)) + 1
                    : 1,
                project_id: selectedEntities.trip.project_id,
                shape_dist_traveled: null,
              },
            ]);
          } else {
            setEditorMode("open");
          }
        });
      } else {
        setTempShapes((prev) => [
          ...prev,
          {
            shape_id: tempShapes[0].shape_id,
            shape_pt_lat: clickedCoords.lat,
            shape_pt_lon: clickedCoords.lng,
            shape_pt_sequence:
              prev.length > 0
                ? Math.max(...prev.map((s) => s.shape_pt_sequence)) + 1
                : 1,
            project_id: selectedEntities.trip.project_id,
            shape_dist_traveled: null,
          },
        ]);
      }
    } else if (editorMode === "add-stop") {
      Swal.fire({
        title: "Enter Stop Name",
        input: "text",
        inputAttributes: { autocapitalize: "off" },
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonText: "Cancel",
        showLoaderOnConfirm: true,
        preConfirm: (stopName) => {
          if (!stopName) {
            Swal.showValidationMessage(`Stop Name is required`);
          }
          return stopName;
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
        if (result.isConfirmed) {
          const stopName = result.value;
          const newStopId = `${
            selectedEntities.trip.trip_id
          }_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          setTempStopsAndTimes((prev) => [
            ...prev,
            {
              stop_id: newStopId,
              trip_id: selectedEntities.trip?.trip_id,
              stop_name: stopName,
              stop_lat: clickedCoords.lat,
              stop_lon: clickedCoords.lng,
              arrival_time: selectedEntities.trip ? "00:00:00" : undefined,
              departure_time: selectedEntities.trip ? "00:00:00" : undefined,
              stop_sequence:
                prev.length > 0
                  ? Math.max(...prev.map((s) => s.stop_sequence || 0)) + 1
                  : 1,
              project_id: selectedEntities.trip?.project_id,
            },
          ]);
        } else {
          setEditorMode("open");
        }
      });
    }
  }, [clickedCoords, editorMode, selectedEntities.trip]);

  useEffect(() => {
    if (editorMode === "add-stop") {
      Swal.fire({
        icon: "info",
        title: "Add Stop",
        text: "Click on the map to add a new stop.",
        toast: true,
        position: "top",
        showConfirmButton: false,
      });
    } else if (editorMode === "add-shape") {
      Swal.fire({
        icon: "info",
        title: "Add Shape Point",
        text: "Click on the map to add a shape point.",
        toast: true,
        position: "top",
        showConfirmButton: false,
      });
    }
  }, [editorMode]);

  const handleStopClick = (stopTime) => {
    setSelectedCategory("stop");
    setSelectedEntities((prev) => ({ ...prev, stop: stopTime }));
  };

  const handleShapeClick = (shape) => {
    setSelectedCategory("shape");
    setSelectedEntities((prev) => ({ ...prev, shape }));
  };

  const handleStopDrag = (e, stopSequence) => {
    if (editorMode === "close") return;
    const newLatLng = e.target.getLatLng();
    setTempStopsAndTimes((prev) =>
      prev.map((stopTime) =>
        stopTime.stop_sequence === stopSequence
          ? { ...stopTime, stop_lat: newLatLng.lat, stop_lon: newLatLng.lng }
          : stopTime
      )
    );
  };

  const handleShapeDrag = (e, shapePtSequence) => {
    if (editorMode === "close") return;
    const newLatLng = e.target.getLatLng();
    setTempShapes((prev) =>
      prev.map((shape) =>
        shape.shape_pt_sequence === shapePtSequence
          ? {
              ...shape,
              shape_pt_lat: newLatLng.lat,
              shape_pt_lon: newLatLng.lng,
            }
          : shape
      )
    );
  };

  const handleCalculateRoute = async () => {
    if (!tempStopsAndTimes.length) {
      Swal.fire("Error", "No stops to calculate route!", "error");
      return;
    }

    try {
      // İlk olarak stoplar arasındaki rotayı OSRM ile hesapla
      const routeData = await calculateRouteBetweenStops(
        tempStopsAndTimes,
        token
      );

      // OSRM ile şekilleri yola snap et
      const snappedShapes = await snapShapesToRoads(
        tempShapes.length > 0
          ? tempShapes
          : routeData.geometry.map((coord, index) => ({
              shape_id: parseInt(`1000${Date.now()}`),
              shape_pt_lat: coord[1],
              shape_pt_lon: coord[0],
              shape_pt_sequence: index + 1,
              project_id: selectedEntities.trip.project_id,
              shape_dist_traveled: null,
            })),
        token
      );

      setTempShapes(snappedShapes);
      Swal.fire(
        "Route Snap Success",
        `Distance: ${routeData.distance.toFixed(
          2
        )} km\nDuration: ${routeData.duration.toFixed(2)} min`,
        "success"
      );
    } catch (error) {
      console.error("Error snapping route:", error);
      Swal.fire(
        "Error",
        `Failed to snap route between stops: ${error.message}`,
        "error"
      );
    }
  };

  const defaultCenter = [51.505, -0.09];

  return (
    <MapContainer
      center={
        isValidLatLng(mapCenter[0], mapCenter[1]) ? mapCenter : defaultCenter
      }
      zoom={zoom}
      id="map"
      zoomControl={false}
      ref={mapRef}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />
      <MapUpdater mapCenter={mapCenter} zoom={zoom} />
      <BoundsTracker onBoundsChange={handleBoundsChange} />

      <MarkerClusterGroup
        maxClusterRadius={80}
        disableClusteringAtZoom={15}
        chunkedLoading={true}
        showCoverageOnHover={false}
      >
        {visibleStops.map((stopTime, index) => {
          const lat = parseFloat(stopTime.stop_lat);
          const lon = parseFloat(stopTime.stop_lon);
          if (!isValidLatLng(lat, lon)) return null;
          return (
            <Marker
              key={stopTime.stop_id || index}
              position={[lat, lon]}
              icon={stopIcon}
              draggable={editorMode !== "close"}
              eventHandlers={{
                click: () => handleStopClick(stopTime),
                dragend: (e) => handleStopDrag(e, stopTime.stop_sequence),
              }}
            >
              <Popup>
                <strong>
                  {stopTime.stop_sequence || index + 1}.{" "}
                  {stopTime.stop_name || "Bilinmeyen Durak"}
                </strong>
                <br />
                Varış:{" "}
                {stopTime.arrival_time ? stopTime.arrival_time : "Bilinmiyor"}
                <br />
                Kalkış:{" "}
                {stopTime.departure_time
                  ? stopTime.departure_time
                  : "Bilinmiyor"}
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {visibleShapes.length > 0 && (
        <>
          <PolylineWithDirectionalArrows
            positions={visibleShapes
              .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
              .filter((shape) =>
                isValidLatLng(
                  parseFloat(shape.shape_pt_lat),
                  parseFloat(shape.shape_pt_lon)
                )
              )
              .map((shape) => [
                parseFloat(shape.shape_pt_lat),
                parseFloat(shape.shape_pt_lon),
              ])}
            color={editorMode !== "close" ? "red" : "#FF0000"}
            weight={8}
          />
          {editorMode !== "close" &&
            visibleShapes.map((shape) => {
              const lat = parseFloat(shape.shape_pt_lat);
              const lon = parseFloat(shape.shape_pt_lon);
              if (!isValidLatLng(lat, lon)) return null;
              const position = [lat, lon];
              const isHighlighted =
                shape.shape_pt_sequence ===
                selectedEntities.shape?.shape_pt_sequence;
              return (
                <Marker
                  key={shape.shape_pt_sequence}
                  position={position}
                  draggable={editorMode !== "close"}
                  icon={L.divIcon({
                    className: "custom-circle-marker",
                    iconSize: [
                      isHighlighted ? 20 : 12,
                      isHighlighted ? 20 : 12,
                    ],
                    iconAnchor: [
                      isHighlighted ? 10 : 6,
                      isHighlighted ? 10 : 6,
                    ],
                    html: `<div style="${
                      isHighlighted
                        ? "background-color: yellow; border: 2px solid yellow;"
                        : "background-color: white; border: 1px solid red;"
                    } width: 100%; height: 100%; border-radius: 50%;"></div>`,
                  })}
                  eventHandlers={{
                    dragend: (e) => handleShapeDrag(e, shape.shape_pt_sequence),
                    click: () => handleShapeClick(shape),
                  }}
                >
                  <Popup>Shape Point {shape.shape_pt_sequence}</Popup>
                </Marker>
              );
            })}
        </>
      )}

      {editorMode !== "close" && (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
          {tempStopsAndTimes.length > 1 && (
            <button
              onClick={handleCalculateRoute}
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Snap The Route
            </button>
          )}
        </div>
      )}
    </MapContainer>
  );
};

MapView.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  stopsAndTimes: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
    .isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  setShapes: PropTypes.func.isRequired,
  onMapClick: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
  clickedCoords: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  editorMode: PropTypes.string.isRequired,
  setEditorMode: PropTypes.func.isRequired,
  selectedEntities: PropTypes.object.isRequired,
  setSelectedEntities: PropTypes.func.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
};

BoundsTracker.propTypes = {
  onBoundsChange: PropTypes.func.isRequired,
};

export default MapView;
