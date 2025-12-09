// Database adapter - switch between MySQL and Supabase
// Set USE_SUPABASE=true in environment variables to use Supabase

import * as supabaseModule from './db-supabase';
import * as mysqlModule from './db-mysql';

const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

// Re-export all functions from the selected module
const dbModule = useSupabase ? supabaseModule : mysqlModule;

if (useSupabase) {
  console.log('[db] Using Supabase database');
} else {
  console.log('[db] Using MySQL database');
}

// Export all common functions
export const query = dbModule.query;
export const getConnection = dbModule.getConnection;
export const testConnection = dbModule.testConnection;

// Export MySQL-specific functions (will be undefined for Supabase, which is fine)
export const resetPool = dbModule.resetPool;
export const getPoolStats = dbModule.getPoolStats;

// Export default (pool for MySQL, supabase client for Supabase)
export default useSupabase ? (dbModule.supabase || dbModule.default) : (dbModule.pool || dbModule.default);
