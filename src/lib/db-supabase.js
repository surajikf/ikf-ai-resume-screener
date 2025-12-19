import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[db-supabase] Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection function
export async function testConnection() {
  try {
    // Simple connection test - just ping Supabase
    const { data, error } = await supabase.from('settings').select('id').limit(1);
    if (error) {
      // PGRST116 = table doesn't exist (which is ok for initial setup)
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return { 
          success: true, 
          message: 'Supabase connected (tables need to be created - run supabase-tables.sql)' 
        };
      }
      throw error;
    }
    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    console.error('[db-supabase] Connection test error:', error);
    return {
      success: false,
      message: error.message || 'Supabase connection failed',
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }
}

// Execute query helper - converts SQL-like operations to Supabase
export async function query(sql, params = []) {
  try {
    // Parse SQL to determine operation type
    const sqlUpper = sql.trim().toUpperCase();
    
    // COUNT queries (special handling)
    if (sqlUpper.startsWith('SELECT COUNT')) {
      const tableMatch = sql.match(/FROM\s+[`"]?(\w+)[`"]?/i);
      if (!tableMatch) {
        throw new Error('Could not parse table name from COUNT SQL');
      }
      const tableName = tableMatch[1];
      
      // Check for DISTINCT
      const distinctMatch = sql.match(/COUNT\s*\(\s*DISTINCT\s+(\w+)\s*\)/i);
      if (distinctMatch) {
        // For DISTINCT COUNT, we need to select distinct values and count them
        let countQuery = supabase.from(tableName).select(distinctMatch[1], { count: 'exact', head: true });
        
        // Handle WHERE clauses
        if (sql.includes('WHERE')) {
          const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
          if (whereMatch) {
            const whereClause = whereMatch[1];
            let paramIndex = 0;
            const conditions = whereClause.split(/\s+AND\s+/i);
            for (const condition of conditions) {
              const keyMatch = condition.match(/(\w+)\s*=\s*\?/);
              if (keyMatch && params.length > paramIndex) {
                countQuery = countQuery.eq(keyMatch[1], params[paramIndex]);
                paramIndex++;
              }
            }
          }
        }
        
        const { count, error } = await countQuery;
        if (error) throw error;
        return { success: true, data: [{ total: count || 0 }] };
      }
      
      // Regular COUNT(*)
      let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });
      
      // Handle WHERE clauses
      if (sql.includes('WHERE')) {
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
        if (whereMatch) {
          const whereClause = whereMatch[1];
          let paramIndex = 0;
          const conditions = whereClause.split(/\s+AND\s+/i);
          for (const condition of conditions) {
            const keyMatch = condition.match(/(\w+)\s*=\s*\?/);
            if (keyMatch && params.length > paramIndex) {
              countQuery = countQuery.eq(keyMatch[1], params[paramIndex]);
              paramIndex++;
            }
            const likeMatch = condition.match(/(\w+)\s+LIKE\s+\?/i);
            if (likeMatch && params.length > paramIndex) {
              countQuery = countQuery.ilike(likeMatch[1], params[paramIndex]);
              paramIndex++;
            }
          }
        }
      }
      
      const { count, error } = await countQuery;
      if (error) throw error;
      return { success: true, data: [{ total: count || 0, count: count || 0 }] };
    }
    
    // SELECT queries
    if (sqlUpper.startsWith('SELECT')) {
      // Check for JOINs - these need special handling
      if (sql.includes('JOIN') || sql.includes('INNER JOIN') || sql.includes('LEFT JOIN')) {
        // For JOIN queries, Supabase uses foreign table references in select()
        // Example: select('*, candidates(*), job_descriptions(*)')
        const fromMatch = sql.match(/FROM\s+[`"]?(\w+)[`"]?\s+[`"]?(\w+)?[`"]?/i);
        
        if (!fromMatch) {
          throw new Error('Could not parse table name from SQL with JOIN');
        }
        
        const mainTable = fromMatch[1];
        const mainAlias = fromMatch[2] || mainTable;
        
        // Parse JOINs to build Supabase foreign table references
        // Supabase uses the actual table name, not aliases, for foreign table references
        const joinMatches = Array.from(sql.matchAll(/(?:INNER|LEFT)\s+JOIN\s+[`"]?(\w+)[`"]?\s+[`"]?(\w+)?[`"]?\s+ON\s+([^WHERE\s]+)/gi));
        const foreignTableMap = {}; // Map alias -> actual table name
        
        for (const match of joinMatches) {
          const joinTable = match[1]; // Actual table name
          const joinAlias = match[2] || joinTable; // Alias used in SQL
          foreignTableMap[joinAlias] = joinTable; // Map alias to table name
        }
        
        // Build Supabase select string with foreign table references
        // Format: '*, table_name1(*), table_name2(*)'
        // Use actual table names, not aliases
        let selectString = '*';
        const foreignTableNames = Object.values(foreignTableMap);
        if (foreignTableNames.length > 0) {
          selectString += ', ' + foreignTableNames.map(t => `${t}(*)`).join(', ');
        }
        
        // Also include specific columns if needed
        const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
        if (selectMatch) {
          // Parse columns and map them to Supabase format
          const columns = selectMatch[1].split(',').map(col => {
            const trimmed = col.trim();
            // Handle "table.column as alias" or "table.column"
            const aliasMatch = trimmed.match(/(\w+)\.(\w+)(?:\s+as\s+(\w+))?/i);
            if (aliasMatch) {
              const table = aliasMatch[1];
              const column = aliasMatch[2];
              const alias = aliasMatch[3];
              // If it's a foreign table column, use foreign_table(column) format
              // Check if table is in foreignTableMap (by alias) or foreignTableNames (by actual name)
              const isForeignTable = foreignTableMap[table] || foreignTableNames.includes(table);
              if (isForeignTable) {
                const actualTableName = foreignTableMap[table] || table;
                return alias ? `${actualTableName}(${column})` : `${actualTableName}(${column})`;
              }
              // Main table column
              return column;
            }
            return trimmed.replace(/[`"]/g, '');
          });
          
          // For now, use the foreign table approach which is simpler
          // Supabase will return nested objects for foreign tables
        }
        
        // Build Supabase query with foreign table references
        let query = supabase.from(mainTable).select(selectString);
        
        // Handle WHERE clauses
        if (sql.includes('WHERE')) {
          const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
          if (whereMatch) {
            const whereClause = whereMatch[1];
            // Handle multiple WHERE conditions
            const conditions = whereClause.split(/\s+AND\s+/i);
            let paramIndex = 0;
            
            for (const condition of conditions) {
              // Handle = ? (can be table.column = ? or just column = ?)
              const eqMatch = condition.match(/(\w+(?:\.\w+)?)\s*=\s*\?/);
              if (eqMatch && params.length > paramIndex) {
                const fullColumn = eqMatch[1];
                const column = fullColumn.split('.').pop(); // Get column name
                // For main table columns, use direct column name
                // For foreign table columns, we need to filter differently
                // For now, filter on main table columns only
                if (!fullColumn.includes('.')) {
                  query = query.eq(column, params[paramIndex]);
                } else {
                  // For foreign table columns, we'll need to filter after fetching
                  // This is a limitation - Supabase doesn't support filtering on foreign table columns directly
                  // We'll filter in memory if needed
                }
                paramIndex++;
              }
              // Handle LIKE ?
              const likeMatch = condition.match(/(\w+(?:\.\w+)?)\s+LIKE\s+\?/i);
              if (likeMatch && params.length > paramIndex) {
                const fullColumn = likeMatch[1];
                const column = fullColumn.split('.').pop();
                if (!fullColumn.includes('.')) {
                  query = query.ilike(column, params[paramIndex]);
                }
                paramIndex++;
              }
            }
          }
        }
        
        // Handle ORDER BY
        const orderMatch = sql.match(/ORDER\s+BY\s+(\w+(?:\.\w+)?)\s+(ASC|DESC)/i);
        if (orderMatch) {
          const fullColumn = orderMatch[1];
          const column = fullColumn.split('.').pop();
          // Only order by main table columns
          if (!fullColumn.includes('.')) {
            query = query.order(column, { ascending: orderMatch[2].toUpperCase() === 'ASC' });
          }
        }
        
        // Handle LIMIT and OFFSET
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          query = query.limit(parseInt(limitMatch[1]));
        }
        
        const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
        if (offsetMatch) {
          const limit = limitMatch ? parseInt(limitMatch[1]) : 1000;
          query = query.range(parseInt(offsetMatch[1]), parseInt(offsetMatch[1]) + limit - 1);
        }
        
        const { data, error } = await query;
        if (error) {
          // If foreign table references fail, try a simpler approach
          console.warn('[db-supabase] JOIN query failed, trying fallback:', error.message);
          // Fallback: query main table only and let the app handle joins
          const fallbackQuery = supabase.from(mainTable).select('*');
          const { data: fallbackData, error: fallbackError } = await fallbackQuery;
          if (fallbackError) throw fallbackError;
          return { success: true, data: fallbackData || [] };
        }
        
        // Transform Supabase nested structure to flat structure
        // Supabase returns: [{ id: 1, candidates: {...}, job_descriptions: {...} }]
        // We need: [{ id: 1, candidate_name: '...', job_title: '...' }]
        if (data && data.length > 0 && Object.keys(foreignTableMap).length > 0) {
          const transformed = data.map(row => {
            const flat = { ...row };
            
            // Process each foreign table
            Object.entries(foreignTableMap).forEach(([alias, tableName]) => {
              // Supabase returns data using the actual table name, not alias
              const foreignData = row[tableName];
              
              if (foreignData && typeof foreignData === 'object') {
                // Handle both single object (LEFT JOIN) and array (if multiple matches)
                const foreignRows = Array.isArray(foreignData) ? foreignData : [foreignData];
                
                if (foreignRows.length > 0) {
                  const foreignRow = foreignRows[0]; // Take first match
                  
                  // Flatten foreign table data with proper column name mapping
                  Object.entries(foreignRow).forEach(([key, value]) => {
                    // Map based on table name
                    if (tableName === 'candidates') {
                      // Map candidates columns to expected format
                      flat[`candidate_${key}`] = value;
                      // Also support alias format (c.candidate_name)
                      if (alias === 'c') {
                        flat[key] = value;
                      }
                    } else if (tableName === 'job_descriptions') {
                      // Map job_descriptions columns
                      flat[`job_${key}`] = value;
                      if (key === 'title') {
                        flat.job_title = value;
                      }
                      // Also support alias format (jd.title)
                      if (alias === 'jd') {
                        flat[key] = value;
                      }
                    } else {
                      // Generic mapping
                      flat[`${alias}_${key}`] = value;
                    }
                  });
                }
                
                // Remove the nested object
                delete flat[tableName];
              }
            });
            
            return flat;
          });
          return { success: true, data: transformed };
        }
        
        return { success: true, data: data || [] };
      }
      
      // Simple SELECT without JOINs
      const tableMatch = sql.match(/FROM\s+[`"]?(\w+)[`"]?/i);
      if (!tableMatch) {
        throw new Error('Could not parse table name from SQL');
      }
      const tableName = tableMatch[1];
      
      // Parse SELECT columns
      const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
      let selectColumns = '*';
      if (selectMatch) {
        selectColumns = selectMatch[1]
          .split(',')
          .map(col => col.trim().replace(/[`"]/g, '').split(' as ')[0].split(' AS ')[0])
          .join(',');
      }
      
      // Build Supabase query
      let query = supabase.from(tableName).select(selectColumns);
      
      // Handle WHERE clauses (enhanced support)
      if (sql.includes('WHERE')) {
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
        if (whereMatch) {
          const whereClause = whereMatch[1];
          let paramIndex = 0;
          
          // Handle multiple conditions with AND
          const conditions = whereClause.split(/\s+AND\s+/i);
          for (const condition of conditions) {
            // Simple WHERE key = ? support
            const keyMatch = condition.match(/(\w+)\s*=\s*\?/);
            if (keyMatch && params.length > paramIndex) {
              query = query.eq(keyMatch[1], params[paramIndex]);
              paramIndex++;
            }
            // Handle LIKE
            const likeMatch = condition.match(/(\w+)\s+LIKE\s+\?/i);
            if (likeMatch && params.length > paramIndex) {
              query = query.ilike(likeMatch[1], params[paramIndex]);
              paramIndex++;
            }
            // Handle IN clause
            const inMatch = condition.match(/(\w+)\s+IN\s*\([?,\s]+\)/i);
            if (inMatch && params.length > paramIndex) {
              // Count how many ? in the IN clause
              const inClause = condition.match(/IN\s*\(([^)]+)\)/i);
              if (inClause) {
                const paramCount = (inClause[1].match(/\?/g) || []).length;
                const inParams = params.slice(paramIndex, paramIndex + paramCount);
                query = query.in(inMatch[1], inParams);
                paramIndex += paramCount;
              }
            }
          }
        }
      }
      
      // Handle LIMIT
      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        query = query.limit(parseInt(limitMatch[1]));
      }
      
      // Handle OFFSET
      const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
      if (offsetMatch) {
        const limit = limitMatch ? parseInt(limitMatch[1]) : 1000;
        query = query.range(parseInt(offsetMatch[1]), parseInt(offsetMatch[1]) + limit - 1);
      }
      
      // Handle ORDER BY
      const orderMatch = sql.match(/ORDER\s+BY\s+(\w+(?:\.\w+)?)\s+(ASC|DESC)/i);
      if (orderMatch) {
        const column = orderMatch[1].split('.').pop(); // Handle table.column
        query = query.order(column, { ascending: orderMatch[2].toUpperCase() === 'ASC' });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return { success: true, data: data || [] };
    }
    
    // INSERT queries
    if (sqlUpper.startsWith('INSERT')) {
      const tableMatch = sql.match(/INTO\s+[`"]?(\w+)[`"]?/i);
      if (!tableMatch) {
        throw new Error('Could not parse table name from INSERT SQL');
      }
      const tableName = tableMatch[1];
      
      // Extract column names and values
      const columnsMatch = sql.match(/\(([^)]+)\)/);
      const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/);
      
      if (!columnsMatch || !valuesMatch) {
        throw new Error('Could not parse INSERT columns/values');
      }
      
      const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/[`"]/g, ''));
      
      // Use params if provided, otherwise parse from SQL
      let values;
      if (params.length > 0) {
        values = params;
      } else {
        values = valuesMatch[1].split(',').map(v => {
          const trimmed = v.trim();
          if (trimmed === '?') return null;
          if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
            return trimmed.slice(1, -1);
          }
          // Try to parse JSON
          try {
            return JSON.parse(trimmed);
          } catch {
            return trimmed;
          }
        });
      }
      
      // Build object
      const record = {};
      columns.forEach((col, idx) => {
        let value = values[idx];
        
        // Handle Buffer objects for binary columns (like file_content)
        // Convert Buffer to hex format for PostgreSQL BYTEA
        if (Buffer.isBuffer(value)) {
          // For PostgreSQL BYTEA, we need to pass as hex string with \x prefix
          // But Supabase JS client expects base64 or we can use a special format
          // Actually, Supabase handles Buffers, but we'll convert to hex for safety
          value = '\\x' + value.toString('hex');
          console.log(`[db-supabase] Converted Buffer to hex for column ${col}, length: ${value.length}`);
        } else if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
          // Already a JSON-serialized Buffer - convert to hex
          const buffer = Buffer.from(value.data);
          value = '\\x' + buffer.toString('hex');
          console.log(`[db-supabase] Converted JSON Buffer to hex for column ${col}`);
        }
        
        // Parse JSON strings
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value);
          } catch {}
        }
        record[col] = value;
      });
      
      // Handle ON DUPLICATE KEY UPDATE (UPSERT) - for settings table
      if (sql.includes('ON DUPLICATE KEY UPDATE') || sql.includes('ON CONFLICT')) {
        // For settings table, use setting_key as conflict column
        const conflictColumn = tableName === 'settings' ? 'setting_key' : columns[0];
        const { data, error } = await supabase
          .from(tableName)
          .upsert(record, { onConflict: conflictColumn });
        if (error) throw error;
        return { success: true, data: data || [record] };
      }
      
      const { data, error } = await supabase.from(tableName).insert(record).select();
      if (error) throw error;
      return { success: true, data: data || [record] };
    }
    
    // UPDATE queries
    if (sqlUpper.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+[`"]?(\w+)[`"]?/i);
      if (!tableMatch) {
        throw new Error('Could not parse table name from UPDATE SQL');
      }
      const tableName = tableMatch[1];
      
      // Extract SET clause
      const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
      if (!setMatch) {
        throw new Error('Could not parse SET clause');
      }
      
      const updates = {};
      const setClause = setMatch[1];
      const assignments = setClause.split(',').map(a => a.trim());
      let paramIndex = 0;
      
      assignments.forEach(assign => {
        const [key, value] = assign.split('=').map(s => s.trim());
        const cleanKey = key.replace(/[`"]/g, '');
        
        if (value === '?') {
          updates[cleanKey] = params[paramIndex];
          paramIndex++;
        } else if (value === 'NOW()' || value === 'CURRENT_TIMESTAMP') {
          updates[cleanKey] = new Date().toISOString();
        } else if (value.startsWith('COALESCE')) {
          // Handle COALESCE(?, column) - use the first param
          const coalesceMatch = value.match(/COALESCE\s*\(\s*\?/);
          if (coalesceMatch && params.length > paramIndex) {
            updates[cleanKey] = params[paramIndex] || null;
            paramIndex++;
          }
        } else if (value.match(/^\?/)) {
          // Handle ? at start
          updates[cleanKey] = params[paramIndex];
          paramIndex++;
        } else {
          // Remove quotes and use as-is
          updates[cleanKey] = value.replace(/^['"]|['"]$/g, '');
        }
      });
      
      // Extract WHERE clause
      let query = supabase.from(tableName).update(updates);
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        let whereParamIndex = paramIndex; // Continue from where SET params ended
        
        // Handle multiple WHERE conditions
        const conditions = whereClause.split(/\s+AND\s+/i);
        for (const condition of conditions) {
          const keyMatch = condition.match(/(\w+)\s*=\s*\?/);
          if (keyMatch && params.length > whereParamIndex) {
            query = query.eq(keyMatch[1], params[whereParamIndex]);
            whereParamIndex++;
          }
        }
      }
      
      const { data, error } = await query.select();
      if (error) throw error;
      return { success: true, data: data || [] };
    }
    
    // DELETE queries
    if (sqlUpper.startsWith('DELETE')) {
      const tableMatch = sql.match(/FROM\s+[`"]?(\w+)[`"]?/i);
      if (!tableMatch) {
        throw new Error('Could not parse table name from DELETE SQL');
      }
      const tableName = tableMatch[1];
      
      // Build Supabase delete query
      let deleteQuery = supabase.from(tableName).delete();
      
      // Handle WHERE clause
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        let paramIndex = 0;
        
        // Handle multiple WHERE conditions
        const conditions = whereClause.split(/\s+AND\s+/i);
        for (const condition of conditions) {
          const keyMatch = condition.match(/(\w+)\s*=\s*\?/);
          if (keyMatch && params.length > paramIndex) {
            deleteQuery = deleteQuery.eq(keyMatch[1], params[paramIndex]);
            paramIndex++;
          }
        }
      }
      
      // For DELETE without WHERE (DELETE FROM table), we need to delete all records
      // Supabase requires at least one filter for security, so we'll fetch all IDs first, then delete in batches
      if (!whereMatch) {
        console.log('[db-supabase] DELETE without WHERE - fetching all records first...');
        // First, get all IDs
        const { data: allRecords, error: fetchError } = await supabase
          .from(tableName)
          .select('id')
          .limit(10000); // Supabase limit
        
        if (fetchError) throw fetchError;
        
        if (allRecords && allRecords.length > 0) {
          // Delete in batches (Supabase allows up to 1000 items in .in())
          const batchSize = 1000;
          let deletedCount = 0;
          
          for (let i = 0; i < allRecords.length; i += batchSize) {
            const batch = allRecords.slice(i, i + batchSize);
            const ids = batch.map(r => r.id).filter(id => id != null);
            
            if (ids.length > 0) {
              const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .in('id', ids);
              
              if (deleteError) throw deleteError;
              deletedCount += ids.length;
            }
          }
          
          console.log(`[db-supabase] Deleted ${deletedCount} records from ${tableName}`);
          return { success: true, data: [], affectedRows: deletedCount };
        } else {
          // No records to delete
          return { success: true, data: [], affectedRows: 0 };
        }
      } else {
        // DELETE with WHERE clause
        const { data, error } = await deleteQuery;
        if (error) throw error;
        
        // Return success with affected rows count
        return { success: true, data: data || [], affectedRows: Array.isArray(data) ? data.length : 0 };
      }
    }
    
    // CREATE TABLE (for migrations)
    if (sqlUpper.startsWith('CREATE TABLE')) {
      // Supabase tables should be created via SQL editor or migrations
      // This is a no-op in runtime, but we'll log it
      console.log('[db-supabase] CREATE TABLE detected. Please create tables via Supabase SQL Editor.');
      return { success: true, data: [] };
    }
    
    throw new Error(`Unsupported SQL operation: ${sqlUpper.substring(0, 20)}...`);
  } catch (error) {
    console.error('[db-supabase] Query error:', error);
    return {
      success: false,
      error: error.message || 'Query failed',
    };
  }
}

// Get connection (for compatibility with existing code)
// Supabase doesn't use explicit connections, but we need to support the MySQL-style API
export async function getConnection() {
  // Store queries for transaction-like behavior
  const queries = [];
  let inTransaction = false;
  
  return {
    execute: async (sql, params) => {
      const result = await query(sql, params);
      
      // For INSERT queries, MySQL returns insertId - we need to simulate this
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        // Get the inserted record's ID
        if (result.data && result.data.length > 0) {
          const insertedRecord = result.data[0];
          // Return MySQL-style result: [{ insertId: id, affectedRows: 1 }]
          return [{
            insertId: insertedRecord.id || insertedRecord[Object.keys(insertedRecord)[0]],
            affectedRows: 1,
            ...insertedRecord
          }];
        }
        // If no data returned, try to fetch it
        const tableMatch = sql.match(/INTO\s+[`"]?(\w+)[`"]?/i);
        if (tableMatch) {
          // Try to get the last inserted record
          const { data: lastRecord } = await supabase
            .from(tableMatch[1])
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();
          
          if (lastRecord) {
            return [{
              insertId: lastRecord.id,
              affectedRows: 1
            }];
          }
        }
        return [{ insertId: null, affectedRows: 1 }];
      }
      
      // For SELECT queries, return data array
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return [result.data || []];
      }
      
      // For UPDATE/DELETE, return affected rows
      if (sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE')) {
        return [{
          affectedRows: result.data?.length || 0,
          changedRows: result.data?.length || 0
        }];
      }
      
      return [result.data || []];
    },
    beginTransaction: async () => {
      inTransaction = true;
      queries.length = 0; // Clear previous queries
    },
    commit: async () => {
      inTransaction = false;
      queries.length = 0;
    },
    rollback: async () => {
      inTransaction = false;
      queries.length = 0;
    },
    release: async () => {
      inTransaction = false;
      queries.length = 0;
    },
  };
}

// Direct Supabase client access for complex queries
export { supabase };

export default supabase;

