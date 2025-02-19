const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./db.js");
const gtfsRoutes = require("./routes/gtfsRoutes.js");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;


const checkDatabaseConnection = async (retries = 5, interval = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log("MySQL connection successful!");
      connection.release();
      return; // Exit the loop if successful
    } catch (error) {
      console.error(`MySQL connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error("Max retries reached. Exiting.");
        process.exit(1); // Exit if all retries fail
      }
      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait before retrying
    }
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
