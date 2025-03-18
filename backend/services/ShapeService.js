const {pool} = require("../db.js");

const shapeService = {
  getShapeByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFields = [
      "shape_id",
      "shape_pt_lat",
      "shape_pt_lon",
      "shape_pt_sequence",
      "shape_dist_traveled",
      "project_id",
    ];

    const fields = [];
    const values = [];
    fields.push("user_id = ?")
    values.push(user_id);
  
    for (const param in req.query) {
      if (validFields.includes(param)) {
        fields.push(`${param} = ?`); 
        values.push(req.query[param]); 
      } else {
        console.warn(`Unexpected query parameter: ${param}`); // Log unexpected parameter
      }
    }
  
    let query = `SELECT * FROM shapes 
    WHERE ${fields.join(" AND ")}`;

    try {
      const [rows] = await pool.execute(query, values);
      res.json(rows.length > 0 ? rows : []);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  },

  deleteShapeById: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { shape_id, shape_pt_sequence } = req.params;
      const [result] = await pool.execute(
        `
        DELETE FROM shapes
        WHERE shape_id = ? AND shape_pt_sequence = ? AND user_id = ?
        `,
        [shape_id, shape_pt_sequence, user_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Shape not found" });
      }
      res.status(200).json({ message: "Shape deleted successfully" , affectedRows:result.affectedRows});
    } catch (error) {
      console.error(
        `Error in deleteShapeById for shape_id: ${req.params.service_id}:`,
        error
      );
      res.status(500).json({ error: "Server Error" });
    }
  },

  updateShape: async (req, res) => {
    try {
      const user_id = req.user.id;
      const { shape_id, shape_pt_sequence } = req.params;
      const { ...params } = req.body;
      const validFields = [
        "shape_pt_lat",
        "shape_pt_lon",
        "shape_pt_sequence",
        "shape_dist_traveled",
        "project_id",
      ];
      const fields = [];
      const values = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(`${param} = ?`);
          values.push(params[param]);
        } else {
          console.warn(`Unexpected field in ${param}`);
        }
      }

      const query = `
        UPDATE shapes
        SET ${fields.join(", ")}
        WHERE shape_id = ? AND shape_pt_sequence = ? AND user_id = ?
      `;

      const [result] = await pool.execute(query, [
        ...values,
        shape_id,
        shape_pt_sequence,
        user_id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Shape not found" });
      }

      res.status(200).json({message:"shape updated successfully"});
    } catch (error) {
      console.error(`Error in updateShape:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },

  saveShape: async (req, res) => {
    try {
      const user_id = req.user.id;
      const validFields = [
        "shape_id",
        "shape_pt_lat",
        "shape_pt_lon",
        "shape_pt_sequence",
        "shape_dist_traveled",
        "project_id",
      ];
      const { ...params } = req.body;

      const values = [];
      const fields = [];
      const placeholders = [];

      for (const param in params) {
        if (validFields.includes(param)) {
          fields.push(param);
          values.push(params[param]);
          placeholders.push("?");
        } else {
          console.warn(`Unexpected field ${param}`);
        }
      }

      fields.push("user_id");
      placeholders.push("?");
      values.push(user_id);

      const query = `
        INSERT INTO shapes(${fields.join(", ")})
        VALUES(${placeholders.join(", ")})
      `;
      const [result] = await pool.execute(query, values);

      res.status(201).json({shape_id:result.insertId});
    } catch (error) {
      console.error(`Error in saveShape:`, error);
      res.status(500).json({ error: "Server Error" });
    }
  },
  saveMultipleShape: async (req, res) => {
    const user_id = req.user.id;
    const shapesData = req.body;
    const {trip_id} = req.params

    if (!Array.isArray(shapesData)) {
        return res
            .status(400)
            .json({ error: "Expected an array of shape data." });
    }

    if (shapesData.length === 0) {
        return res.status(200).json({ message: "No shapes to update." });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const shapeId = shapesData[0].shape_id;
        // Delete existing shapes with the same shape_id
        await connection.execute(
            `DELETE FROM shapes WHERE shape_id = ? AND user_id = ?`,
            [shapeId, user_id]
        );

        // Prepare values for multi-row insert
        const validFields = [
            "shape_id",
            "shape_pt_lat",
            "shape_pt_lon",
            "shape_pt_sequence",
            "shape_dist_traveled",
            "project_id",
        ];

        const fields = validFields.filter(field => shapesData[0][field] !== undefined);
        fields.push("user_id");

        const valuePlaceholders = fields.map(() => '?').join(', ');

        const values = [];
        const rowPlaceholders = [];

        for (const shape of shapesData) {
            const rowValues = [];
            for (const field of fields) {
                rowValues.push(field === 'user_id' ? user_id : shape[field]);
            }
            values.push(...rowValues);
            rowPlaceholders.push(`(${valuePlaceholders})`);
        }


        const insertQuery = `
  INSERT INTO shapes (${fields.join(', ')})
  VALUES ${rowPlaceholders.join(', ')}
`;
        await connection.execute(insertQuery, values);
        // set the trips shape id
        await connection.execute(`
          update trips
          set shape_id = ?
          where trip_id = ?  and user_id = ?`
        ,[shapeId, trip_id, user_id])

        await connection.commit();
        res.status(200).json({ message: "Shapes updated successfully." });
    } catch (error) {
        await connection.rollback();
        console.error("Error in saveMultipleShape:", error);
        res.status(500).json({ error: "Server Error", details: error.message });
    } finally {
        connection.release();
    }
},
};

module.exports = shapeService;
