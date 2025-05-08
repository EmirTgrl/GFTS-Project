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

    // if (!routeData) {
    //   console.log("Route not found for route_id:", route_id);
    //   return null;
    // }

    const {
      route_id: fetchedRouteId,
      route_long_name,
      route_short_name,
      network_id,
      network_name,
    } = routeData;

    // if (!network_id) {
    //   console.log("Network not found for route_id:", route_id);
    //   return null;
    // }

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

    // if (!stopAreas || stopAreas.length === 0) {
    //   console.log("No areas found for route_id:", route_id);
    //   return null;
    // }

    // 3. İndi-Bindi (Sabit) ücretleri al
    const [fixedFares] = await pool.query(
      `
        SELECT 
            flr.leg_group_id,
            flr.fare_product_id,
            flr.from_area_id,
            flr.to_area_id,
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
            flr.from_area_id,
            flr.to_area_id,
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
        SELECT 
            ftr.from_leg_group_id,
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
            fp.currency AS transfer_currency,
            rc.rider_category_name
        FROM fare_transfer_rules ftr
        JOIN fare_leg_rules flr1 ON ftr.from_leg_group_id = flr1.leg_group_id
        JOIN fare_leg_rules flr2 ON ftr.to_leg_group_id = flr2.leg_group_id
        LEFT JOIN networks n1 ON flr1.network_id = n1.network_id
        LEFT JOIN networks n2 ON flr2.network_id = n2.network_id
        LEFT JOIN fare_products fp ON ftr.fare_product_id = fp.fare_product_id
        LEFT JOIN rider_categories rc ON fp.rider_category_id = rc.rider_category_id
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
      console.log("No fare rules found for route_id:", route_id);
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
    console.error("getDetailedFareForRoute error:", {
      message: error.message,
      stack: error.stack,
      route_id,
      user_id,
      project_id,
    });
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

// Tüm networks'ü alma (Güncellenmiş)
const getAllNetworks = async (user_id, project_id) => {
  try {
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("Kullanıcı ID veya proje ID eksik.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Geçersiz kullanıcı ID veya proje ID.");
    }

    const [rows] = await pool.query(
      `
        SELECT 
          n.network_id, 
          n.network_name, 
          GROUP_CONCAT(rn.route_id) as route_ids,
          GROUP_CONCAT(r.route_long_name) as route_names
        FROM networks n
        LEFT JOIN route_networks rn ON n.network_id = rn.network_id
        LEFT JOIN routes r ON rn.route_id = r.route_id
        WHERE n.user_id = ? AND n.project_id = ?
        GROUP BY n.network_id, n.network_name
      `,
      [user_id, project_id]
    );

    return rows.map((row) => ({
      ...row,
      route_ids: row.route_ids ? row.route_ids.split(",") : [],
      route_names: row.route_names ? row.route_names.split(",") : [],
    }));
  } catch (error) {
    console.error("getAllNetworks error:", error.message);
    throw new Error(`Ağlar alınamadı: ${error.message}`);
  }
};

// Tüm fare_transfer_rules'ları alma
const getAllFareTransferRules = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  user_id = parseInt(user_id, 10);
  project_id = parseInt(project_id, 10);
  const [rows] = await pool.query(
    `SELECT * FROM fare_transfer_rules WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows;
};

// Yeni: Network Ekleme
const addNetwork = async (
  user_id,
  project_id,
  network_id,
  network_name,
  route_ids
) => {
  try {
    if (!user_id || !project_id || !network_id || !network_name) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        network_id,
        network_name,
      });
      throw new Error("User ID, project ID, network ID, or name is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Ağın zaten var olup olmadığını kontrol et
    const [[existingNetwork]] = await pool.query(
      `SELECT network_id FROM networks WHERE network_id = ? AND user_id = ? AND project_id = ?`,
      [network_id, user_id, project_id]
    );

    if (existingNetwork) {
      throw new Error("Network ID already exists.");
    }

    // Yeni ağ ekle
    const [result] = await pool.query(
      `
        INSERT INTO networks (network_id, network_name, user_id, project_id)
        VALUES (?, ?, ?, ?)
      `,
      [network_id, network_name, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to add network.");
    }

    // Eğer route_ids varsa, route_networks tablosuna ekle
    if (route_ids && Array.isArray(route_ids) && route_ids.length > 0) {
      // Rotların varlığını kontrol et
      for (const route_id of route_ids) {
        const [[existingRoute]] = await pool.query(
          `SELECT route_id FROM routes WHERE route_id = ? AND user_id = ? AND project_id = ?`,
          [route_id, user_id, project_id]
        );
        if (!existingRoute) {
          throw new Error(`Invalid route ID: ${route_id} does not exist.`);
        }
      }

      const routeValues = route_ids.map((route_id) => [
        network_id,
        route_id,
        user_id,
        project_id,
      ]);

      await pool.query(
        `
          INSERT INTO route_networks(network_id, route_id, user_id, project_id)
          VALUES ?
        `,
        [routeValues]
      );
    }

    return {
      network_id,
      network_name,
      route_ids: route_ids || [],
      message: "Network added successfully.",
    };
  } catch (error) {
    console.error("addNetwork error:", error.message);
    throw new Error(`Could not add network: ${error.message}`);
  }
};

const updateNetwork = async (
  user_id,
  project_id,
  network_id,
  network_name,
  route_ids
) => {
  try {
    if (!user_id || !project_id || !network_id || !network_name) {
      console.error("Eksik zorunlu alanlar:", {
        user_id,
        project_id,
        network_id,
        network_name,
      });
      throw new Error("Kullanıcı ID, proje ID, ağ ID veya isim eksik.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Geçersiz user_id veya project_id:", {
        user_id,
        project_id,
      });
      throw new Error("Geçersiz kullanıcı ID veya proje ID.");
    }

    // Ağın varlığını kontrol et
    const [[existingNetwork]] = await pool.query(
      `SELECT network_id FROM networks WHERE network_id = ? AND user_id = ? AND project_id = ?`,
      [network_id, user_id, project_id]
    );

    if (!existingNetwork) {
      throw new Error("Ağ bulunamadı.");
    }

    // Ağ adını güncelle
    const [updateResult] = await pool.query(
      `
        UPDATE networks 
        SET network_name = ?
        WHERE network_id = ? AND user_id = ? AND project_id = ?
      `,
      [network_name, network_id, user_id, project_id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Failed to update network.");
    }

    // Mevcut rota bağlantılarını sil
    await pool.query(
      `
        DELETE FROM route_networks 
        WHERE network_id = ? AND user_id = ? AND project_id = ?
      `,
      [network_id, user_id, project_id]
    );

    // Yeni rota bağlantılarını ekle (eğer varsa)
    if (route_ids && Array.isArray(route_ids) && route_ids.length > 0) {
      for (const route_id of route_ids) {
        const [[existingRoute]] = await pool.query(
          `SELECT route_id FROM routes WHERE route_id = ? AND user_id = ? AND project_id = ?`,
          [route_id, user_id, project_id]
        );
        if (!existingRoute) {
          throw new Error(`Invalid route ID: ${route_id} does not exist.`);
        }
      }

      const routeValues = route_ids.map((route_id) => [
        network_id,
        route_id,
        user_id,
        project_id,
      ]);

      await pool.query(
        `
          INSERT INTO route_networks(network_id, route_id, user_id, project_id)
          VALUES ?
        `,
        [routeValues]
      );
    }

    return {
      network_id,
      network_name,
      route_ids: route_ids || [],
      message: "Ağ başarıyla güncellendi.",
    };
  } catch (error) {
    console.error("updateNetwork error:", error.message);
    throw new Error(`Failed to update network: ${error.message}`);
  }
};

// Yeni: Network Silme
const deleteNetwork = async (user_id, project_id, network_id) => {
  try {
    if (!user_id || !project_id || !network_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        network_id,
      });
      throw new Error("User ID, project ID, or network ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Ağın varlığını kontrol et
    const [[existingNetwork]] = await pool.query(
      `SELECT network_id FROM networks WHERE network_id = ? AND user_id = ? AND project_id = ?`,
      [network_id, user_id, project_id]
    );

    if (!existingNetwork) {
      throw new Error("Network not found.");
    }

    // Bağımlı kayıtları kontrol et (fare_leg_rules)
    const [[dependentFareLegRules]] = await pool.query(
      `SELECT COUNT(*) as count FROM fare_leg_rules WHERE network_id = ? AND user_id = ? AND project_id = ?`,
      [network_id, user_id, project_id]
    );

    if (dependentFareLegRules.count > 0) {
      throw new Error(
        "Cannot delete network: It is referenced in fare leg rules."
      );
    }

    // Bağımlı kayıtları sil (route_networks)
    await pool.query(
      `
        DELETE FROM route_networks 
        WHERE network_id = ? AND user_id = ? AND project_id = ?
      `,
      [network_id, user_id, project_id]
    );

    // Ağ'ı sil
    const [result] = await pool.query(
      `
        DELETE FROM networks 
        WHERE network_id = ? AND user_id = ? AND project_id = ?
      `,
      [network_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete network.");
    }

    return {
      message: "Network deleted successfully.",
      network_id,
    };
  } catch (error) {
    console.error("deleteNetwork error:", error.message);
    throw new Error(`Could not delete network: ${error.message}`);
  }
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
  from_area_id = null,
  to_area_id = null,
  route_id = null
) => {
  try {
    // Input validation
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

    if (!fare_product_name || amount < 0 || !currency) {
      throw new Error(
        "Invalid fare data: Name, amount, and currency are required."
      );
    }

    if (!from_area_id || !to_area_id) {
      throw new Error("Both from_area_id and to_area_id are required.");
    }

    // Generate unique fare_product_id
    const fare_product_id = `fare_product_${Date.now()}`;

    // Insert into fare_products table
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

    // Fetch network_id based on route_id
    let network_id;
    if (route_id) {
      const [[routeData]] = await pool.query(
        `
          SELECT rn.network_id
          FROM route_networks rn
          WHERE rn.route_id = ? AND rn.user_id = ? AND rn.project_id = ?
          LIMIT 1
        `,
        [route_id, user_id, project_id]
      );

      if (!routeData || !routeData.network_id) {
        throw new Error(
          `No network found for route ID: ${route_id}. Please define a network for this route.`
        );
      }
      network_id = routeData.network_id;
    } else {
      // Fallback to area-based network lookup
      const [[areaData]] = await pool.query(
        `
          SELECT rn.network_id
          FROM stop_areas sa
          JOIN stops s ON sa.stop_id = s.stop_id
          JOIN stop_times st ON s.stop_id = st.stop_id
          JOIN trips t ON st.trip_id = t.trip_id
          JOIN route_networks rn ON t.route_id = rn.route_id
          WHERE sa.area_id = ? AND sa.user_id = ? AND sa.project_id = ?
          LIMIT 1
        `,
        [from_area_id, user_id, project_id]
      );

      if (!areaData || !areaData.network_id) {
        throw new Error(
          `No network found for from_area_id: ${from_area_id}. Please define a network for this area.`
        );
      }
      network_id = areaData.network_id;
    }

    // Validate from_area_id and to_area_id
    const [[fromAreaExists]] = await pool.query(
      `
        SELECT area_id
        FROM areas
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [from_area_id, user_id, project_id]
    );

    const [[toAreaExists]] = await pool.query(
      `
        SELECT area_id
        FROM areas
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [to_area_id, user_id, project_id]
    );

    if (!fromAreaExists) {
      throw new Error(`Invalid from_area_id: ${from_area_id} does not exist.`);
    }

    if (!toAreaExists) {
      throw new Error(`Invalid to_area_id: ${to_area_id} does not exist.`);
    }

    // Insert into fare_leg_rules table
    const leg_group_id = `leg_${fare_product_id}`;
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

    return {
      message: "Fare product and leg rules added successfully.",
      fare_product_id,
      fare_product_name,
      amount,
      currency,
      rider_category_id,
      fare_media_id,
      from_area_id,
      to_area_id,
      network_id,
      route_id,
    };
  } catch (error) {
    console.error("AddFareProduct error:", error.message);
    throw new Error(`Could not add fare product: ${error.message}`);
  }
};

const addFareMedia = async (
  user_id,
  project_id,
  fare_media_id,
  fare_media_name,
  fare_media_type
) => {
  try {
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

    if (!fare_media_id || !fare_media_name || fare_media_type == null) {
      throw new Error("Payment method ID, name, and type are required fields.");
    }

    if (![0, 1, 2, 3, 4].includes(fare_media_type)) {
      throw new Error(
        "Invalid payment method type. Valid options: Cash (0), Paper Ticket (1), Transit Card (2), Contactless Card (3), Mobile Application (4)."
      );
    }

    const [[existingFareMedia]] = await pool.query(
      `SELECT fare_media_id FROM fare_media WHERE fare_media_id = ? AND user_id = ? AND project_id = ?`,
      [fare_media_id, user_id, project_id]
    );

    if (existingFareMedia) {
      throw new Error(`Fare media ID ${fare_media_id} already exists.`);
    }

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
  rider_category_id,
  rider_category_name,
  is_default_fare_category = 0,
  eligibility_url = null
) => {
  try {
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

    if (!rider_category_id || !rider_category_name) {
      throw new Error(
        "Invalid passenger category data: ID and name are required."
      );
    }

    if (![0, 1].includes(is_default_fare_category)) {
      throw new Error("Invalid default category value. (Must be 0 or 1)");
    }

    const [[existingRiderCategory]] = await pool.query(
      `SELECT rider_category_id FROM rider_categories WHERE rider_category_id = ? AND user_id = ? AND project_id = ?`,
      [rider_category_id, user_id, project_id]
    );

    if (existingRiderCategory) {
      throw new Error(`Rider category ID ${rider_category_id} already exists.`);
    }

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

// Yeni: Fare Transfer Rule Ekleme
const addFareTransferRule = async (
  user_id,
  project_id,
  from_leg_group_id,
  to_leg_group_id,
  transfer_count = 1,
  duration_limit = null,
  duration_limit_type = null,
  fare_transfer_type,
  fare_product_id = null
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
    if (!from_leg_group_id || !to_leg_group_id || fare_transfer_type == null) {
      throw new Error(
        "Invalid transfer rule data: From leg group, to leg group, and fare transfer type are required."
      );
    }

    // from_leg_group_id ve to_leg_group_id kontrolü
    const [[fromLegGroup]] = await pool.query(
      `SELECT leg_group_id FROM fare_leg_rules WHERE leg_group_id = ? AND user_id = ? AND project_id = ?`,
      [from_leg_group_id, user_id, project_id]
    );
    if (!fromLegGroup) {
      throw new Error("Invalid from leg group ID: Leg group does not exist.");
    }

    const [[toLegGroup]] = await pool.query(
      `SELECT leg_group_id FROM fare_leg_rules WHERE leg_group_id = ? AND user_id = ? AND project_id = ?`,
      [to_leg_group_id, user_id, project_id]
    );
    if (!toLegGroup) {
      throw new Error("Invalid to leg group ID: Leg group does not exist.");
    }

    // transfer_count kontrolü
    if (transfer_count < 0) {
      throw new Error("Invalid transfer count: Must be a non-negative number.");
    }

    // duration_limit kontrolü
    if (
      duration_limit !== null &&
      (isNaN(duration_limit) || duration_limit < 0)
    ) {
      throw new Error(
        "Invalid duration limit: Must be a non-negative number or null."
      );
    }

    // duration_limit_type kontrolü (0: departure-to-departure, 1: departure-to-arrival, 2: arrival-to-departure, 3: arrival-to-arrival)
    if (
      duration_limit_type !== null &&
      ![0, 1, 2, 3].includes(duration_limit_type)
    ) {
      throw new Error(
        "Invalid duration limit type. Valid options: Departure-to-Departure (0), Departure-to-Arrival (1), Arrival-to-Departure (2), Arrival-to-Arrival (3)."
      );
    }

    // fare_transfer_type kontrolü (0: one-way, 1: two-way, 2: circular)
    if (![0, 1, 2].includes(fare_transfer_type)) {
      throw new Error(
        "Invalid fare transfer type. Valid options: One-Way (0), Two-Way (1), Circular (2)."
      );
    }

    // fare_product_id kontrolü
    if (fare_product_id) {
      const [[fareProduct]] = await pool.query(
        `SELECT fare_product_id FROM fare_products WHERE fare_product_id = ? AND user_id = ? AND project_id = ?`,
        [fare_product_id, user_id, project_id]
      );
      if (!fareProduct) {
        throw new Error(
          "Invalid fare product ID: Fare product does not exist."
        );
      }
    }

    // fare_transfer_rules tablosuna ekleme
    await pool.query(
      `
        INSERT INTO fare_transfer_rules 
        (from_leg_group_id, to_leg_group_id, transfer_count, duration_limit, duration_limit_type, fare_transfer_type, fare_product_id, user_id, project_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        from_leg_group_id,
        to_leg_group_id,
        transfer_count,
        duration_limit,
        duration_limit_type,
        fare_transfer_type,
        fare_product_id,
        user_id,
        project_id,
      ]
    );

    return {
      message: "Fare transfer rule added successfully.",
      from_leg_group_id,
      to_leg_group_id,
      transfer_count,
      duration_limit,
      duration_limit_type,
      fare_transfer_type,
      fare_product_id,
    };
  } catch (error) {
    console.error("addFareTransferRule error:", error.message);
    throw new Error(`Could not add fare transfer rule: ${error.message}`);
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
    if (!fare_media_name || fare_media_type == null) {
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

// Yeni: Fare Transfer Rule Güncelleme
const updateFareTransferRule = async (
  user_id,
  project_id,
  from_leg_group_id,
  to_leg_group_id,
  transfer_count = 1,
  duration_limit = null,
  duration_limit_type = null,
  fare_transfer_type,
  fare_product_id = null
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !from_leg_group_id || !to_leg_group_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        from_leg_group_id,
        to_leg_group_id,
      });
      throw new Error(
        "User ID, project ID, from leg group ID, or to leg group ID is missing."
      );
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Gerekli alanların kontrolü
    if (fare_transfer_type == null) {
      throw new Error(
        "Invalid transfer rule data: Fare transfer type is required."
      );
    }

    // from_leg_group_id ve to_leg_group_id kontrolü
    const [[fromLegGroup]] = await pool.query(
      `SELECT leg_group_id FROM fare_leg_rules WHERE leg_group_id = ? AND user_id = ? AND project_id = ?`,
      [from_leg_group_id, user_id, project_id]
    );
    if (!fromLegGroup) {
      throw new Error("Invalid from leg group ID: Leg group does not exist.");
    }

    const [[toLegGroup]] = await pool.query(
      `SELECT leg_group_id FROM fare_leg_rules WHERE leg_group_id = ? AND user_id = ? AND project_id = ?`,
      [to_leg_group_id, user_id, project_id]
    );
    if (!toLegGroup) {
      throw new Error("Invalid to leg group ID: Leg group does not exist.");
    }

    // Kayıt var mı kontrolü
    const [[existingTransferRule]] = await pool.query(
      `SELECT from_leg_group_id, to_leg_group_id FROM fare_transfer_rules WHERE from_leg_group_id = ? AND to_leg_group_id = ? AND user_id = ? AND project_id = ?`,
      [from_leg_group_id, to_leg_group_id, user_id, project_id]
    );

    if (!existingTransferRule) {
      throw new Error("Fare transfer rule not found.");
    }

    // transfer_count kontrolü
    if (transfer_count < 0) {
      throw new Error("Invalid transfer count: Must be a non-negative number.");
    }

    // duration_limit kontrolü
    if (
      duration_limit !== null &&
      (isNaN(duration_limit) || duration_limit < 0)
    ) {
      throw new Error(
        "Invalid duration limit: Must be a non-negative number or null."
      );
    }

    // duration_limit_type kontrolü (0: departure-to-departure, 1: departure-to-arrival, 2: arrival-to-departure, 3: arrival-to-arrival)
    if (
      duration_limit_type !== null &&
      ![0, 1, 2, 3].includes(duration_limit_type)
    ) {
      throw new Error(
        "Invalid duration limit type. Valid options: Departure-to-Departure (0), Departure-to-Arrival (1), Arrival-to-Departure (2), Arrival-to-Arrival (3)."
      );
    }

    // fare_transfer_type kontrolü (0: one-way, 1: two-way, 2: circular)
    if (![0, 1, 2].includes(fare_transfer_type)) {
      throw new Error(
        "Invalid fare transfer type. Valid options: One-Way (0), Two-Way (1), Circular (2)."
      );
    }

    // fare_product_id kontrolü
    if (fare_product_id) {
      const [[fareProduct]] = await pool.query(
        `SELECT fare_product_id FROM fare_products WHERE fare_product_id = ? AND user_id = ? AND project_id = ?`,
        [fare_product_id, user_id, project_id]
      );
      if (!fareProduct) {
        throw new Error(
          "Invalid fare product ID: Fare product does not exist."
        );
      }
    }

    // fare_transfer_rules tablosunu güncelle
    const [result] = await pool.query(
      `
        UPDATE fare_transfer_rules 
        SET transfer_count = ?, duration_limit = ?, duration_limit_type = ?, fare_transfer_type = ?, fare_product_id = ?
        WHERE from_leg_group_id = ? AND to_leg_group_id = ? AND user_id = ? AND project_id = ?
      `,
      [
        transfer_count,
        duration_limit,
        duration_limit_type,
        fare_transfer_type,
        fare_product_id,
        from_leg_group_id,
        to_leg_group_id,
        user_id,
        project_id,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to update fare transfer rule.");
    }

    return {
      message: "Fare transfer rule updated successfully.",
      from_leg_group_id,
      to_leg_group_id,
      transfer_count,
      duration_limit,
      duration_limit_type,
      fare_transfer_type,
      fare_product_id,
    };
  } catch (error) {
    console.error("updateFareTransferRule error:", error.message);
    throw new Error(`Could not update fare transfer rule: ${error.message}`);
  }
};

// Yeni: Fare Transfer Rule Silme
const deleteFareTransferRule = async (
  user_id,
  project_id,
  from_leg_group_id,
  to_leg_group_id
) => {
  try {
    // user_id ve project_id kontrolü
    if (!user_id || !project_id || !from_leg_group_id || !to_leg_group_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        from_leg_group_id,
        to_leg_group_id,
      });
      throw new Error(
        "User ID, project ID, from leg group ID, or to leg group ID is missing."
      );
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Kayıt var mı kontrolü
    const [[existingTransferRule]] = await pool.query(
      `SELECT from_leg_group_id, to_leg_group_id FROM fare_transfer_rules WHERE from_leg_group_id = ? AND to_leg_group_id = ? AND user_id = ? AND project_id = ?`,
      [from_leg_group_id, to_leg_group_id, user_id, project_id]
    );

    if (!existingTransferRule) {
      throw new Error("Fare transfer rule not found.");
    }

    // fare_transfer_rules tablosundan sil
    const [result] = await pool.query(
      `
        DELETE FROM fare_transfer_rules 
        WHERE from_leg_group_id = ? AND to_leg_group_id = ? AND user_id = ? AND project_id = ?
      `,
      [from_leg_group_id, to_leg_group_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete fare transfer rule.");
    }

    return {
      message: "Fare transfer rule deleted successfully.",
      from_leg_group_id,
      to_leg_group_id,
    };
  } catch (error) {
    console.error("deleteFareTransferRule error:", error.message);
    throw new Error(`Could not delete fare transfer rule: ${error.message}`);
  }
};

const getAllLegGroups = async (user_id, project_id) => {
  if (!user_id || !project_id) {
    console.error("Missing user_id or project_id:", { user_id, project_id });
    return [];
  }
  user_id = parseInt(user_id, 10);
  project_id = parseInt(project_id, 10);
  const [rows] = await pool.query(
    `SELECT leg_group_id FROM fare_leg_rules WHERE user_id = ? AND project_id = ?`,
    [user_id, project_id]
  );
  return rows.map((row) => row.leg_group_id);
};

const getAllAreas = async (user_id, project_id) => {
  try {
    if (!user_id || !project_id) {
      console.error("Missing user_id or project_id:", { user_id, project_id });
      throw new Error("Missing user ID or project ID.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    const [rows] = await pool.query(
      `
        SELECT 
          a.area_id, 
          a.area_name, 
          GROUP_CONCAT(sa.stop_id) as stop_ids,
          GROUP_CONCAT(s.stop_name) as stop_names
        FROM areas a
        LEFT JOIN stop_areas sa ON a.area_id = sa.area_id
        LEFT JOIN stops s ON sa.stop_id = s.stop_id
        WHERE a.user_id = ? AND a.project_id = ?
        GROUP BY a.area_id, a.area_name
      `,
      [user_id, project_id]
    );

    return rows.map((row) => ({
      ...row,
      stop_ids: row.stop_ids ? row.stop_ids.split(",") : [],
      stop_names: row.stop_names ? row.stop_names.split(",") : [],
    }));
  } catch (error) {
    console.error("getAllAreas detailed error:", {
      message: error.message,
      stack: error.stack,
      user_id,
      project_id,
    });
    throw new Error(`Areas could not be retrieved: ${error.message}`);
  }
};

// New : Add Area
const addArea = async (
  user_id,
  project_id,
  area_id,
  area_name,
  stop_ids = []
) => {
  try {
    if (!user_id || !project_id || !area_id || !area_name) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        area_id,
        area_name,
      });
      throw new Error("User ID, project ID, area ID, or area name is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    if (!Array.isArray(stop_ids)) {
      throw new Error("stop_ids must be an array.");
    }

    // area_id'nin benzersizliğini kontrol et
    const [[existingArea]] = await pool.query(
      `
        SELECT area_id
        FROM areas
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_id, user_id, project_id]
    );

    if (existingArea) {
      throw new Error(`Area ID ${area_id} already exists.`);
    }

    // areas tablosuna ekleme
    const [result] = await pool.query(
      `
        INSERT INTO areas (area_id, area_name, user_id, project_id)
        VALUES (?, ?, ?, ?)
      `,
      [area_id, area_name, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to add area.");
    }

    // Eğer stop_ids varsa, stop_areas tablosuna ekle
    if (stop_ids.length > 0) {
      // Durakların varlığını kontrol et
      for (const stop_id of stop_ids) {
        const [[existingStop]] = await pool.query(
          `
            SELECT stop_id
            FROM stops
            WHERE stop_id = ? AND user_id = ? AND project_id = ?
          `,
          [stop_id, user_id, project_id]
        );
        if (!existingStop) {
          throw new Error(`Invalid stop ID: ${stop_id} does not exist.`);
        }
      }

      const stopAreaValues = stop_ids.map((stop_id) => [
        stop_id,
        area_id,
        user_id,
        project_id,
      ]);

      await pool.query(
        `
          INSERT INTO stop_areas (stop_id, area_id, user_id, project_id)
          VALUES ?
        `,
        [stopAreaValues]
      );
    }

    return {
      area_id,
      area_name,
      stop_ids,
      message: "Area added successfully.",
    };
  } catch (error) {
    console.error("addArea error:", error.message);
    throw new Error(`Could not add area: ${error.message}`);
  }
};

// Update Area
const updateArea = async (
  user_id,
  project_id,
  area_id,
  area_name,
  stop_ids = []
) => {
  try {
    if (!user_id || !project_id || !area_id || !area_name) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        area_id,
        area_name,
      });
      throw new Error("User ID, project ID, area ID, or area name is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    if (!Array.isArray(stop_ids)) {
      throw new Error("stop_ids must be an array.");
    }

    // Alanın varlığını kontrol et
    const [[existingArea]] = await pool.query(
      `
        SELECT area_id
        FROM areas
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_id, user_id, project_id]
    );

    if (!existingArea) {
      throw new Error("Area not found.");
    }

    // areas tablosunu güncelle
    const [updateResult] = await pool.query(
      `
        UPDATE areas 
        SET area_name = ?
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_name, area_id, user_id, project_id]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error("Failed to update area.");
    }

    // Mevcut stop_areas kayıtlarını sil
    await pool.query(
      `
        DELETE FROM stop_areas
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_id, user_id, project_id]
    );

    // Yeni stop_ids varsa, stop_areas tablosuna ekle
    if (stop_ids.length > 0) {
      // Durakların varlığını kontrol et
      for (const stop_id of stop_ids) {
        const [[existingStop]] = await pool.query(
          `
            SELECT stop_id
            FROM stops
            WHERE stop_id = ? AND user_id = ? AND project_id = ?
          `,
          [stop_id, user_id, project_id]
        );
        if (!existingStop) {
          throw new Error(`Invalid stop ID: ${stop_id} does not exist.`);
        }
      }

      const stopAreaValues = stop_ids.map((stop_id) => [
        stop_id,
        area_id,
        user_id,
        project_id,
      ]);

      await pool.query(
        `
          INSERT INTO stop_areas (stop_id, area_id, user_id, project_id)
          VALUES ?
        `,
        [stopAreaValues]
      );
    }

    return {
      area_id,
      area_name,
      stop_ids,
      message: "Area updated successfully.",
    };
  } catch (error) {
    console.error("updateArea error:", error.message);
    throw new Error(`Could not update area: ${error.message}`);
  }
};

// Delete Area
const deleteArea = async (user_id, project_id, area_id) => {
  try {
    if (!user_id || !project_id || !area_id) {
      console.error("Missing required fields:", {
        user_id,
        project_id,
        area_id,
      });
      throw new Error("User ID, project ID, or area ID is missing.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Invalid user ID or project ID.");
    }

    // Alanın varlığını kontrol et
    const [[existingArea]] = await pool.query(
      `
        SELECT area_id
        FROM areas
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_id, user_id, project_id]
    );

    if (!existingArea) {
      throw new Error("Area not found.");
    }

    // Bağımlı kayıtları kontrol et (fare_leg_rules)
    const [[dependentFareLegRules]] = await pool.query(
      `
        SELECT COUNT(*) as count
        FROM fare_leg_rules
        WHERE from_area_id = ? OR to_area_id = ?
        AND user_id = ? AND project_id = ?
      `,
      [area_id, area_id, user_id, project_id]
    );

    if (dependentFareLegRules.count > 0) {
      throw new Error(
        "Cannot delete area: It is referenced in fare leg rules."
      );
    }

    // stop_areas kayıtlarını sil
    await pool.query(
      `
        DELETE FROM stop_areas 
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_id, user_id, project_id]
    );

    // areas tablosundan sil
    const [result] = await pool.query(
      `
        DELETE FROM areas 
        WHERE area_id = ? AND user_id = ? AND project_id = ?
      `,
      [area_id, user_id, project_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete area.");
    }

    return {
      message: "Area deleted successfully.",
      area_id,
    };
  } catch (error) {
    console.error("deleteArea error:", error.message);
    throw new Error(`Could not delete area: ${error.message}`);
  }
};

module.exports = {
  getDetailedFareForRoute,
  getAllFareProducts,
  getAllFareMedia,
  getAllRiderCategories,
  getAllNetworks,
  getAllFareTransferRules,
  addFareProduct,
  addFareMedia,
  addRiderCategory,
  addFareTransferRule,
  updateFareProduct,
  deleteFareProduct,
  updateFareMedia,
  deleteFareMedia,
  updateRiderCategory,
  deleteRiderCategory,
  updateFareTransferRule,
  deleteFareTransferRule,
  getAllLegGroups,
  addNetwork,
  deleteNetwork,
  updateNetwork,
  getAllAreas,
  addArea,
  updateArea,
  deleteArea,
};
