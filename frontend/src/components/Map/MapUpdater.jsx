import { useEffect } from "react";
import { useMap } from "react-leaflet";
import PropTypes from "prop-types";

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      center[0] &&
      center[1] &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
};

export default MapUpdater;
