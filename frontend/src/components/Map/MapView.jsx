import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
  useMap,
  CircleMarker,
} from "react-leaflet";
import { useEffect, useState } from "react"; 
import PropTypes from "prop-types";
import L from "leaflet";
import MapUpdater from "./MapUpdater.jsx";

const stopIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const clickIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -32],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [32, 32],
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

const ShapeLayer = ({ shapes, editorMode, selectedShape }) => {
  const map = useMap();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const shapePositions = shapes
    .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
    .map((shape) => {
      const lat = parseFloat(shape.shape_pt_lat);
      const lon = parseFloat(shape.shape_pt_lon);
      return [lat, lon];
    })
    .filter((pos) => pos[0] && pos[1] && !isNaN(pos[0]) && !isNaN(pos[1]));

  useEffect(() => {
    if (shapePositions.length > 0 && isInitialLoad) {
      const bounds = L.latLngBounds(shapePositions);
      map.fitBounds(bounds, { padding: [50, 50] });
      setIsInitialLoad(false);
    }
  }, [shapePositions, map, isInitialLoad]);

  if (shapePositions.length === 0) {
    return null;
  }

  const isSelected = (shape, selectedShape) => {
    return (
      selectedShape &&
      shape.shape_pt_sequence === selectedShape.shape_pt_sequence
    );
  };

  if (editorMode !== "close") {
    return (
      <>
        <Polyline positions={shapePositions} color="red" weight={5} />
        {shapes.map((shape, index) => {
          const position = [
            parseFloat(shape.shape_pt_lat),
            parseFloat(shape.shape_pt_lon),
          ];
          const isHighlighted = isSelected(shape, selectedShape);
          return (
            <CircleMarker
              key={`shape-point-${index}`}
              center={position}
              radius={isHighlighted ? 12 : 4}
              fillColor={isHighlighted ? "#0066FF" : "#808080"}
              color={isHighlighted ? "#0066FF" : "#808080"}
              weight={isHighlighted ? 4 : 1}
              opacity={1}
              fillOpacity={isHighlighted ? 1 : 0.3}
              pane={isHighlighted ? "markerPane" : "overlayPane"}
            >
              <Popup>Shape Point {shape.shape_pt_sequence}</Popup>
            </CircleMarker>
          );
        })}
      </>
    );
  } else {
    return <Polyline positions={shapePositions} color="#FF0000" weight={5} />;
  }
};

ShapeLayer.propTypes = {
  shapes: PropTypes.array.isRequired,
  editorMode: PropTypes.string.isRequired,
  selectedShape: PropTypes.object, // Yeni prop eklendi
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
  isStopTimeAddOpen,
  editorMode,
  setEditorMode,
  selectedShape, // Yeni prop eklendi
}) => {
  return (
    <MapContainer center={mapCenter} zoom={zoom} id="map" zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />
      <MapUpdater mapCenter={mapCenter} zoom={zoom} />

      {isStopTimeAddOpen &&
        clickedCoords &&
        clickedCoords.lat &&
        clickedCoords.lng && (
          <Marker
            position={[clickedCoords.lat, clickedCoords.lng]}
            icon={clickIcon}
          >
            <Popup>Tıkladığınız yer burası!</Popup>
          </Marker>
        )}

      {stopsAndTimes.length > 0 &&
        stopsAndTimes
          .sort((a, b) => a.stop_sequence - b.stop_sequence)
          .map((stopTime) => {
            if (stopTime && stopTime.stop_lat && stopTime.stop_lon) {
              return (
                <Marker
                  key={`${stopTime.stop_id}`}
                  position={[
                    parseFloat(stopTime.stop_lat),
                    parseFloat(stopTime.stop_lon),
                  ]}
                  icon={stopIcon}
                >
                  <Popup>
                    {stopTime.stop_sequence}.{" "}
                    {stopTime.stop_name || "Bilinmeyen Durak"} <br />
                    Varış: {stopTime.arrival_time || "Bilinmiyor"} <br />
                    Kalkış: {stopTime.departure_time || "Bilinmiyor"}
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

      <ShapeLayer
        shapes={shapes}
        editorMode={editorMode}
        selectedShape={selectedShape}
      />
    </MapContainer>
  );
};

MapView.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  stopsAndTimes: PropTypes.array.isRequired,
  selectedTrip: PropTypes.string,
  onMapClick: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
  clickedCoords: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  isStopTimeAddOpen: PropTypes.bool.isRequired,
  editorMode: PropTypes.string.isRequired,
  setEditorMode: PropTypes.func.isRequired,
  selectedShape: PropTypes.object,
};

export default MapView;
