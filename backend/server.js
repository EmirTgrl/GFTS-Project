const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./db.js");
const importGTFS = require("./gtfsImport.js");
const auth = require("./routes/auth.js");
const multer = require("multer");
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

// TODO: move this import/export service
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.post("/import-gtfs", auth, upload.single("file"), async (req, res) => {
  const userId = req.user.id;
  console.log("Import request received");
  console.log("User ID from token:", userId);

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    console.log("✅ File received:", req.file.originalname);
    console.log("📂 File path:", req.file.path);

    await importGTFS(req.file.path, userId);
    res.json({ message: "GTFS data imported successfully" });
  } catch (error) {
    console.error("❌ GTFS Import Error:", error.message);
    // Hata durumunda da dosyayı temizle
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Error importing GTFS data" });
  }
});

const indexController = require("./controllers/IndexController.js");
app.use("/api", indexController);

app.use("/auth", authRoutes);

const cleanupDirs = [
  path.join(__dirname, "temp"),
  path.join(__dirname, "uploads"),
];

cleanupDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
});

console.log("✨ Cleanup completed");

app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Server running on http://localhost:${port}`);
});
