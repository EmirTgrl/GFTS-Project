import { useState } from "react";
import { TextField, Button, List, ListItem, ListItemText } from "@mui/material";
import { useContext } from "react";
import { AuthContext } from "../Auth/AuthContext";
import MapView from "./MapView";

const OtpPage = () => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  const [itineraries, setItineraries] = useState([]);
  const [error, setError] = useState(null);
  const [showTripPanel, setShowTripPanel] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoutePlan = (routeData) => {
    setItineraries(routeData || []);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
  };

  return (
    <div className="form-container">
      <h2>Trip Planning</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      <MapView
        mapCenter={[39.9255, 32.8663]}
        zoom={6}
        stopsAndTimes={{ data: [], total: 0 }}
        setStopsAndTimes={() => {}}
        setShapes={() => {}}
        onMapClick={() => {}}
        shapes={[]}
        clickedCoords={null}
        editorMode="view"
        setEditorMode={() => {}}
        selectedEntities={{
          agency: null,
          route: null,
          calendar: null,
          trip: null,
          stop: null,
        }}
        setSelectedEntities={() => {}}
        token={token}
        setSelectedCategory={() => {}}
        project_id="123"
        areas={[]}
        allStops={[]}
        openStopTimeAdd={() => {}}
        onRoutePlan={handleRoutePlan}
        showTripPanel={showTripPanel}
        setShowTripPanel={setShowTripPanel}
      />
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <TextField
            label="Tarih"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />
        </div>
        <div className="mb-2">
          <TextField
            label="Saat"
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <Button type="submit" variant="contained" disabled>
            Plan (Select From Map)
          </Button>
        </div>
      </form>
      {itineraries.length > 0 && (
        <List>
          {itineraries.map((itinerary, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`Option ${index + 1}: ${Math.round(
                  itinerary.duration / 60
                )} minutes`}
                secondary={itinerary.legs
                  .map(
                    (leg) =>
                      `${leg.mode}: ${leg.from} → ${leg.to} (${Math.round(
                        leg.distance
                      )} m)`
                  )
                  .join(" | ")}
              />
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

export default OtpPage;
