const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { checkDatabaseConnection } = require("./db.js");

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
const indexController = require("./controllers/IndexController.js");
const importController = require("./controllers/ImportController.js");

app.use("/api", indexController);
app.use("/import-gtfs", importController);

app.listen(port, () => {
  checkDatabaseConnection();
  console.log(`Server running on http://localhost:${port}`);
});
