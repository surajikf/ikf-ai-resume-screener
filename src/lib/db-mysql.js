import mysql from 'mysql2/promise';

// Database connection configuration (optimized for performance)
// All credentials must be provided via environment variables
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('[db-mysql] Missing required environment variables:', missingVars.join(', '));
  console.error('[db-mysql] Please set DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD in your environment variables.');
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 2, // Very low limit to prevent "too many connections" error
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  // Performance optimizations
  acquireTimeout: 20000, // 20 seconds
  timeout: 20000, // 20 seconds
  reconnect: true,
  // Enable query result caching
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  // Connection pool optimizations
  multipleStatements: false,
  // Idle timeout - close idle connections after 30 seconds
  idleTimeout: 30000,
};

// Create connection pool only if required vars are present
let pool = null;
if (missingVars.length === 0) {
  pool = mysql.createPool(dbConfig);
} else {
  console.warn('[db-mysql] Connection pool not created due to missing environment variables.');
}

// Function to reset the connection pool (close all connections and recreate)
export async function resetPool() {
  try {
    if (pool) {
      await pool.end();
    }
  } catch (error) {
    console.error('[db] Error closing pool:', error);
  }
  
  // Recreate pool
  pool = mysql.createPool(dbConfig);
  console.log('[db] Connection pool reset');
}

// Get pool statistics
export function getPoolStats() {
  return {
    totalConnections: pool.pool?._allConnections?.length || 0,
    freeConnections: pool.pool?._freeConnections?.length || 0,
    queueLength: pool.pool?._connectionQueue?.length || 0,
  };
}

// Test connection function with retry logic
export async function testConnection(retryCount = 0) {
  if (!pool) {
    return { 
      success: false, 
      message: 'Database connection pool not initialized. Please set DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD environment variables.' 
    };
  }
  
  let connection = null;
  const maxRetries = 2;
  
  try {
    connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    connection = null;
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    console.error('[db] Connection test error:', error);
    
    // If "too many connections" error and we haven't retried yet, reset pool and retry
    if (error.code === 'ER_CON_COUNT_ERROR' && retryCount < maxRetries) {
      console.log('[db] Too many connections detected, resetting pool...');
      await resetPool();
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return testConnection(retryCount + 1);
    }
    
    // Always release connection if we have one
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('[db] Error releasing connection:', releaseError);
      }
    }
    
    return { 
      success: false, 
      message: error.message || 'Database connection failed',
      error: {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage || error.message
      }
    };
  }
}

// Execute query helper with proper connection management
export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database connection pool not initialized. Please set DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD environment variables.');
  }
  let connection = null;
  try {
    const [results] = await pool.execute(sql, params);
    return { success: true, data: results };
  } catch (error) {
    console.error('[db] Query error:', error);
    
    // If "too many connections" error, try resetting pool once
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.log('[db] Too many connections in query, resetting pool...');
      try {
        await resetPool();
        // Retry the query once after reset
        const [results] = await pool.execute(sql, params);
        return { success: true, data: results };
      } catch (retryError) {
        return { success: false, error: retryError.message };
      }
    }
    
    return { success: false, error: error.message };
  }
}

// Get connection from pool
export async function getConnection() {
  return await pool.getConnection();
}

export default pool;



