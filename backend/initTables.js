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
  const sqlScripts = {
    agency: `
      CREATE TABLE IF NOT EXISTS agency (
        agency_id VARCHAR(255) NOT NULL,
        agency_name VARCHAR(255) NOT NULL,
        agency_url VARCHAR(255) NOT NULL,
        agency_timezone VARCHAR(255) NOT NULL,
        agency_lang VARCHAR(255) DEFAULT NULL,
        agency_phone VARCHAR(255) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (agency_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    stops: `
      CREATE TABLE IF NOT EXISTS stops (
        stop_id VARCHAR(255) NOT NULL,
        stop_code VARCHAR(255) DEFAULT NULL,
        stop_name VARCHAR(255) NOT NULL,
        stop_desc VARCHAR(255) DEFAULT NULL,
        stop_lat DECIMAL(10,6) NOT NULL,
        stop_lon DECIMAL(10,6) NOT NULL,
        zone_id VARCHAR(255) DEFAULT NULL,
        stop_url VARCHAR(255) DEFAULT NULL,
        location_type TINYINT DEFAULT NULL,
        parent_station VARCHAR(255) DEFAULT NULL,
        stop_timezone VARCHAR(255) DEFAULT NULL,
        wheelchair_boarding TINYINT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (stop_id),
        FOREIGN KEY (parent_station) REFERENCES stops(stop_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    routes: `
      CREATE TABLE IF NOT EXISTS routes (
        route_id VARCHAR(255) NOT NULL,
        agency_id VARCHAR(255) DEFAULT NULL,
        route_short_name VARCHAR(255) NOT NULL,
        route_long_name VARCHAR(255) NOT NULL,
        route_desc VARCHAR(255) DEFAULT NULL,
        route_type TINYINT NOT NULL,
        route_url VARCHAR(255) DEFAULT NULL,
        route_color VARCHAR(6) DEFAULT NULL,
        route_text_color VARCHAR(6) DEFAULT NULL,
        route_sort_order INT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (route_id),
        FOREIGN KEY (agency_id) REFERENCES agency(agency_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    calendar: `
      CREATE TABLE IF NOT EXISTS calendar (
        service_id VARCHAR(255) NOT NULL,
        monday TINYINT NOT NULL DEFAULT 0,
        tuesday TINYINT NOT NULL DEFAULT 0,
        wednesday TINYINT NOT NULL DEFAULT 0,
        thursday TINYINT NOT NULL DEFAULT 0,
        friday TINYINT NOT NULL DEFAULT 0,
        saturday TINYINT NOT NULL DEFAULT 0,
        sunday TINYINT NOT NULL DEFAULT 0,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (service_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    shapes: `
      CREATE TABLE IF NOT EXISTS shapes (
        shape_id INT NOT NULL,
        shape_pt_lat DECIMAL(10,6) NOT NULL,
        shape_pt_lon DECIMAL(10,6) NOT NULL,
        shape_pt_sequence INT NOT NULL,
        shape_dist_traveled FLOAT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (shape_id, shape_pt_sequence),
        UNIQUE KEY unique_shape_id (shape_id), -- shape_id için unique index
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    trips: `
      CREATE TABLE IF NOT EXISTS trips (
        trip_id VARCHAR(255) NOT NULL,
        route_id VARCHAR(255) NOT NULL,
        service_id VARCHAR(255) NOT NULL,
        trip_headsign VARCHAR(255) DEFAULT NULL,
        trip_short_name VARCHAR(255) DEFAULT NULL,
        direction_id TINYINT DEFAULT NULL,
        block_id VARCHAR(255) DEFAULT NULL,
        shape_id INT DEFAULT NULL,
        wheelchair_accessible TINYINT DEFAULT NULL,
        bikes_allowed TINYINT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (trip_id),
        FOREIGN KEY (route_id) REFERENCES routes(route_id),
        FOREIGN KEY (service_id) REFERENCES calendar(service_id),
        FOREIGN KEY (shape_id) REFERENCES shapes(shape_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    stop_times: `
      CREATE TABLE IF NOT EXISTS stop_times (
        trip_id VARCHAR(255) NOT NULL,
        arrival_time TIME DEFAULT NULL,
        departure_time TIME DEFAULT NULL,
        stop_id VARCHAR(255) NOT NULL,
        stop_sequence INT NOT NULL,
        stop_headsign VARCHAR(255) DEFAULT NULL,
        pickup_type TINYINT DEFAULT NULL,
        drop_off_type TINYINT DEFAULT NULL,
        shape_dist_traveled FLOAT DEFAULT NULL,
        timepoint TINYINT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (trip_id, stop_sequence),
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
        FOREIGN KEY (stop_id) REFERENCES stops(stop_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
  };

  for (const [tableName, script] of Object.entries(sqlScripts)) {
    try {
      const exists = await tableExists(tableName);
      if (!exists) {
        await pool.query(script);
        console.log(`✅ Created table: ${tableName}`);
      } else {
        console.log(`ℹ️ Table ${tableName} already exists, skipping creation`);
      }
    } catch (error) {
      console.error(
        `❌ Error initializing table ${tableName}:`,
        error.message,
        "SQL:",
        script
      );
      throw error;
    }
  }
  console.log("✅ All GTFS tables initialized or verified");
}

module.exports = { initializeTables, tableExists };
