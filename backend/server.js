const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const { checkDatabaseConnection } = require("./db.js");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
const indexController = require("./controllers/IndexController.js");

app.use("/api", indexController);

app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Server running on http://localhost:${port}`);
});

process.on("uncaughtException", (err, origin) => {
  console.log(`Caught exception: ${err}\n Exception origin: ${origin}`);
});
