import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import MapUpdater from "./MapUpdater.jsx";
import Swal from "sweetalert2";
import { saveMultipleStopsAndTimes } from "../../api/stopTimeApi.js";
import { saveMultipleShapes } from "../../api/shapeApi.js";
import { CaretUpFill } from "react-bootstrap-icons";
import { renderToString } from "react-dom/server";
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
  const prevStopsAndTimesRef = useRef([]);

  useEffect(() => {
    if (
      !selectedEntities.trip?.trip_id ||
      !Array.isArray(stopsAndTimes) ||
      stopsAndTimes.length === 0
    )
      return;

    const tripId = parseInt(selectedEntities.trip.trip_id, 10);
    const currentTripStops = stopsAndTimes
      .filter((st) => parseInt(st.trip_id, 10) === tripId)
      .sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));

    const prevTripStops = prevStopsAndTimesRef.current
      .filter((st) => parseInt(st.trip_id, 10) === tripId)
      .sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0));

    if (prevTripStops.length === 0) {
      prevStopsAndTimesRef.current = [...stopsAndTimes];
      return;
    }

    const hasSequenceChanged = currentTripStops.some((current, index) => {
      const prev = prevTripStops[index];
      return prev && current.stop_sequence !== prev.stop_sequence;
    });

    if (!hasSequenceChanged) return;

    const originalCoords = prevTripStops.map((stop) => ({
      lat: parseFloat(stop.stop_lat),
      lon: parseFloat(stop.stop_lon),
    }));

    const updatedStopsAndTimes = stopsAndTimes.map((stop) => {
      if (parseInt(stop.trip_id, 10) === tripId) {
        const newIndex = (stop.stop_sequence || 1) - 1;
        const newCoords = originalCoords[newIndex] || {
          lat: parseFloat(stop.stop_lat),
          lon: parseFloat(stop.stop_lon),
        };
        return {
          ...stop,
          stop_lat: newCoords.lat,
          stop_lon: newCoords.lon,
        };
      }
      return stop;
    });

    setStopsAndTimes(updatedStopsAndTimes);
    prevStopsAndTimesRef.current = [...updatedStopsAndTimes];
  }, [stopsAndTimes, selectedEntities.trip, setStopsAndTimes]);

  useEffect(() => {
    if (editorMode === "save" && Array.isArray(stopsAndTimes) && shapes) {
      saveMultipleShapes(shapes, selectedEntities.trip?.trip_id, token);
      saveMultipleStopsAndTimes(stopsAndTimes, token);
      setSelectedEntities((prev) => ({ ...prev, stop: null }));
      setEditorMode("close");
    }
  }, [
    editorMode,
    shapes,
    stopsAndTimes,
    selectedEntities,
    setEditorMode,
    setSelectedEntities,
    token,
  ]);

  useEffect(() => {
    if (!clickedCoords || !selectedEntities.trip?.trip_id) return;

    if (editorMode === "add-shape") {
      if (!Array.isArray(shapes)) return;
      if (shapes.length === 0) {
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
            setShapes((prev) => [
              ...(Array.isArray(prev) ? prev : []),
              {
                shape_id: shapeId,
                shape_pt_lat: clickedCoords.lat,
                shape_pt_lon: clickedCoords.lng,
                shape_pt_sequence:
                  shapes.length > 0
                    ? Math.max(
                        ...shapes.map((shape) => shape.shape_pt_sequence || 0)
                      ) + 1
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
        setShapes((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          {
            shape_id: shapes[0]?.shape_id || "default",
            shape_pt_lat: clickedCoords.lat,
            shape_pt_lon: clickedCoords.lng,
            shape_pt_sequence:
              shapes.length > 0
                ? Math.max(
                    ...shapes.map((shape) => shape.shape_pt_sequence || 0)
                  ) + 1
                : 1,
            project_id: selectedEntities.trip.project_id,
            shape_dist_traveled: null,
          },
        ]);
      }
    }

    if (editorMode === "add-stop") {
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
          setStopsAndTimes((prev) => [
            ...(Array.isArray(prev) ? prev : []),
            {
              trip_id: selectedEntities.trip.trip_id,
              stop_name: stopName,
              stop_lat: clickedCoords.lat,
              stop_lon: clickedCoords.lng,
              arrival_time: "00:00:00",
              departure_time: "00:00:00",
              stop_sequence:
                prev.length > 0
                  ? Math.max(...prev.map((stop) => stop.stop_sequence || 0)) + 1
                  : 1,
              project_id: selectedEntities.trip.project_id,
            },
          ]);
        } else {
          setEditorMode("open");
        }
      });
    }
  }, [
    clickedCoords,
    editorMode,
    shapes,
    stopsAndTimes,
    selectedEntities,
    setShapes,
    setStopsAndTimes,
    setEditorMode,
  ]);

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
    }
    if (editorMode === "add-shape") {
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
    if (editorMode === "close" || !Array.isArray(stopsAndTimes)) return;
    const newLatLng = e.target.getLatLng();
    setStopsAndTimes((prev) =>
      prev.map((stopTime) =>
        stopTime.stop_sequence === stopSequence
          ? { ...stopTime, stop_lat: newLatLng.lat, stop_lon: newLatLng.lng }
          : stopTime
      )
    );
  };

  const handleShapeDrag = (e, shapePtSequence) => {
    if (editorMode === "close" || !Array.isArray(shapes)) return;
    const newLatLng = e.target.getLatLng();
    setShapes((prev) =>
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

  function PolylineWithDirectionalArrows({ positions, color, weight }) {
    const map = useMap();
    const decoratorRef = useRef(null);

    useEffect(() => {
      if (!map || !Array.isArray(positions) || positions.length < 2) return;

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
    positions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
      .isRequired,
    color: PropTypes.string.isRequired,
    weight: PropTypes.number.isRequired,
  };

  return (
    <MapContainer
      center={mapCenter || [0, 0]}
      zoom={zoom || 13}
      id="map"
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />
      <MapUpdater mapCenter={mapCenter || [0, 0]} zoom={zoom || 13} />
      {Array.isArray(stopsAndTimes) &&
        stopsAndTimes.length > 0 &&
        stopsAndTimes
          .filter(
            (st) =>
              parseInt(st.trip_id, 10) ===
                parseInt(selectedEntities.trip?.trip_id, 10) &&
              st.stop_lat &&
              st.stop_lon
          )
          .sort((a, b) => (a.stop_sequence || 0) - (b.stop_sequence || 0))
          .map((stopTime) => (
            <Marker
              draggable={editorMode !== "close"}
              key={`${stopTime.stop_id || "unknown"}-${
                stopTime.trip_id || "unknown"
              }-${stopTime.stop_sequence || 0}`}
              position={[
                parseFloat(stopTime.stop_lat),
                parseFloat(stopTime.stop_lon),
              ]}
              icon={stopIcon}
              eventHandlers={{
                dragend: (e) => handleStopDrag(e, stopTime.stop_sequence),
                click: () => handleStopClick(stopTime),
              }}
            >
              <Popup>
                {stopTime.stop_sequence || "N/A"}.{" "}
                {stopTime.stop_name || "Bilinmeyen Durak"} <br />
                Varış: {stopTime.arrival_time || "Bilinmiyor"} <br />
                Kalkış: {stopTime.departure_time || "Bilinmiyor"}
              </Popup>
            </Marker>
          ))}

      {Array.isArray(shapes) && shapes.length > 0 && (
        <>
          <PolylineWithDirectionalArrows
            positions={shapes
              .sort(
                (a, b) =>
                  (a.shape_pt_sequence || 0) - (b.shape_pt_sequence || 0)
              )
              .map((shape) => [
                parseFloat(shape.shape_pt_lat || 0),
                parseFloat(shape.shape_pt_lon || 0),
              ])}
            color={editorMode !== "close" ? "red" : "#FF0000"}
            weight={8}
          />
          {editorMode !== "close" &&
            shapes.map((shape) => {
              const position = [
                parseFloat(shape.shape_pt_lat || 0),
                parseFloat(shape.shape_pt_lon || 0),
              ];
              const isHighlighted =
                shape.shape_pt_sequence ===
                selectedEntities.shape?.shape_pt_sequence;
              return (
                <Marker
                  key={shape.shape_pt_sequence || "unknown"}
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
                  <Popup>Shape Point {shape.shape_pt_sequence || "N/A"}</Popup>
                </Marker>
              );
            })}
        </>
      )}
    </MapContainer>
  );
};

MapView.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  stopsAndTimes: PropTypes.array,
  setStopsAndTimes: PropTypes.func.isRequired,
  setShapes: PropTypes.func.isRequired,
  onMapClick: PropTypes.func.isRequired,
  shapes: PropTypes.array,
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

MapView.defaultProps = {
  mapCenter: [0, 0],
  zoom: 13,
  stopsAndTimes: [],
  shapes: [],
};

export default MapView;
