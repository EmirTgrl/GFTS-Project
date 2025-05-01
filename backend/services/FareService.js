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
      throw new Error("Kullanıcı kimliği veya proje kimliği eksik.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Geçersiz kullanıcı kimliği veya proje kimliği.");
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
      console.log("Rota bulunamadı.");
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
      console.log("Ağ bulunamadı.");
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
      console.log("Rota için alan bulunamadı.");
      return null;
    }

    // 3. İndi-Bindi (Sabit) ücretleri al
    const [fixedFares] = await pool.query(
      `
        SELECT 
            flr.leg_group_id,
            flr.fare_product_id,
            fp.fare_product_name,
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
      console.log("Ücret kuralı bulunamadı.");
      return null;
    }

    return {
      route_id: fetchedRouteId,
      route_name: route_long_name || route_short_name || route_id,
      network_id,
      network_name: network_name || "Bilinmeyen Ağ",
      fixed_fares: fixedFares,
      distance_based_fares: filteredDistanceFares,
      transfer_rules: transferRules,
    };
  } catch (error) {
    console.error("getDetailedFareForRoute error:", error.stack);
    throw new Error(`Ücret bilgisi alınamadı: ${error.message}`);
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
      throw new Error("Kullanıcı kimliği veya proje kimliği eksik.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Geçersiz kullanıcı kimliği veya proje kimliği.");
    }

    // Gerekli alanların kontrolü
    if (!fare_product_name || amount < 0 || !currency) {
      throw new Error(
        "Geçersiz ücret verisi: İsim, miktar ve para birimi zorunlu."
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
        console.error("Network ID bulunamadı:", {
          route_id,
          user_id,
          project_id,
        });
        throw new Error("Seçilen rota için ağ bilgisi bulunamadı.");
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
        console.error("Rota için durak alanı bulunamadı:", {
          route_id,
          user_id,
          project_id,
        });
        throw new Error(
          "Rota için durak alanı tanımlı değil. Lütfen durak alanlarını kontrol edin."
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
      message: "Ücret ürünü başarılı şekilde eklendi.",
      fare_product_id,
      fare_product_name,
      amount,
      currency,
      rider_category_id,
      fare_media_id,
    };
  } catch (error) {
    console.error("addFareProduct error:", error.message);
    throw new Error(`Ücret ürünü eklenemedi: ${error.message}`);
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
      throw new Error("Kullanıcı kimliği veya proje kimliği eksik.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Geçersiz kullanıcı kimliği veya proje kimliği.");
    }

    // Gerekli alanların kontrolü
    if (!fare_media_name || fare_media_type == null) {
      throw new Error("Ödeme yöntemi adı ve türü zorunlu alanlardır.");
    }

    // fare_media_type kontrolü (0: none, 1: paper ticket, 2: transit card, 3: cEMV, 4: mobile app)
    if (![0, 1, 2, 3, 4].includes(fare_media_type)) {
      throw new Error(
        "Geçersiz ödeme yöntemi türü. Geçerli seçenekler: Hiçbiri (0), Kağıt Bilet (1), Transit Kart (2), Temassız Kart (3), Mobil Uygulama (4)."
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
      message: "Ödeme yöntemi başarılı şekilde eklendi.",
      fare_media_id,
      fare_media_name,
      fare_media_type,
    };
  } catch (error) {
    console.error("addFareMedia error:", error.message);
    throw new Error(`Ödeme yöntemi eklenemedi: ${error.message}`);
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
      throw new Error("Kullanıcı kimliği veya proje kimliği eksik.");
    }

    user_id = parseInt(user_id, 10);
    project_id = parseInt(project_id, 10);

    if (isNaN(user_id) || isNaN(project_id)) {
      console.error("Invalid user_id or project_id:", { user_id, project_id });
      throw new Error("Geçersiz kullanıcı kimliği veya proje kimliği.");
    }

    // Gerekli alanların kontrolü
    if (!rider_category_name) {
      throw new Error("Geçersiz yolcu kategorisi verisi: İsim zorunlu.");
    }

    // is_default_fare_category kontrolü
    if (![0, 1].includes(is_default_fare_category)) {
      throw new Error("Geçersiz varsayılan kategori değeri. (0 veya 1 olmalı)");
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
      message: "Yolcu kategorisi başarılı şekilde eklendi.",
      rider_category_id,
      rider_category_name,
      is_default_fare_category,
      eligibility_url,
    };
  } catch (error) {
    console.error("addRiderCategory error:", error.message);
    throw new Error(`Yolcu kategorisi eklenemedi: ${error.message}`);
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
};
