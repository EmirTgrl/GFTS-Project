const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./db.js");
const gtfsRoutes = require("./routes/gtfsRoutes.js");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL bağlantısı başarılı!");
    connection.release();
  } catch (error) {
    console.error("MySQL bağlantı hatası:", error.message);
    process.exit(1);
  }
};

// Middlewares
app.use(express.json());
app.use(cors());
app.use("/api", gtfsRoutes);

app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Sunucu ${port} portunda çalışıyor`);
});
