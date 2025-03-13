import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import Swal from "sweetalert2";

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

const tempStopIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", 
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const MapClickHandler = ({
  onMapClick,
  isEditModeOpen,
  onStopUpdate,
  clearTempStop,
}) => {
  const map = useMap();
  useMapEvents({
    click(e) {
      if (isEditModeOpen) {
        const { lat, lng } = e.latlng;
        Swal.fire({
          title: "Durağı buraya güncelleyecek misiniz?",
          text: `Yeni Konum: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Evet",
          cancelButtonText: "Hayır",
        }).then((result) => {
          if (result.isConfirmed) {
            onStopUpdate({ lat, lng }); 
            clearTempStop(); 
          } else {
            clearTempStop(); 
          }
        });
      } else {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

MapClickHandler.propTypes = {
  onMapClick: PropTypes.func.isRequired,
  isEditModeOpen: PropTypes.bool.isRequired,
  onStopUpdate: PropTypes.func.isRequired, 
  clearTempStop: PropTypes.func.isRequired,
};

const ShapeLayer = ({ shapes }) => {
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
  setStopsAndTimes,
  setShapes,
  onMapClick,
  shapes,
  clickedCoords,
  isEditModeOpen,
  onStopUpdate,
}) => {
  const [tempStop, setTempStop] = useState(null);

  const handleStopClick = (stop) => {
    if (isEditModeOpen) {
      setTempStop({
        ...stop,
        stop_lat: parseFloat(stop.stop_lat),
        stop_lon: parseFloat(stop.stop_lon),
      });
    }
  };

  const handleDragEnd = (e) => {
    if (tempStop) {
      const newLatLng = e.target.getLatLng();
      setTempStop((prev) => ({
        ...prev,
        stop_lat: newLatLng.lat,
        stop_lon: newLatLng.lng,
      }));
    }
  };

  const clearTempStop = () => {
    setTempStop(null);
  };

  return (
    <MapContainer center={mapCenter} zoom={zoom} id="map" zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler
        onMapClick={onMapClick}
        isEditModeOpen={isEditModeOpen}
        onStopUpdate={onStopUpdate}
        clearTempStop={clearTempStop}
      />

      {isEditModeOpen &&
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
                  eventHandlers={{
                    click: () => handleStopClick(stopTime),
                  }}
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

      {tempStop && isEditModeOpen && (
        <Marker
          position={[tempStop.stop_lat, tempStop.stop_lon]}
          icon={tempStopIcon}
          draggable={true}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        >
          <Popup>
            Güncellenen Durak: {tempStop.stop_name} <br />
            Yeni Konum: {tempStop.stop_lat.toFixed(6)},{" "}
            {tempStop.stop_lon.toFixed(6)}
          </Popup>
        </Marker>
      )}

      <ShapeLayer shapes={shapes} />
    </MapContainer>
  );
};

MapView.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  stopsAndTimes: PropTypes.array.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  setShapes: PropTypes.func.isRequired,
  onMapClick: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
  clickedCoords: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  isEditModeOpen: PropTypes.bool.isRequired,
  onStopUpdate: PropTypes.func.isRequired,
};

export default MapView;
