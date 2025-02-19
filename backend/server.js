const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./db.js");
const importGTFS = require("./gtfsImport.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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

app.post("/import-gtfs", upload.single("file"), async (req, res) => {
  try {
    const zipFilePath = req.file.path;
    console.log("Yüklenen dosya yolu:", zipFilePath);
    await importGTFS(zipFilePath);
    res.status(200).send("GTFS verisi başarıyla içe aktarıldı!");
  } catch (error) {
    console.error("Veri içe aktarma hatası:", error);
    res.status(500).send("GTFS verisi içe aktarılırken bir hata oluştu.");
  }
});

const indexController = require("./controllers/IndexController.js");
app.use("/api",indexController);


app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Sunucu ${port} portunda çalışıyor`);
});
