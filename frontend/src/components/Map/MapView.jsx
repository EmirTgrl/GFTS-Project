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
import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import MapUpdater from "./MapUpdater.jsx";
import Swal from 'sweetalert2';
import {saveMultipleStopsAndTimes} from "../../api/stopTimeApi.js"
import {saveMultipleShapes} from "../../api/shapeApi.js"
import { CaretUpFill } from 'react-bootstrap-icons';
import { renderToString } from 'react-dom/server';

// Import the plugin
import 'leaflet-polylinedecorator';

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
  isStopTimeAddOpen,
  editorMode,
  setEditorMode,
  selectedEntities,
  setSelectedEntities,
  token,
  setSelectedCategory
}) => {
  const [tempStopsAndTimes, setTempStopsAndTimes] = useState([]);
  const [tempShapes, setTempShapes] = useState([]);
  
  useEffect(()=>{
    setTempStopsAndTimes(JSON.parse(JSON.stringify(stopsAndTimes)));
    setTempShapes(JSON.parse(JSON.stringify(shapes)));
  },[stopsAndTimes, shapes])

  useEffect(() => {

    if (editorMode === "save") {
      setStopsAndTimes(tempStopsAndTimes)
      setShapes(tempShapes)
      saveMultipleShapes(tempShapes, selectedEntities.trip.trip_id ,token)
      saveMultipleStopsAndTimes(tempStopsAndTimes,token)
      setEditorMode("close")
    }
    if (editorMode === "close") {
      setTempStopsAndTimes(JSON.parse(JSON.stringify(stopsAndTimes)));
      setTempShapes(JSON.parse(JSON.stringify(shapes)));
    }
  }, [editorMode,]);

  useEffect(()=>{
    
    if(editorMode === "add-shape"){
      if (tempShapes.length === 0) {
        // Prompt the user to enter a shape ID using SweetAlert2.
        Swal.fire({
          title: 'Enter Shape ID',
          input: 'text',
          inputAttributes: {
            autocapitalize: 'off'
          },
          showCancelButton: true,
          confirmButtonText: 'Save',
          cancelButtonText: 'Cancel',
          showLoaderOnConfirm: true,
          preConfirm: (shapeId) => {
            if (!shapeId) {
              Swal.showValidationMessage(`Shape ID is required`);
            }
            return shapeId;
          },
          allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
          if (result.isConfirmed) {
            const shapeId = result.value;
            setTempShapes(prev => [...prev,{
              shape_id: shapeId, // Use the provided shape ID
              shape_pt_lat:clickedCoords.lat,
              shape_pt_lon:clickedCoords.lng,
              shape_pt_sequence: tempShapes.length>0? Math.max(...tempShapes.map(shape=> shape.shape_pt_sequence)) + 1 : 1,
              project_id:selectedEntities.trip.project_id,
              shape_dist_traveled:null,
            }]);
          } else {
            // User cancelled, so exit add-shape mode.
            setEditorMode("open");
          }
        });
      }
      else {
        setTempShapes(prev => [...prev,{
          shape_id: tempShapes[0].shape_id,
          shape_pt_lat:clickedCoords.lat,
          shape_pt_lon:clickedCoords.lng,
          shape_pt_sequence: tempShapes.length>0? Math.max(...tempShapes.map(shape=> shape.shape_pt_sequence)) + 1 : 1,
          project_id:selectedEntities.trip.project_id,
          shape_dist_traveled:null,
        }])
      }}
      if(editorMode === "add-stop"){
        Swal.fire({
            title: 'Enter Stop Name',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: (stopName) => {
                if (!stopName) {
                    Swal.showValidationMessage(`Stop Name is required`);
                }
                return stopName;
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                const stopName = result.value;
                setTempStopsAndTimes(prev => [...prev, {
                    trip_id: selectedEntities.trip.trip_id,
                    stop_name: stopName,
                    stop_lat: clickedCoords.lat,
                    stop_lon: clickedCoords.lng,
                    arrival_time: "00:00:00",
                    departure_time: "00:00:00",
                    stop_sequence: tempStopsAndTimes.length > 0 ? Math.max(...tempStopsAndTimes.map(stop => stop.stop_sequence)) + 1 : 1,
                    project_id: selectedEntities.trip.project_id,
                }]);
            } else {
                setEditorMode("open");
            }
        });
    }
  },[clickedCoords,])

  useEffect(() => {
    if (editorMode === "add-stop") {
      Swal.fire({ // Use Swal.fire
        icon: 'info',
        title: 'Add Stop',
        text: 'Click on the map to add a new stop.',
        toast: true,
        position: 'top',
        showConfirmButton: false,
      });
    }
    if (editorMode === "add-shape") {
      Swal.fire({ // Use Swal.fire
        icon: 'info',
        title: 'Add Shape Point',
        text: 'Click on the map to add a shape point.',
        toast: true,
        position: 'top',
        showConfirmButton: false,
      });
    }

  }, [editorMode]);

  const handleStopClick = (stopTime) => {
    setSelectedCategory("stop");
    setSelectedEntities({...selectedEntities, stop: stopTime});
  };

  const handleShapeClick = (shape) => {
    setSelectedCategory("shape");
    setSelectedEntities({...selectedEntities, shape: shape});
  };

  const handleStopDrag = (e, stopSequence) => {
    if (editorMode === "close") return;

    const newLatLng = e.target.getLatLng();

    setTempStopsAndTimes((prevStopsAndTimes) =>
      prevStopsAndTimes.map((stopTime) => {
        if (stopTime.stop_sequence === stopSequence) {
          return {
            ...stopTime,
            stop_lat: newLatLng.lat,
            stop_lon: newLatLng.lng,
          };
        }
        return stopTime;
      })
    );
  };
  const handleShapeDrag = (e, shapePtSequence) => {
    if (editorMode === "close") return;

    const newLatLng = e.target.getLatLng();
      setTempShapes(prevShapes =>
          prevShapes.map(shape => {
              if(shape.shape_pt_sequence === shapePtSequence){
                  return {
                      ...shape,
                      shape_pt_lat : newLatLng.lat,
                      shape_pt_lon : newLatLng.lng
                  }
              }
              return shape;
          })
      );
  };


function PolylineWithDirectionalArrows({ positions, color, weight }) {
  const map = useMap();
  const decoratorRef = useRef(null);

  useEffect(() => {
    if (!map || !positions || positions.length < 2) {
      return;
    }

    // Remove previous decorator if it exists
    if (decoratorRef.current) {
      map.removeLayer(decoratorRef.current);
    }

    const decorator = L.polylineDecorator(positions, {
      patterns: [
        {
          offset: 20, // Adjust starting position
          repeat: 50, // Adjust spacing of the arrows
          symbol: L.Symbol.marker({
            rotate: true,
            markerOptions: {
              icon: L.divIcon({
                className: 'arrow-icon',
                html: renderToString(<CaretUpFill color="white" />),
                iconSize: [12, 12], // Size of the icon
                iconAnchor: [6, 6], // Anchor point
              }),
            },
          }),
        },
      ],
    }).addTo(map);

    decoratorRef.current = decorator; // Store the decorator for cleanup

    return () => {
      if (decorator) {
        map.removeLayer(decorator);
      }
    };
  }, [map, positions]);
  return (
    <Polyline
      positions={positions}
      color={color}
      weight={weight}
    />
  );
}

  return (
    <MapContainer center={mapCenter} zoom={zoom} id="map" zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />
      <MapUpdater mapCenter={mapCenter} zoom={zoom} />

      {tempStopsAndTimes.length > 0 &&
        tempStopsAndTimes
          .sort((a, b) => a.stop_sequence - b.stop_sequence)
          .map((stopTime, stop_sequence) => {
            if (stopTime && stopTime.stop_lat && stopTime.stop_lon) {
              return (
                <Marker
                  draggable={editorMode !== "close"}
                  key={`${stop_sequence}`}
                  position={[
                    parseFloat(stopTime.stop_lat),
                    parseFloat(stopTime.stop_lon),
                  ]}
                  icon={stopIcon}
                  eventHandlers={{
                    dragend: (e) => handleStopDrag(e, stopTime.stop_sequence),
                    click: () => handleStopClick(stopTime)
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

      {tempShapes.length > 0 && (
        <>
          <PolylineWithDirectionalArrows
            positions={tempShapes
              .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
              .map((shape) => [
                parseFloat(shape.shape_pt_lat),
                parseFloat(shape.shape_pt_lon),
              ])}
            color={editorMode !== "close" ? "red" : "#FF0000"} // Conditional color
            weight={8}
            
          />
          {editorMode !== "close" &&
            tempShapes.map((shape) => {
              const position = [
                parseFloat(shape.shape_pt_lat),
                parseFloat(shape.shape_pt_lon),
              ];
              const isHighlighted = shape.shape_pt_sequence === selectedEntities.shape?.shape_pt_sequence;
              return (
                <Marker
                  key={shape.shape_pt_sequence}
                  position={position}
                  draggable={editorMode !== "close"}
                  icon={L.divIcon({
                    className: 'custom-circle-marker', // Important for styling!
                    iconSize: [isHighlighted ? 20 : 12, isHighlighted ? 20 : 12], // Double the radius for diameter
                    iconAnchor: [isHighlighted ? 10 : 6, isHighlighted ? 10 : 6], // Anchor in the center
                    html: `<div style="${isHighlighted
                        ? 'background-color: yellow; border: 2px solid yellow;'
                        : 'background-color: white; border: 1px solid red;'
                      } width: 100%; height: 100%; border-radius: 50%;"></div>`,
                  })}
                  eventHandlers={{
                    dragend: (e) => handleShapeDrag(e, shape.shape_pt_sequence),
                    click: ()=> handleShapeClick(shape)
                  }}
                >
                  <Popup>Shape Point {shape.shape_pt_sequence}</Popup>
                </Marker>
              );
            })}
        </>
      )}


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

};

export default MapView;