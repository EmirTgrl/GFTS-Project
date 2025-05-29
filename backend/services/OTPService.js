const fetch = require("node-fetch");

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
    // Varsayılan tarih ve saat kontrolü
    const defaultDate = date || new Date().toISOString().split("T")[0];
    const defaultTime = time || new Date().toTimeString().split(" ")[0];

    const otpUrl = new URL(`${process.env.OTP_API_URL}/plan`);
    otpUrl.searchParams.append("fromPlace", `${fromLat},${fromLon}`);
    otpUrl.searchParams.append("toPlace", `${toLat},${toLon}`);
    otpUrl.searchParams.append("date", defaultDate);
    otpUrl.searchParams.append("time", defaultTime);
    otpUrl.searchParams.append("mode", mode);
    otpUrl.searchParams.append("maxWalkDistance", "800");
    otpUrl.searchParams.append("arriveBy", "false");
    otpUrl.searchParams.append("numItineraries", "3"); // OTP 2.7.0 için önerilen parametre

    const response = await fetch(otpUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`OTP API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.plan || !data.plan.itineraries) {
      throw new Error("No valid itineraries found");
    }

    // Yanıtı sadeleştir
    return data.plan.itineraries.map((itinerary) => ({
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
        route: leg.route || null,
        geometry: leg.legGeometry.points, // Harita için kullanılabilir
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
