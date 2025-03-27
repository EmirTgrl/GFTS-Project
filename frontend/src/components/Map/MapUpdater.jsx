import { useEffect } from "react";
import { useMap } from "react-leaflet";
import PropTypes from "prop-types";

const MapUpdater = ({ mapCenter, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (
      mapCenter &&
      mapCenter.length === 2 &&
      !isNaN(mapCenter[0]) &&
      !isNaN(mapCenter[1])
    ) {
      map.setView(mapCenter, zoom);
    }
  }, [mapCenter, zoom, map]);

  return null;
};

MapUpdater.propTypes = {
  mapCenter: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
};

export default MapUpdater;
