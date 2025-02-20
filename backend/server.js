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
  try {
    console.log("📤 Import request received");
    console.log("User ID from token:", req.user?.id);

    const userId = req.user.id;
    if (!userId) {
      console.error("❌ User ID missing in request");
      return res.status(400).json({ message: "User ID is missing" });
    }

    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("✅ File received:", req.file.originalname);

    const filePath = path.join(__dirname, "uploads", req.file.originalname);
    console.log("📂 File path:", filePath);

    await importGTFS(filePath, userId);

    const query = `
      INSERT INTO imported_data (id, file_name, import_date)
      VALUES (?, ?, NOW())
    `;
    await pool.query(query, [userId, req.file.originalname]);

    console.log("✅ GTFS Import Completed Successfully!");
    res.status(200).json({ message: "GTFS data imported successfully" });
  } catch (error) {
    console.error("❌ GTFS Import Error:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

const indexController = require("./controllers/IndexController.js");
app.use("/api",indexController);

app.use("/auth", authRoutes);


app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Server running on http://localhost:${port}`);
});
