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
import { saveMultipleShapes } from "../../api/shapeApi.js";
import { CaretUpFill } from "react-bootstrap-icons";
import { renderToString } from "react-dom/server";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet-polylinedecorator";
import "leaflet.markercluster";

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

const ClusterLayer = ({ stops, editorMode, onStopClick, onStopDrag }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !stops || stops.length === 0) return;

    const markers = L.markerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 15,
      chunkedLoading: true,
      showCoverageOnHover: false,
    });

    stops
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .forEach((stopTime, index) => {
        if (
          stopTime?.stop_lat !== undefined &&
          stopTime?.stop_lon !== undefined &&
          !isNaN(parseFloat(stopTime.stop_lat)) &&
          !isNaN(parseFloat(stopTime.stop_lon))
        ) {
          const marker = L.marker(
            [parseFloat(stopTime.stop_lat), parseFloat(stopTime.stop_lon)],
            {
              icon: stopIcon,
              draggable: editorMode !== "close",
            }
          )
            .bindPopup(
              stopTime.arrival_time && stopTime.departure_time
                ? `${stopTime.stop_sequence}. ${
                    stopTime.stop_name || "Bilinmeyen Durak"
                  }<br />Varış: ${
                    stopTime.arrival_time || "Bilinmiyor"
                  }<br />Kalkış: ${stopTime.departure_time || "Bilinmiyor"}`
                : `${stopTime.stop_sequence}. ${
                    stopTime.stop_name || "Bilinmeyen Durak"
                  }`
            )
            .on("dragend", (e) => onStopDrag(e, stopTime.stop_sequence))
            .on("click", () => onStopClick(stopTime));
          markers.addLayer(marker);
        } else {
          console.warn("Invalid stop data:", stopTime);
        }
      });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [map, stops, editorMode, onStopClick, onStopDrag]);

  return null;
};

ClusterLayer.propTypes = {
  stops: PropTypes.array.isRequired,
  editorMode: PropTypes.string.isRequired,
  onStopClick: PropTypes.func.isRequired,
  onStopDrag: PropTypes.func.isRequired,
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
  const [routeInfo, setRouteInfo] = useState(null);
  const prevClickedCoords = useRef(null);

  useEffect(() => {
    const filteredStops = (stopsAndTimes || []).map((stop) => ({
      stop_name: stop.stop_name,
      stop_lat: stop.stop_lat,
      stop_lon: stop.stop_lon,
      stop_sequence: stop.stop_sequence || 1,
    }));
    setTempStopsAndTimes(filteredStops);
    setTempShapes(JSON.parse(JSON.stringify(shapes || [])));
  }, [stopsAndTimes, shapes]);

  useEffect(() => {
    if (selectedEntities.trip) {
      setTempStopsAndTimes(JSON.parse(JSON.stringify(stopsAndTimes || [])));
    }
  }, [selectedEntities.trip, stopsAndTimes]);

  useEffect(() => {
    if (editorMode === "save") {
      setStopsAndTimes(tempStopsAndTimes);
      setShapes(tempShapes);
      saveMultipleShapes(tempShapes, selectedEntities.trip.trip_id, token);
      saveMultipleStopsAndTimes(tempStopsAndTimes, token);
      setEditorMode("close");
    } else if (editorMode === "close" && selectedEntities.trip) {
      setTempStopsAndTimes(JSON.parse(JSON.stringify(stopsAndTimes || [])));
      setTempShapes(JSON.parse(JSON.stringify(shapes || [])));
    }
  }, [editorMode, selectedEntities.trip, token]);

  useEffect(() => {
    if (!clickedCoords || clickedCoords === prevClickedCoords.current) return;

    prevClickedCoords.current = clickedCoords;

    if (editorMode === "add-shape") {
      if (tempShapes.length === 0) {
        Swal.fire({
          title: "Enter Shape ID",
          input: "text",
          inputAttributes: { autocapitalize: "off" },
          showCancelButton: true,
          confirmButtonText: "Save",
          cancelButtonText: "Cancel",
          showLoaderOnConfirm: true,
          preConfirm: (shapeId) => {
            if (!shapeId) {
              Swal.showValidationMessage(`Shape ID is required`);
            }
            return shapeId;
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
          setTempStopsAndTimes((prev) => [
            ...prev,
            {
              trip_id: selectedEntities.trip?.trip_id,
              stop_name: stopName,
              stop_lat: clickedCoords.lat,
              stop_lon: clickedCoords.lng,
              arrival_time: selectedEntities.trip ? "00:00:00" : undefined,
              departure_time: selectedEntities.trip ? "00:00:00" : undefined,
              stop_sequence:
                prev.length > 0
                  ? Math.max(...prev.map((s) => s.stop_sequence)) + 1
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
      const routeData = await calculateRouteBetweenStops(
        tempStopsAndTimes,
        token
      );
      setRouteInfo(routeData);
      Swal.fire(
        "Route Snap Success",
        `Distance: ${routeData.distance.toFixed(
          2
        )} km\nDuration: ${routeData.duration.toFixed(2)} min`,
        "success"
      );

      const routeShapes = routeData.geometry.map((coord, index) => ({
        shape_id: tempShapes[0]?.shape_id || `route-${Date.now()}`,
        shape_pt_lat: coord[1],
        shape_pt_lon: coord[0],
        shape_pt_sequence: index + 1,
        project_id: selectedEntities.trip.project_id,
        shape_dist_traveled: null,
      }));
      setTempShapes(routeShapes);
    } catch (error) {
      console.error("Error snaping route:", error);
      Swal.fire("Error", "Failed to snaps route between stops.", "error");
    }
  };

  return (
    <MapContainer center={mapCenter} zoom={zoom} id="map" zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />
      <MapUpdater mapCenter={mapCenter} zoom={zoom} />
      <ClusterLayer
        stops={tempStopsAndTimes}
        editorMode={editorMode}
        onStopClick={handleStopClick}
        onStopDrag={handleStopDrag}
      />

      {/* Şekiller */}
      {tempShapes.length > 0 && (
        <>
          <PolylineWithDirectionalArrows
            positions={tempShapes
              .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
              .map((shape) => [
                parseFloat(shape.shape_pt_lat),
                parseFloat(shape.shape_pt_lon),
              ])}
            color={editorMode !== "close" ? "red" : "#FF0000"}
            weight={8}
          />
          {editorMode !== "close" &&
            tempShapes.map((shape) => {
              const position = [
                parseFloat(shape.shape_pt_lat),
                parseFloat(shape.shape_pt_lon),
              ];
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

export default MapView;
