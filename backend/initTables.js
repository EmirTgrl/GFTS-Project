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
        agency_fare_url VARCHAR(255) DEFAULT NULL,
        agency_email VARCHAR(255) DEFAULT NULL,
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
        stop_code VARCHAR(50) DEFAULT NULL,
        stop_name VARCHAR(255) NOT NULL,
        stop_desc VARCHAR(255) DEFAULT NULL,
        stop_lat DECIMAL(10,6) NOT NULL,
        stop_lon DECIMAL(10,6) NOT NULL,
        zone_id VARCHAR(255) DEFAULT NULL,
        stop_url VARCHAR(255) DEFAULT NULL,
        location_type TINYINT DEFAULT 0,
        parent_station VARCHAR(255) DEFAULT NULL,
        stop_timezone VARCHAR(255) DEFAULT NULL,
        wheelchair_boarding TINYINT DEFAULT 0,
        level_id VARCHAR(255) DEFAULT NULL,
        platform_code VARCHAR(50) DEFAULT NULL,
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
        route_short_name VARCHAR(255),
        route_long_name VARCHAR(255),
        route_desc VARCHAR(255) DEFAULT NULL,
        route_type TINYINT NOT NULL,
        route_url VARCHAR(255) DEFAULT NULL,
        route_color VARCHAR(6) DEFAULT NULL,
        route_text_color VARCHAR(6) DEFAULT NULL,
        route_sort_order INT DEFAULT NULL,
        continuous_pickup TINYINT DEFAULT NULL,
        continuous_drop_off TINYINT DEFAULT NULL,
        network_id VARCHAR(100) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (route_id),
        FOREIGN KEY (agency_id) REFERENCES agency(agency_id),
        FOREIGN KEY (network_id) REFERENCES route_networks(network_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    calendar: `
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
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_attributes: `
      CREATE TABLE IF NOT EXISTS fare_attributes (
        fare_id VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency_type VARCHAR(3) NOT NULL,
        payment_method TINYINT NOT NULL,
        transfers TINYINT DEFAULT NULL,
        agency_id VARCHAR(255) DEFAULT NULL,
        transfer_duration INT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (fare_id),
        FOREIGN KEY (agency_id) REFERENCES agency(agency_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_media: `
      CREATE TABLE IF NOT EXISTS fare_media (
        fare_media_id VARCHAR(100) NOT NULL,
        fare_media_name VARCHAR(255) DEFAULT NULL,
        fare_media_type TINYINT NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (fare_media_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_products: `
      CREATE TABLE IF NOT EXISTS fare_products (
        fare_product_id VARCHAR(100) NOT NULL,
        fare_product_name VARCHAR(255) DEFAULT NULL,
        rider_category_id VARCHAR(100) DEFAULT NULL,
        fare_media_id VARCHAR(100) DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (fare_product_id),
        FOREIGN KEY (fare_media_id) REFERENCES fare_media(fare_media_id),
        FOREIGN KEY (rider_category_id) REFERENCES rider_categories(rider_category_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    rider_categories: `
      CREATE TABLE IF NOT EXISTS rider_categories (
        rider_category_id VARCHAR(100) NOT NULL,
        rider_category_name VARCHAR(255) DEFAULT NULL,
        is_default_fare_category TINYINT DEFAULT 0,
        eligibility_url VARCHAR(255) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (rider_category_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    timeframes: `
      CREATE TABLE IF NOT EXISTS timeframes (
        timeframe_group_id VARCHAR(100) NOT NULL,
        start_time TIME DEFAULT NULL,
        end_time TIME DEFAULT NULL,
        service_id VARCHAR(255) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (timeframe_group_id),
        FOREIGN KEY (service_id) REFERENCES calendar(service_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    networks: `
      CREATE TABLE IF NOT EXISTS networks (
        network_id VARCHAR(100) NOT NULL,
        network_name VARCHAR(255) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (network_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    areas: `
      CREATE TABLE IF NOT EXISTS areas (
        area_id VARCHAR(100) NOT NULL,
        area_name VARCHAR(255) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (area_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    trips: `
      CREATE TABLE IF NOT EXISTS trips (
        route_id VARCHAR(255),
        service_id VARCHAR(255),
        trip_id VARCHAR(255) NOT NULL,
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
        pickup_type TINYINT DEFAULT 0,
        drop_off_type TINYINT DEFAULT 0,
        shape_dist_traveled FLOAT DEFAULT NULL,
        timepoint TINYINT DEFAULT 1,
        continuous_pickup TINYINT DEFAULT NULL,
        continuous_drop_off TINYINT DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (trip_id, stop_sequence),
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
        FOREIGN KEY (stop_id) REFERENCES stops(stop_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_rules: `
      CREATE TABLE IF NOT EXISTS fare_rules (
        fare_id VARCHAR(255) NOT NULL,
        route_id VARCHAR(255) DEFAULT NULL,
        origin_id VARCHAR(255) DEFAULT NULL,
        destination_id VARCHAR(255) DEFAULT NULL,
        contains_id VARCHAR(255) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (fare_id),
        FOREIGN KEY (fare_id) REFERENCES fare_attributes(fare_id),
        FOREIGN KEY (route_id) REFERENCES routes(route_id),
        FOREIGN KEY (origin_id) REFERENCES stops(stop_id),
        FOREIGN KEY (destination_id) REFERENCES stops(stop_id),
        FOREIGN KEY (contains_id) REFERENCES stops(stop_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_leg_join_rules: `
      CREATE TABLE IF NOT EXISTS fare_leg_join_rules (
        from_network_id VARCHAR(100) NOT NULL,
        to_network_id VARCHAR(100) NOT NULL,
        from_stop_id VARCHAR(100) NOT NULL,
        to_stop_id VARCHAR(100) NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        FOREIGN KEY (from_network_id) REFERENCES networks(network_id),
        FOREIGN KEY (to_network_id) REFERENCES networks(network_id),
        FOREIGN KEY (from_stop_id) REFERENCES stops(stop_id),
        FOREIGN KEY (to_stop_id) REFERENCES stops(stop_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_leg_rules: `
      CREATE TABLE IF NOT EXISTS fare_leg_rules (
        leg_group_id VARCHAR(100) NOT NULL,
        network_id VARCHAR(100) DEFAULT NULL,
        from_area_id VARCHAR(100) DEFAULT NULL,
        to_area_id VARCHAR(100) DEFAULT NULL,
        from_timeframe_group_id VARCHAR(100) DEFAULT NULL,
        to_timeframe_group_id VARCHAR(100) DEFAULT NULL,
        fare_product_id VARCHAR(100) NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (leg_group_id),
        FOREIGN KEY (network_id) REFERENCES networks(network_id),
        FOREIGN KEY (from_area_id) REFERENCES areas(area_id),
        FOREIGN KEY (to_area_id) REFERENCES areas(area_id),
        FOREIGN KEY (from_timeframe_group_id) REFERENCES timeframes(timeframe_group_id),
        FOREIGN KEY (to_timeframe_group_id) REFERENCES timeframes(timeframe_group_id),
        FOREIGN KEY (fare_product_id) REFERENCES fare_products(fare_product_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    fare_transfer_rules: `
      CREATE TABLE IF NOT EXISTS fare_transfer_rules (
        from_leg_group_id VARCHAR(100) NOT NULL,
        to_leg_group_id VARCHAR(100) NOT NULL,
        transfer_count INT DEFAULT 1,
        duration_limit INT DEFAULT NULL,
        duration_limit_type TINYINT DEFAULT NULL,
        fare_transfer_type TINYINT NOT NULL,
        fare_product_id VARCHAR(100) DEFAULT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (from_leg_group_id, to_leg_group_id),
        FOREIGN KEY (from_leg_group_id) REFERENCES fare_leg_rules(leg_group_id),
        FOREIGN KEY (to_leg_group_id) REFERENCES fare_leg_rules(leg_group_id),
        FOREIGN KEY (fare_product_id) REFERENCES fare_products(fare_product_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    route_networks: `
      CREATE TABLE IF NOT EXISTS route_networks (
        route_id VARCHAR(100) NOT NULL,
        network_id VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (route_id, network_id),
        FOREIGN KEY (route_id) REFERENCES routes(route_id),
        FOREIGN KEY (network_id) REFERENCES networks(network_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(project_id)
      )
    `,
    stop_areas: `
      CREATE TABLE IF NOT EXISTS stop_areas (
        area_id VARCHAR(100) NOT NULL,
        stop_id VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        PRIMARY KEY (stop_id, area_id),
        FOREIGN KEY (stop_id) REFERENCES stops(stop_id),
        FOREIGN KEY (area_id) REFERENCES areas(area_id),
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
