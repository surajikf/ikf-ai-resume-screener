import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '192.168.2.100',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'db_IKF_AI_RESUME',
  user: process.env.DB_USER || 'dbo_IKF_AI_RESUME',
  password: process.env.DB_PASSWORD || 'Vxazm1)zRnR3Ocmm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
}

// Execute query helper
export async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return { success: true, data: results };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
}

// Get connection from pool
export async function getConnection() {
  return await pool.getConnection();
}

export default pool;

