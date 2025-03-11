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
};

module.exports = shapeService;
