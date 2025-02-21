const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./db.js");
const path = require("path");
const fs = require("fs");
const authRoutes = require("./routes/authRoutes.js");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// TODO: move this to db.js
const checkDatabaseConnection = async (retries = 5, interval = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log("MySQL connection successful!");
      connection.release();
      return;
    } catch (error) {
      console.error(`MySQL connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error("Max retries reached. Exiting.");
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
};

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
const indexController = require("./controllers/IndexController.js");
const importController = require("./controllers/ImportController.js");

app.use("/api", indexController);
app.use("/auth", authRoutes);
app.use("/import-gtfs", importController);

// Cleanup directories
// const cleanupDirs = [
//   path.join(__dirname, "temp"),
//   path.join(__dirname, "uploads"),
// ];

// cleanupDirs.forEach((dir) => {
//   if (fs.existsSync(dir)) {
//     fs.rmSync(dir, { recursive: true, force: true });
//   }
//   fs.mkdirSync(dir, { recursive: true });
// });

// console.log("✨ Cleanup completed");

app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Server running on http://localhost:${port}`);
});
