const planTrip = async ({
  fromLat,
  fromLon,
  toLat,
  toLon,
  date,
  time,
  mode = "TRANSIT,WALK",
}) => {
  try {
    const defaultDate = date || new Date().toISOString().split("T")[0];
    const defaultTime =
      time || new Date().toTimeString().split(" ")[0].slice(0, 5);

    const query = `
      query {
        plan(
          from: { lat: ${fromLat}, lon: ${fromLon} }
          to: { lat: ${toLat}, lon: ${toLon} }
          date: "${defaultDate}"
          time: "${defaultTime}"
          transportModes: [{ mode: TRANSIT }, { mode: WALK }]
          maxWalkDistance: 800
          numItineraries: 3
        ) {
          itineraries {
            legs {
              mode
              startTime
              endTime
              distance
              from {
                name
                lat
                lon
              }
              to {
                name
                lat
                lon
              }
              route {
                shortName
                longName
              }
              legGeometry {
                points
              }
            }
            duration
            startTime
            endTime
          }
        }
      }
    `;

    // OTP_API_URL ortam değişkeni .env dosyanda tanımlı olmalı!
    const response = await fetch(`${process.env.OTP_API_URL}/index/graphql`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`OTP API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data.plan || !result.data.plan.itineraries) {
      throw new Error("No valid itineraries found");
    }

    return result.data.plan.itineraries.map((itinerary) => ({
      duration: itinerary.duration,
      startTime: itinerary.startTime,
      endTime: itinerary.endTime,
      legs: itinerary.legs.map((leg) => ({
        mode: leg.mode,
        startTime: leg.startTime,
        endTime: leg.endTime,
        from: leg.from.name || "Unknown",
        to: leg.to.name || "Unknown",
        distance: leg.distance,
        route: leg.route
          ? `${leg.route.shortName} - ${leg.route.longName}`
          : null,
        geometry: leg.legGeometry.points,
      })),
    }));
  } catch (error) {
    console.error("OTP Service Error:", error.message);
    throw new Error(error.message || "Failed to plan trip");
  }
};

module.exports = {
  planTrip,
};
