const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

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

module.exports = { pool, checkDatabaseConnection };
