const { pool } = require("../db.js");

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getDetailedFareForRoute = async (route_id, user_id, project_id) => {
  try {
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("The user ID or project ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("The user ID or project ID is missing.");
    }

    // 1. Route bilgilerini al
    const [[routeData]] = await pool.query(
      `
        SELECT r.route_id, r.route_long_name, r.route_short_name, rn.network_id, n.network_name
        FROM routes r
        LEFT JOIN route_networks rn ON r.route_id = rn.route_id
        LEFT JOIN networks n ON rn.network_id = n.network_id
        WHERE r.route_id = ? AND r.user_id = ? AND r.project_id = ?
      `,
      [route_id, user_id, project_id]
    );

    if (!routeData) {
      console.log("Route not found.");
      return null;
    }

    const {
      route_id: fetchedRouteId,
      route_long_name,
      route_short_name,
      network_id,
      network_name,
    } = routeData;

    if (!network_id) {
      console.log("Network not found.");
      return null;
    }

    // 2. Rota için alanları (from_area, to_area) belirle
    const [stopAreas] = await pool.query(
      `
        SELECT DISTINCT sa.area_id, a.area_name
        FROM stop_times st
        JOIN stops s ON st.stop_id = s.stop_id
        JOIN stop_areas sa ON s.stop_id = sa.stop_id
        JOIN areas a ON sa.area_id = a.area_id
        JOIN trips t ON st.trip_id = t.trip_id
        WHERE t.route_id = ? AND t.user_id = ? AND t.project_id = ?
      `,
      [route_id, user_id, project_id]
    );

    if (!stopAreas || stopAreas.length === 0) {
      console.log("No areas found for the route.");
      return null;
    }

    // 3. İndi-Bindi (Sabit) ücretleri al
    const [fixedFares] = await pool.query(
      `
        SELECT 
            flr.leg_group_id,
            flr.fare_product_id,
            fp.fare_product_name,
            fp.rider_category_id,
            fp.fare_media_id,
            fp.amount,
            fp.currency,
            rm.fare_media_name,
            rc.rider_category_name,
            a1.area_name AS from_area_name,
            a2.area_name AS to_area_name,
            tf1.start_time AS start_time,
            tf1.end_time AS end_time
        FROM fare_leg_rules flr
        JOIN fare_products fp ON flr.fare_product_id = fp.fare_product_id
        LEFT JOIN fare_media rm ON fp.fare_media_id = rm.fare_media_id
        LEFT JOIN rider_categories rc ON fp.rider_category_id = rc.rider_category_id
        LEFT JOIN areas a1 ON flr.from_area_id = a1.area_id
        LEFT JOIN areas a2 ON flr.to_area_id = a2.area_id
        LEFT JOIN timeframes tf1 ON flr.from_timeframe_group_id = tf1.timeframe_group_id
        WHERE flr.network_id = ?
          AND flr.user_id = ?
          AND flr.project_id = ?
          AND (fp.fare_product_name NOT LIKE '%Distance%' AND fp.fare_product_name NOT LIKE '%Km%')
      `,
      [network_id, user_id, project_id]
    );

    // 4. Mesafeye dayalı ücretlendirme
    const [distanceBasedFares] = await pool.query(
      `
        SELECT 
            flr.fare_product_id,
            fp.fare_product_name,
            fp.rider_category_id,
            fp.fare_media_id,
            fp.amount,
            fp.currency,
            rc.rider_category_name,
            a1.area_name AS from_area_name,
            a2.area_name AS to_area_name
        FROM fare_leg_rules flr
        JOIN fare_products fp ON flr.fare_product_id = fp.fare_product_id
        LEFT JOIN rider_categories rc ON fp.rider_category_id = rc.rider_category_id
        LEFT JOIN areas a1 ON flr.from_area_id = a1.area_id
        LEFT JOIN areas a2 ON flr.to_area_id = a2.area_id
        WHERE flr.network_id = ?
          AND flr.user_id = ?
          AND flr.project_id = ?
          AND (fp.fare_product_name LIKE '%Distance%' OR fp.fare_product_name LIKE '%Km%')
      `,
      [network_id, user_id, project_id]
    );

    // Mesafe hesaplama
    const categorizedDistanceFares = await Promise.all(
      distanceBasedFares.map(async (fare) => {
        if (!fare.fare_product_id) return null;

        // Başlangıç ve bitiş alanları için durakları bul
        const [fromStops] = await pool.query(
          `
            SELECT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon, st.shape_dist_traveled
            FROM stops s
            JOIN stop_areas sa ON s.stop_id = sa.stop_id
            JOIN stop_times st ON s.stop_id = st.stop_id
            JOIN trips t ON st.trip_id = t.trip_id
            WHERE sa.area_id = ? AND t.route_id = ? AND t.user_id = ? AND t.project_id = ?
            LIMIT 1
          `,
          [fare.from_area_id, route_id, user_id, project_id]
        );

        const [toStops] = await pool.query(
          `
            SELECT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon, st.shape_dist_traveled
            FROM stops s
            JOIN stop_areas sa ON s.stop_id = sa.stop_id
            JOIN stop_times st ON s.stop_id = st.stop_id
            JOIN trips t ON st.trip_id = t.trip_id
            WHERE sa.area_id = ? AND t.route_id = ? AND t.user_id = ? AND t.project_id = ?
            LIMIT 1
          `,
          [fare.to_area_id, route_id, user_id, project_id]
        );

        let distance_km = null;
        let distance_label = "Tanımsız Mesafe";

        if (fromStops.length > 0 && toStops.length > 0) {
          const fromStop = fromStops[0];
          const toStop = toStops[0];

          // shape_dist_traveled ile mesafe hesaplama
          if (
            fromStop.shape_dist_traveled != null &&
            toStop.shape_dist_traveled != null
          ) {
            distance_km = Math.abs(
              toStop.shape_dist_traveled - fromStop.shape_dist_traveled
            );
            distance_label = `${distance_km.toFixed(2)} km`;
          } else {
            // Fallback: Koordinatlarla mesafe hesaplama
            distance_km = calculateDistance(
              fromStop.stop_lat,
              fromStop.stop_lon,
              toStop.stop_lat,
              toStop.stop_lon
            );
            distance_label = `${distance_km.toFixed(2)} km`;
          }
        }

        return {
          ...fare,
          distance_km,
          distance_label,
        };
      })
    );

    // Null değerleri filtrele
    const filteredDistanceFares = categorizedDistanceFares.filter(
      (fare) => fare !== null
    );

    // 5. Transfer kurallarını al
    const [transferRules] = await pool.query(
      `
        SELECT ftr.from_leg_group_id,
               ftr.to_leg_group_id,
               ftr.transfer_count,
               ftr.duration_limit,
               CASE ftr.duration_limit_type
                 WHEN 0 THEN 'Kalkıştan Kalkışa Süre'
                 WHEN 1 THEN 'Kalkıştan Varışa Süre'
                 WHEN 2 THEN 'Varıştan Kalkışa Süre'
                 WHEN 3 THEN 'Varıştan Varışa Süre'
                 ELSE 'Tanımsız Süre Limiti Türü'
               END AS duration_limit_type,
               CASE ftr.fare_transfer_type
                 WHEN 0 THEN 'Tek Yön Transfer (A → B)'
                 WHEN 1 THEN 'Çift Yön Transfer (A → B → C)'
                 WHEN 2 THEN 'Döngüsel Transfer (A → B → A → C)'
                 ELSE 'Tanımsız Transfer Türü'
               END AS fare_transfer_type,
               ftr.fare_product_id,
               flr1.network_id AS from_network_id,
               flr1.from_area_id AS from_area_id,
               flr1.to_area_id AS from_to_area_id,
               n1.network_name AS from_network_name,
               COALESCE(
                 (SELECT s.stop_name FROM stops s
                  JOIN stop_areas sa ON s.stop_id = sa.stop_id
                  WHERE sa.area_id = flr1.from_area_id AND sa.user_id = ? AND sa.project_id = ?
                  LIMIT 1),
                 'Bilinmeyen Durak'
               ) AS from_stop_name,
               COALESCE(
                 (SELECT s.stop_name FROM stops s
                  JOIN stop_areas sa ON s.stop_id = sa.stop_id
                  WHERE sa.area_id = flr1.to_area_id AND sa.user_id = ? AND sa.project_id = ?
                  LIMIT 1),
                 'Bilinmeyen Durak'
               ) AS from_to_stop_name,
               flr2.network_id AS to_network_id,
               flr2.from_area_id AS to_from_area_id,
               flr2.to_area_id AS to_area_id,
               n2.network_name AS to_network_name,
               COALESCE(
                 (SELECT s.stop_name FROM stops s
                  JOIN stop_areas sa ON s.stop_id = sa.stop_id
                  WHERE sa.area_id = flr2.from_area_id AND sa.user_id = ? AND sa.project_id = ?
                  LIMIT 1),
                 'Bilinmeyen Durak'
               ) AS to_from_stop_name,
               COALESCE(
                 (SELECT s.stop_name FROM stops s
                  JOIN stop_areas sa ON s.stop_id = sa.stop_id
                  WHERE sa.area_id = flr2.to_area_id AND sa.user_id = ? AND sa.project_id = ?
                  LIMIT 1),
                 'Bilinmeyen Durak'
               ) AS to_stop_name,
               fp.fare_product_name AS transfer_fare_product,
               fp.amount AS transfer_amount,
               fp.currency AS transfer_currency
        FROM fare_transfer_rules ftr
        JOIN fare_leg_rules flr1 ON ftr.from_leg_group_id = flr1.leg_group_id
        JOIN fare_leg_rules flr2 ON ftr.to_leg_group_id = flr2.leg_group_id
        LEFT JOIN networks n1 ON flr1.network_id = n1.network_id
        LEFT JOIN networks n2 ON flr2.network_id = n2.network_id
        LEFT JOIN fare_products fp ON ftr.fare_product_id = fp.fare_product_id
        WHERE ftr.user_id = ?
          AND ftr.project_id = ?
      `,
      [
        user_id,
        project_id, // from_stop_name
        user_id,
        project_id, // from_to_stop_name
        user_id,
        project_id, // to_from_stop_name
        user_id,
        project_id, // to_stop_name
        user_id,
        project_id, // WHERE
      ]
    );

    if (
      fixedFares.length === 0 &&
      filteredDistanceFares.length === 0 &&
      transferRules.length === 0
    ) {
      console.log("Fare rule not found.");
      return null;
    }

    return {
      route_id: fetchedRouteId,
      route_name: route_long_name || route_short_name || route_id,
      network_id,
      network_name: network_name || "Unknown Network",
      fixed_fares: fixedFares,
      distance_based_fares: filteredDistanceFares,
      transfer_rules: transferRules,
    };
  } catch (error) {
    console.error("getDetailedFareForRoute error:", error.stack);
    throw new Error(`Fare information could not be obtained: ${error.message}`);
  }
};

// Tüm fare_products'ı alma
const getAllFareProducts = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  user_id = parseInt(user_id, 10);
  project_id = parseInt(project_id, 10);
  const [rows] = await pool.query(
    `SELECT * FROM fare_products WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

// Tüm fare_media'ları alma
const getAllFareMedia = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  user_id = parseInt(user_id, 10);
  project_id = parseInt(project_id, 10);
  const [rows] = await pool.query(
    `SELECT * FROM fare_media WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

// Tüm rider_categories'leri alma
const getAllRiderCategories = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  user_id = parseInt(user_id, 10);
  project_id = parseInt(project_id, 10);
  const [rows] = await pool.query(
    `SELECT * FROM rider_categories WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

// Tüm networks'ü alma
const getAllNetworks = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  user_id = parseInt(user_id, 10);
  project_id = parseInt(project_id, 10);
  const [rows] = await pool.query(
    `SELECT * FROM networks WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

// Yeni ekleme fonksiyonları
const addFareProduct = async (
  user_id,
  project_id,
  fare_product_name,
  amount,
  currency,
  rider_category_id = null,
  fare_media_id = null,
  network_id = null,
  route_id = null
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("User ID or project ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (!fare_product_name || amount < 0 || !currency) {
      throw new Error(
        "Invalid fare data: Name, amount and currency are required."
      );
    }

    // Benzersiz fare_product_id oluştur
    const fare_product_id = `fare_product_${Date.now()}`;

    // fare_products tablosuna ekleme
    const [result] = await pool.query(
      `
        INSERT INTO fare_products 
        (fare_product_id, fare_product_name, amount, currency, rider_category_id, fare_media_id, user_id, project_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        fare_product_id,
        fare_product_name,
        amount,
        currency,
        rider_category_id,
        fare_media_id,
        user_id,
        project_id,
      ]
    );

    // route_id sağlandıysa, fare_leg_rules tablosuna otomatik kayıt ekle
    if (route_id) {
      // Route'a bağlı network_id'yi al
      const [[routeData]] = await pool.query(
        `
          SELECT rn.network_id
          FROM routes r
          LEFT JOIN route_networks rn ON r.route_id = rn.route_id
          WHERE r.route_id = ? AND r.user_id = ? AND r.project_id = ?
        `,
        [route_id, user_id, project_id]
      );

      if (!routeData || !routeData.network_id) {
        console.error("Network ID not found:", {
          route_id,
          user_id,
          project_id,
        });
        throw new Error("No network information found for selected route.");
      }

      const network_id = routeData.network_id;
      const leg_group_id = `leg_group_${Date.now()}`;

      // Rota için başlangıç ve bitiş alanlarını (from_area_id, to_area_id) al
      const [stopAreas] = await pool.query(
        `
          SELECT sa.area_id
          FROM stop_times st
          JOIN stops s ON st.stop_id = s.stop_id
          JOIN stop_areas sa ON s.stop_id = sa.stop_id
          JOIN trips t ON st.trip_id = t.trip_id
          WHERE t.route_id = ? AND t.user_id = ? AND t.project_id = ?
          GROUP BY sa.area_id
          ORDER BY MIN(st.stop_sequence)
        `,
        [route_id, user_id, project_id]
      );

      if (stopAreas.length === 0) {
        console.error("No stop areas found for route:", {
          route_id,
          user_id,
          project_id,
        });
        throw new Error(
          "There is no stop area defined for the route. Please check the stop areas."
        );
      }

      let from_area_id = stopAreas[0].area_id; // İlk durak alanı
      let to_area_id = stopAreas[stopAreas.length - 1].area_id; // Son durak alanı

      // fare_leg_rules tablosuna ekleme (route_id olmadan)
      await pool.query(
        `
          INSERT INTO fare_leg_rules 
          (leg_group_id, network_id, fare_product_id, from_area_id, to_area_id, user_id, project_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          leg_group_id,
          network_id,
          fare_product_id,
          from_area_id,
          to_area_id,
          user_id,
          project_id,
        ]
      );
    }

    return {
      message: "Fare product added successfully.",
      fare_product_id,
      fare_product_name,
      amount,
      currency,
      rider_category_id,
      fare_media_id,
    };
  } catch (error) {
    console.error("addFareProduct error:", error.message);
    throw new Error(`Could not add fare product: ${error.message}`);
  }
};

const addFareMedia = async (
  user_id,
  project_id,
  fare_media_name,
  fare_media_type
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("User ID or project ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (!fare_media_name || fare_media_type == null) {
      throw new Error("Payment method name and type are required fields.");
    }

    // fare_media_type kontrolü (0: none, 1: paper ticket, 2: transit card, 3: cEMV, 4: mobile app)
    if (![0, 1, 2, 3, 4].includes(fare_media_type)) {
      throw new Error(
        "Invalid payment method type. Valid options: Cash (0), Paper Ticket (1), Transit Card (2), Contactless Card (3), Mobile Application (4)."
      );
    }

    // Benzersiz fare_media_id oluştur
    const fare_media_id = `fare_media_${Date.now()}`;

    // fare_media tablosuna ekleme
    await pool.query(
      `
        INSERT INTO fare_media 
        (fare_media_id, fare_media_name, fare_media_type, user_id, project_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      [fare_media_id, fare_media_name, fare_media_type, user_id, project_id]
    );

    return {
      message: "Payment method added successfully.",
      fare_media_id,
      fare_media_name,
      fare_media_type,
    };
  } catch (error) {
    console.error("addFareMedia error:", error.message);
    throw new Error(`Payment method could not be added: ${error.message}`);
  }
};

const addRiderCategory = async (
  user_id,
  project_id,
  rider_category_name,
  is_default_fare_category = 0,
  eligibility_url = null
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("User ID or project ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (!rider_category_name) {
      throw new Error("Invalid passenger category data: Name is required.");
    }

    // is_default_fare_category kontrolü
    if (![0, 1].includes(is_default_fare_category)) {
      throw new Error("Invalid default category value. (Must be 0 or 1)");
    }

    // Benzersiz rider_category_id oluştur
    const rider_category_id = `rider_category_${Date.now()}`;

    // rider_categories tablosuna ekleme
    await pool.query(
      `
        INSERT INTO rider_categories 
        (rider_category_id, rider_category_name, is_default_fare_category, eligibility_url, user_id, project_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        rider_category_id,
        rider_category_name,
        is_default_fare_category,
        eligibility_url,
        user_id,
        project_id,
      ]
    );

    return {
      message: "Passenger category added successfully.",
      rider_category_id,
      rider_category_name,
      is_default_fare_category,
      eligibility_url,
    };
  } catch (error) {
    console.error("addRiderCategory error:", error.message);
    throw new Error(`Passenger category could not be added: ${error.message}`);
  }
};

// Fare Product Güncelleme
const updateFareProduct = async (
  user_id,
  project_id,
  fare_product_id,
  fare_product_name,
  amount,
  currency,
  rider_category_id = null,
  fare_media_id = null
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !fare_product_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        fare_product_id,
      });
      throw new Error("User ID, project ID, or fare product ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (!fare_product_name || amount == null || !currency) {
      throw new Error(
        "Invalid fare data: Name, amount, and currency are required."
      );
    }

    // amount kontrolü
    if (isNaN(amount) || amount < 0) {
      throw new Error("Invalid amount: Must be a non-negative number.");
    }

    // rider_category_id ve fare_media_id varsa doğrulama
    if (rider_category_id) {
      const [[riderCategory]] = await pool.query(
        `SELECT rider_category_id FROM rider_categories WHERE rider_category_id = ? AND user_id = ? AND project_id = ?`,
        [rider_category_id, user_id, project_id]
      );
      if (!riderCategory) {
        throw new Error("Invalid rider category ID: Category does not exist.");
      }
    }

    if (fare_media_id) {
      const [[fareMedia]] = await pool.query(
        `SELECT fare_media_id FROM fare_media WHERE fare_media_id = ? AND user_id = ? AND project_id = ?`,
        [fare_media_id, user_id, project_id]
      );
      if (!fareMedia) {
        throw new Error("Invalid fare media ID: Media does not exist.");
      }
    }

    // Kayıt var mı kontrolü
    const [[existingFareProduct]] = await pool.query(
      `SELECT fare_product_id FROM fare_products WHERE fare_product_id = ? AND user_id = ? AND project_id = ?`,
      [fare_product_id, user_id, project_id]
    );

    if (!existingFareProduct) {
      throw new Error("Fare product not found.");
    }

    // fare_products tablosunu güncelle
    const [result] = await pool.query(
      `
        UPDATE fare_products 
        SET fare_product_name = ?, amount = ?, currency = ?, rider_category_id = ?, fare_media_id = ?
        WHERE fare_product_id = ? AND user_id = ? AND project_id = ?
      `,
      [
        fare_product_name,
        amount,
        currency,
        rider_category_id,
        fare_media_id,
        fare_product_id,
        user_id,
        project_id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to update fare product.");
    }

    return {
      message: "Fare product updated successfully.",
      fare_product_id,
      fare_product_name,
      amount,
      currency,
      rider_category_id,
      fare_media_id,
    };
  } catch (error) {
    console.error("updateFareProduct error:", error.message);
    throw new Error(`Could not update fare product: ${error.message}`);
  }
};

// Fare Product Silme
const deleteFareProduct = async (user_id, project_id, fare_product_id) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !fare_product_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        fare_product_id,
      });
      throw new Error("User ID, project ID, or fare product ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Kayıt var mı kontrolü
    const [[existingFareProduct]] = await pool.query(
      `SELECT fare_product_id FROM fare_products WHERE fare_product_id = ? AND user_id = ? AND project_id = ?`,
      [fare_product_id, user_id, project_id]
    );

    if (!existingFareProduct) {
      throw new Error("Fare product not found.");
    }

    // Bağımlı kayıtları kontrol et (fare_leg_rules, fare_transfer_rules)
    const [[dependentLegRules]] = await pool.query(
      `SELECT COUNT(*) as count FROM fare_leg_rules WHERE fare_product_id = ? AND user_id = ? AND project_id = ?`,
      [fare_product_id, user_id, project_id]
    );

    const [[dependentTransferRules]] = await pool.query(
      `SELECT COUNT(*) as count FROM fare_transfer_rules WHERE fare_product_id = ? AND user_id = ? AND project_id = ?`,
      [fare_product_id, user_id, project_id]
    );

    if (dependentLegRules.count > 0 || dependentTransferRules.count > 0) {
      throw new Error(
        "Cannot delete fare product: It is referenced in fare leg rules or transfer rules."
      );
    }

    // fare_products tablosundan sil
    const [result] = await pool.query(
      `
        DELETE FROM fare_products 
        WHERE fare_product_id = ? AND user_id = ? AND project_id = ?
      `,
      [fare_product_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete fare product.");
    }

    return {
      message: "Fare product deleted successfully.",
      fare_product_id,
    };
  } catch (error) {
    console.error("deleteFareProduct error:", error.message);
    throw new Error(`Could not delete fare product: ${error.message}`);
  }
};

// Fare Media Güncelleme
const updateFareMedia = async (
  user_id,
  project_id,
  fare_media_id,
  fare_media_name,
  fare_media_type
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !fare_media_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        fare_media_id,
      });
      throw new Error("User ID, project ID, or fare media ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (!fare_media_type == null) {
      throw new Error("Payment method name and type are required fields.");
    }

    // fare_media_type kontrolü (0: none, 1: paper ticket, 2: transit card, 3: cEMV, 4: mobile app)
    if (![0, 1, 2, 3, 4].includes(fare_media_type)) {
      throw new Error(
        "Invalid payment method type. Valid options: Cash (0), Paper Ticket (1), Transit Card (2), Contactless Card (3), Mobile Application (4)."
      );
    }

    // Kayıt var mı kontrolü
    const [[existingFareMedia]] = await pool.query(
      `SELECT fare_media_id FROM fare_media WHERE fare_media_id = ? AND user_id = ? AND project_id = ?`,
      [fare_media_id, user_id, project_id]
    );

    if (!existingFareMedia) {
      throw new Error("Fare media not found.");
    }

    // fare_media tablosunu güncelle
    const [result] = await pool.query(
      `
        UPDATE fare_media 
        SET fare_media_name = ?, fare_media_type = ?
        WHERE fare_media_id = ? AND user_id = ? AND project_id = ?
      `,
      [fare_media_name, fare_media_type, fare_media_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to update fare media.");
    }

    return {
      message: "Payment method updated successfully.",
      fare_media_id,
      fare_media_name,
      fare_media_type,
    };
  } catch (error) {
    console.error("updateFareMedia error:", error.message);
    throw new Error(`Could not update payment method: ${error.message}`);
  }
};

// Fare Media Silme
const deleteFareMedia = async (user_id, project_id, fare_media_id) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !fare_media_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        fare_media_id,
      });
      throw new Error("User ID, project ID, or fare media ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Kayıt var mı kontrolü
    const [[existingFareMedia]] = await pool.query(
      `SELECT fare_media_id FROM fare_media WHERE fare_media_id = ? AND user_id = ? AND project_id = ?`,
      [fare_media_id, user_id, project_id]
    );

    if (!existingFareMedia) {
      throw new Error("Fare media not found.");
    }

    // Bağımlı kayıtları kontrol et (fare_products)
    const [[dependentFareProducts]] = await pool.query(
      `SELECT COUNT(*) as count FROM fare_products WHERE fare_media_id = ? AND user_id = ? AND project_id = ?`,
      [fare_media_id, user_id, project_id]
    );

    if (dependentFareProducts.count > 0) {
      throw new Error(
        "Cannot delete fare media: It is referenced in fare products."
      );
    }

    // fare_media tablosundan sil
    const [result] = await pool.query(
      `
        DELETE FROM fare_media 
        WHERE fare_media_id = ? AND user_id = ? AND project_id = ?
      `,
      [fare_media_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete fare media.");
    }

    return {
      message: "Payment method deleted successfully.",
      fare_media_id,
    };
  } catch (error) {
    console.error("deleteFareMedia error:", error.message);
    throw new Error(`Could not delete payment method: ${error.message}`);
  }
};

// Rider Category Güncelleme
const updateRiderCategory = async (
  user_id,
  project_id,
  rider_category_id,
  rider_category_name,
  is_default_fare_category = 0,
  eligibility_url = null
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !rider_category_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        rider_category_id,
      });
      throw new Error("User ID, project ID, or rider category ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (!rider_category_name) {
      throw new Error("Invalid passenger category data: Name is required.");
    }

    // is_default_fare_category kontrolü
    if (![0, 1].includes(is_default_fare_category)) {
      throw new Error("Invalid default category value. (Must be 0 or 1)");
    }

    // Kayıt var mı kontrolü
    const [[existingRiderCategory]] = await pool.query(
      `SELECT rider_category_id FROM rider_categories WHERE rider_category_id = ? AND user_id = ? AND project_id = ?`,
      [rider_category_id, user_id, project_id]
    );

    if (!existingRiderCategory) {
      throw new Error("Rider category not found.");
    }

    // rider_categories tablosunu güncelle
    const [result] = await pool.query(
      `
        UPDATE rider_categories 
        SET rider_category_name = ?, is_default_fare_category = ?, eligibility_url = ?
        WHERE rider_category_id = ? AND user_id = ? AND project_id = ?
      `,
      [
        rider_category_name,
        is_default_fare_category,
        eligibility_url,
        rider_category_id,
        user_id,
        project_id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to update rider category.");
    }

    return {
      message: "Passenger category updated successfully.",
      rider_category_id,
      rider_category_name,
      is_default_fare_category,
      eligibility_url,
    };
  } catch (error) {
    console.error("updateRiderCategory error:", error.message);
    throw new Error(`Could not update passenger category: ${error.message}`);
  }
};

// Rider Category Silme
const deleteRiderCategory = async (user_id, project_id, rider_category_id) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !rider_category_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        rider_category_id,
      });
      throw new Error("User ID, project ID, or rider category ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Kayıt var mı kontrolü
    const [[existingRiderCategory]] = await pool.query(
      `SELECT rider_category_id FROM rider_categories WHERE rider_category_id = ? AND user_id = ? AND project_id = ?`,
      [rider_category_id, user_id, project_id]
    );

    if (!existingRiderCategory) {
      throw new Error("Rider category not found.");
    }

    // Bağımlı kayıtları kontrol et (fare_products)
    const [[dependentFareProducts]] = await pool.query(
      `SELECT COUNT(*) as count FROM fare_products WHERE rider_category_id = ? AND user_id = ? AND project_id = ?`,
      [rider_category_id, user_id, project_id]
    );

    if (dependentFareProducts.count > 0) {
      throw new Error(
        "Cannot delete rider category: It is referenced in fare products."
      );
    }

    // rider_categories tablosundan sil
    const [result] = await pool.query(
      `
        DELETE FROM rider_categories 
        WHERE rider_category_id = ? AND user_id = ? AND project_id = ?
      `,
      [rider_category_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete rider category.");
    }

    return {
      message: "Passenger category deleted successfully.",
      rider_category_id,
    };
  } catch (error) {
    console.error("deleteRiderCategory error:", error.message);
    throw new Error(`Could not delete passenger category: ${error.message}`);
  }
};

module.exports = {
  getDetailedFareForRoute,
  getAllFareProducts,
  getAllFareMedia,
  getAllRiderCategories,
  getAllNetworks,
  addFareProduct,
  addFareMedia,
  addRiderCategory,
  updateFareProduct,
  deleteFareProduct,
  updateFareMedia,
  deleteFareMedia,
  updateRiderCategory,
  deleteRiderCategory,
};
