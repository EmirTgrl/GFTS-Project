// initTables.js
const { pool } = require("./db.js");

async function tableExists(tableName) {
  try {
    await pool.query(`DESCRIBE ${tableName}`);
    return true;
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return false;
    }
    throw error;
  }
}

async function initializeTables() {
  console.log("🛠️ Initializing GTFS tables...");
  const sqlScripts = [
    `
    CREATE TABLE IF NOT EXISTS agency (
      agency_id VARCHAR(255),
      agency_name VARCHAR(255) NOT NULL,
      agency_url VARCHAR(255) NOT NULL,
      agency_timezone VARCHAR(255) NOT NULL,
      agency_lang VARCHAR(255),
      agency_phone VARCHAR(255),
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (agency_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS stops (
      stop_id VARCHAR(255) NOT NULL,
      stop_code VARCHAR(255),
      stop_name VARCHAR(255) NOT NULL,
      stop_desc VARCHAR(255),
      stop_lat DECIMAL(10,6) NOT NULL,
      stop_lon DECIMAL(10,6) NOT NULL,
      zone_id VARCHAR(255),
      stop_url VARCHAR(255),
      location_type TINYINT,
      parent_station VARCHAR(255),
      stop_timezone VARCHAR(255),
      wheelchair_boarding TINYINT,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (stop_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_station, user_id, project_id) REFERENCES stops(stop_id, user_id, project_id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS routes (
      route_id VARCHAR(255) NOT NULL,
      agency_id VARCHAR(255),
      route_short_name VARCHAR(255) NOT NULL,
      route_long_name VARCHAR(255) NOT NULL,
      route_desc VARCHAR(255),
      route_type TINYINT NOT NULL,
      route_url VARCHAR(255),
      route_color VARCHAR(6),
      route_text_color VARCHAR(6),
      route_sort_order INT,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (route_id, user_id, project_id),
      FOREIGN KEY (agency_id, user_id, project_id) REFERENCES agency(agency_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS trips (
      route_id VARCHAR(255) NOT NULL,
      service_id VARCHAR(255) NOT NULL,
      trip_id VARCHAR(255) NOT NULL,
      trip_headsign VARCHAR(255),
      trip_short_name VARCHAR(255),
      direction_id TINYINT,
      block_id VARCHAR(255),
      shape_id VARCHAR(255), -- shape_id için foreign key kaldırıldı
      wheelchair_accessible TINYINT,
      bikes_allowed TINYINT,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (trip_id, user_id, project_id),
      FOREIGN KEY (route_id, user_id, project_id) REFERENCES routes(route_id, user_id, project_id),
      FOREIGN KEY (service_id, user_id, project_id) REFERENCES calendar(service_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS stop_times (
      trip_id VARCHAR(255) NOT NULL,
      arrival_time TIME,
      departure_time TIME,
      stop_id VARCHAR(255) NOT NULL,
      stop_sequence INT NOT NULL,
      stop_headsign VARCHAR(255),
      pickup_type TINYINT,
      drop_off_type TINYINT,
      shape_dist_traveled FLOAT,
      timepoint TINYINT,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (trip_id, stop_sequence, user_id, project_id),
      FOREIGN KEY (trip_id, user_id, project_id) REFERENCES trips(trip_id, user_id, project_id),
      FOREIGN KEY (stop_id, user_id, project_id) REFERENCES stops(stop_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS calendar (
      service_id VARCHAR(255) NOT NULL,
      monday TINYINT NOT NULL,
      tuesday TINYINT NOT NULL,
      wednesday TINYINT NOT NULL,
      thursday TINYINT NOT NULL,
      friday TINYINT NOT NULL,
      saturday TINYINT NOT NULL,
      sunday TINYINT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (service_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS calendar_dates (
      service_id VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      exception_type TINYINT NOT NULL,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (service_id, date, user_id, project_id),
      FOREIGN KEY (service_id, user_id, project_id) REFERENCES calendar(service_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS shapes (
      shape_id VARCHAR(255) NOT NULL,
      shape_pt_lat DECIMAL(10,6) NOT NULL,
      shape_pt_lon DECIMAL(10,6) NOT NULL,
      shape_pt_sequence INT NOT NULL,
      shape_dist_traveled FLOAT,
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (shape_id, shape_pt_sequence, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS translations (
      trans_id VARCHAR(255),
      table_name VARCHAR(255) NOT NULL,
      field_name VARCHAR(255) NOT NULL,
      language VARCHAR(255) NOT NULL,
      translation VARCHAR(255) NOT NULL,
      record_id VARCHAR(255) NOT NULL,
      record_sub_id VARCHAR(255),
      user_id INT NOT NULL,
      project_id INT NOT NULL,
      PRIMARY KEY (trans_id, user_id, project_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
  ];

  for (const script of sqlScripts) {
    try {
      await pool.query(script);
      console.log(
        `✅ Successfully initialized table: ${
          script.match(/IF NOT EXISTS (\w+)/)[1]
        }`
      );
    } catch (error) {
      console.error(
        "❌ Error initializing table:",
        error.message,
        "SQL:",
        script
      );
      throw error; // Hataları atlama, açıkça bildir
    }
  }
  console.log("✅ All GTFS tables initialized");
}

module.exports = { initializeTables, tableExists };
