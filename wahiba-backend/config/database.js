const mysql = require('mysql2/promise');
require('dotenv').config();

const parseDbUrl = (url) => {
  const urlPattern = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(urlPattern);
  if (match) {
    return {
      user: match[1],
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
    };
  }
  throw new Error('Invalid database URL format');
};

const buildConfigFromEnv = () => ({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wahiba_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
});

let dbConfig;
if (process.env.DATABASE_URL) {
  dbConfig = parseDbUrl(process.env.DATABASE_URL);
} else {
  dbConfig = buildConfigFromEnv();
}

// Create the connection pool
const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  port: dbConfig.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
