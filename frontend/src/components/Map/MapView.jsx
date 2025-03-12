import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react"; // useState ekledim
import PropTypes from "prop-types";
import L from "leaflet";

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

const ShapeLayer = ({ shapes }) => {
  const map = useMap();
  const [isInitialLoad, setIsInitialLoad] = useState(true); // İlk yükleme kontrolü

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
      // Sadece ilk yüklemede çalışır
      const bounds = L.latLngBounds(shapePositions);
      map.fitBounds(bounds, { padding: [50, 50] });
      setIsInitialLoad(false); // İlk yükleme bitti
    }
  }, [shapePositions, map, isInitialLoad]);

  return shapePositions.length > 0 ? (
    <Polyline positions={shapePositions} color="#FF0000" weight={5} />
  ) : null;
};

ShapeLayer.propTypes = {
  shapes: PropTypes.array.isRequired,
};

const MapView = ({
  mapCenter,
  zoom,
  stopsAndTimes,
  selectedTrip,
  onMapClick,
  shapes,
  clickedCoords,
  isStopTimeAddOpen,
}) => {
  return (
    <MapContainer center={mapCenter} zoom={zoom} id="map" zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />

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
                  key={`${stopTime.stop_id}-${selectedTrip}`}
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

      <ShapeLayer shapes={shapes} />
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
};

export default MapView;
