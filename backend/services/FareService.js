const { pool } = require("../db.js");

const getDetailedFareForTrip = async (trip_id, user_id, project_id) => {
  try {
    console.log(
      `Fetching fare details for trip_id: ${trip_id}, user_id: ${user_id}, project_id: ${project_id}`
    );

    // user_id ve project_id kontrolü
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("Kullanıcı kimliği veya proje kimliği eksik.");
    }

    // 1. Trip'e ait stop'ları sırayla al
    const [stops] = await pool.query(
      `
        SELECT s.stop_id, sa.area_id, a.area_name
        FROM stop_times st
        JOIN stops s ON st.stop_id = s.stop_id
        LEFT JOIN stop_areas sa ON s.stop_id = sa.stop_id AND sa.user_id = ? AND sa.project_id = ?
        LEFT JOIN areas a ON sa.area_id = a.area_id AND a.user_id = ? AND a.project_id = ?
        WHERE st.trip_id = ? AND st.user_id = ? AND st.project_id = ?
        ORDER BY st.stop_sequence ASC
      `,
      [user_id, project_id, user_id, project_id, trip_id, user_id, project_id]
    );

    if (!stops || stops.length === 0) {
      console.log("Durak bulunamadı, ücret kuralı aranmayacak.");
      return null;
    }

    const from_area = stops[0].area_id;
    const from_area_name = stops[0].area_name;
    const to_area = stops[stops.length - 1].area_id;
    const to_area_name = stops[stops.length - 1].area_name;

    console.log(
      "From area:",
      from_area,
      from_area_name,
      "To area:",
      to_area,
      to_area_name
    );

    if (!from_area || !to_area) {
      console.log("Başlangıç veya bitiş alanı eksik.");
      return null;
    }

    // 2. Trip'in route_id'sini, route adını ve network_id'sini bul
    const [[tripData]] = await pool.query(
      `
        SELECT t.route_id, r.route_long_name, r.route_short_name, rn.network_id, n.network_name
        FROM trips t
        JOIN routes r ON t.route_id = r.route_id
        LEFT JOIN route_networks rn ON t.route_id = rn.route_id
        LEFT JOIN networks n ON rn.network_id = n.network_id
        WHERE t.trip_id = ? AND t.user_id = ? AND t.project_id = ?
      `,
      [trip_id, user_id, project_id]
    );

    console.log("Trip data:", tripData);

    if (!tripData) {
      console.log("Yolculuk bulunamadı.");
      return null;
    }

    const {
      route_id,
      route_long_name,
      route_short_name,
      network_id,
      network_name,
    } = tripData;

    if (!network_id) {
      console.log("Ağ bulunamadı.");
      return null;
    }

    // 3. Geçerli fare_leg_rules'i al
    const [fareLegs] = await pool.query(
      `
        SELECT flr.*, fp.name AS product_name, fp.amount, fp.currency,
               rm.media_name, rc.category_name, tf.start_time, tf.end_time
        FROM fare_leg_rules flr
        JOIN fare_products fp ON flr.fare_product_id = fp.fare_product_id
        LEFT JOIN fare_media rm ON flr.fare_media_id = rm.fare_media_id
        LEFT JOIN rider_categories rc ON flr.rider_category_id = rc.rider_category_id
        LEFT JOIN timeframes tf ON flr.timeframe_id = tf.timeframe_id
        WHERE flr.from_area_id = ? AND flr.to_area_id = ?
          AND flr.network_id = ?
          AND flr.user_id = ? AND flr.project_id = ?
      `,
      [from_area, to_area, network_id, user_id, project_id]
    );

    console.log("Fare legs:", fareLegs);

    // 4. Birleştirilmiş kuralları al
    const [joinedLegs] = await pool.query(
      `
        SELECT fljr.*, p1.name AS first_leg_product, p2.name AS second_leg_product
        FROM fare_leg_join_rules fljr
        LEFT JOIN fare_products p1 ON fljr.first_leg_fare_product_id = p1.fare_product_id
        LEFT JOIN fare_products p2 ON fljr.second_leg_fare_product_id = p2.fare_product_id
        WHERE fljr.user_id = ? AND fljr.project_id = ?
      `,
      [user_id, project_id]
    );

    console.log("Joined legs:", joinedLegs);

    if (fareLegs.length === 0 && joinedLegs.length === 0) {
      console.log("Ücret kuralı bulunamadı.");
      return null;
    }

    return {
      route_id,
      route_name: route_long_name || route_short_name || route_id,
      network_id,
      network_name: network_name || "Bilinmeyen Ağ",
      from_area,
      from_area_name: from_area_name || "Tanımlanmamış Alan",
      to_area,
      to_area_name: to_area_name || "Tanımlanmamış Alan",
      stops,
      fare_leg_rules: fareLegs,
      joined_leg_rules: joinedLegs,
    };
  } catch (error) {
    console.error("getDetailedFareForTrip error:", error.stack);
    throw new Error(`Ücret bilgisi alınamadı: ${error.message}`);
  }
};

// Diğer fonksiyonlar aynı kalıyor
const getAllFareProducts = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  const [rows] = await pool.query(
    `SELECT * FROM fare_products WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

const getAllFareMedia = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  const [rows] = await pool.query(
    `SELECT * FROM fare_media WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

const getAllRiderCategories = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  const [rows] = await pool.query(
    `SELECT * FROM rider_categories WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

const getAllNetworks = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  const [rows] = await pool.query(
    `SELECT * FROM networks WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

const createFareForTrip = async (
  user_id,
  project_id,
  trip_id,
  fareProductData,
  rider_category_id,
  media_id = null,
  timeframe_id = null,
  network_name = "Default Network"
) => {
  try {
    if (!user_id || !project_id) {
      throw new Error("Kullanıcı kimliği veya proje kimliği eksik.");
    }

    // Giriş doğrulaması
    if (
      !fareProductData.name ||
      fareProductData.amount < 0 ||
      !fareProductData.currency
    ) {
      throw new Error(
        "Geçersiz ücret verisi: İsim, miktar ve para birimi zorunlu."
      );
    }

    // Trip bilgisi ve route_id al
    const [trip] = await pool.query(
      "SELECT * FROM trips WHERE trip_id = ? AND user_id = ? AND project_id = ?",
      [trip_id, user_id, project_id]
    );
    if (!trip.length) throw new Error("Yolculuk bulunamadı.");

    const route_id = trip[0].route_id;

    // Stop_times → ilk ve son durağı al
    const [stops] = await pool.query(
      `SELECT stop_id FROM stop_times 
         WHERE trip_id = ? AND user_id = ? AND project_id = ? 
         ORDER BY stop_sequence`,
      [trip_id, user_id, project_id]
    );
    if (stops.length < 2) throw new Error("Yolculukta yeterli durak yok.");

    const from_stop_id = stops[0].stop_id;
    const to_stop_id = stops[stops.length - 1].stop_id;

    // Stop_area'ları bul (bulunamazsa null olarak bırak)
    const [[fromStopArea]] = await pool.query(
      "SELECT area_id FROM stop_areas WHERE stop_id = ? AND user_id = ? AND project_id = ?",
      [from_stop_id, user_id, project_id]
    );
    const [[toStopArea]] = await pool.query(
      "SELECT area_id FROM stop_areas WHERE stop_id = ? AND user_id = ? AND project_id = ?",
      [to_stop_id, user_id, project_id]
    );

    const from_area_id = fromStopArea ? fromStopArea.area_id : null;
    const to_area_id = toStopArea ? toStopArea.area_id : null;

    // Network oluştur veya bul
    let network_id;
    const [existingNetwork] = await pool.query(
      "SELECT network_id FROM networks WHERE network_name = ? AND user_id = ? AND project_id = ?",
      [network_name, user_id, project_id]
    );
    if (existingNetwork.length) {
      network_id = existingNetwork[0].network_id;
    } else {
      const [result] = await pool.query(
        "INSERT INTO networks (network_name, user_id, project_id) VALUES (?, ?, ?)",
        [network_name, user_id, project_id]
      );
      network_id = result.insertId;
    }

    // Route-network ilişkisi ekle
    await pool.query(
      "INSERT IGNORE INTO route_networks (route_id, network_id, user_id, project_id) VALUES (?, ?, ?, ?)",
      [route_id, network_id, user_id, project_id]
    );

    // Fare Product oluştur
    const [fareProductResult] = await pool.query(
      `INSERT INTO fare_products 
         (fare_product_name, fare_amount, currency_type, payment_method, transfers, user_id, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fareProductData.name,
        fareProductData.amount,
        fareProductData.currency,
        fareProductData.payment_method || "unknown",
        fareProductData.transfers || 0,
        user_id,
        project_id,
      ]
    );
    const fare_product_id = fareProductResult.insertId;

    // Fare Leg Rule oluştur
    const [legRuleResult] = await pool.query(
      `INSERT INTO fare_leg_rules 
         (fare_product_id, rider_category_id, network_id, from_area_id, to_area_id, timeframe_id, fare_media_id, user_id, project_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fare_product_id,
        rider_category_id,
        network_id,
        from_area_id,
        to_area_id,
        timeframe_id,
        media_id,
        user_id,
        project_id,
      ]
    );
    const leg_rule_id = legRuleResult.insertId;

    return {
      message: "Ücret başarılı şekilde eklendi.",
      fare_product_id,
      leg_rule_id,
      from_area_id,
      to_area_id,
      network_id,
    };
  } catch (error) {
    console.error("createFareForTrip error:", error.message);
    throw error;
  }
};

module.exports = {
  getDetailedFareForTrip,
  getAllFareProducts,
  getAllFareMedia,
  getAllRiderCategories,
  getAllNetworks,
  createFareForTrip,
};
