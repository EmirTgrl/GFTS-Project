const {pool} = require("../db.js");

const shapeService = {
  getShapeByQuery: async (req, res) => {
    const user_id = req.user.id;
    const validFieldsShape = [
      "shape_id",
      "shape_pt_lat",
      "shape_pt_lon",
      "shape_pt_sequence",
      "shape_dist_traveled",
      "project_id",
    ];

    const validFieldsTrip = ["trip_id"];

    const fields = [];
    const values = [];
    fields.push("shapes.user_id = ?");
    values.push(user_id);

    for (const param in req.query) {
      if (validFieldsShape.includes(param)) {
        fields.push(`shapes.${param} = ?`);
        values.push(req.query[param]);
      } else if (validFieldsTrip.includes(param)) {
        fields.push(`trips.${param} = ?`);
        values.push(req.query[param]);
      } else {
        console.warn(`Unexpected query parameter: ${param}`);
      }
    }

    let query = `
      SELECT * 
      FROM shapes
      JOIN trips ON shapes.shape_id = trips.shape_id
      WHERE ${fields.join(" AND ")}
    `;

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
      const { shape_id } = req.params;
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
        WHERE shape_id = ? AND user_id = ?
      `;

      const [result] = await pool.execute(query, [
        ...values,
        shape_id,
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
};

module.exports = shapeService;
