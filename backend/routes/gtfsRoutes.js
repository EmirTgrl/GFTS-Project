const express = require("express");
const pool = require("../db.js");

const router = express.Router();

router.get("/stops", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM stops");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/routes", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM routes");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/routes/:route_id/stops", async (req, res) => {
  try {
    const { route_id } = req.params;
    const [rows] = await pool.execute(
      `SELECT stops.* FROM stops 
       JOIN stop_times ON stops.stop_id = stop_times.stop_id 
       JOIN trips ON stop_times.trip_id = trips.trip_id
       WHERE trips.route_id = ?`,
      [route_id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/routes/:route_id/times", async (req, res) => {
  try {
    const { route_id } = req.params;
    const [rows] = await pool.execute(
      `SELECT stops.stop_id, stops.stop_name, stop_times.arrival_time, stop_times.departure_time
       FROM stop_times
       JOIN stops ON stop_times.stop_id = stops.stop_id
       JOIN trips ON stop_times.trip_id = trips.trip_id
       WHERE trips.route_id = ?
       ORDER BY stop_times.arrival_time`,
      [route_id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/routes/:route_id/details", async (req, res) => {
  try {
    const { route_id } = req.params;
    const [rows] = await pool.execute(
      `SELECT stops.stop_id, stops.stop_name, stop_times.arrival_time, stop_times.departure_time, trips.trip_id 
       FROM stop_times
       JOIN stops ON stop_times.stop_id = stops.stop_id
       JOIN trips ON stop_times.trip_id = trips.trip_id
       WHERE trips.route_id = ?
       ORDER BY stop_times.arrival_time`,
      [route_id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/routes/:route_id/buses", async (req, res) => {
  try {
    const { route_id } = req.params;

    const [buses] = await pool.execute(
      `SELECT trips.trip_id, stop_times.stop_id, stops.stop_name, 
              stop_times.arrival_time, stop_times.departure_time
       FROM stop_times
       JOIN stops ON stop_times.stop_id = stops.stop_id
       JOIN trips ON stop_times.trip_id = trips.trip_id
       WHERE trips.route_id = ?
       ORDER BY stop_times.stop_id, stop_times.arrival_time`,
      [route_id]
    );

    res.json(buses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
