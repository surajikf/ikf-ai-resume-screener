import { query, testConnection } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Test connection first
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: connectionTest.message,
      });
    }

    // Read the enhanced schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema-enhancements.sql');
    let schemaSQL;
    
    try {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    } catch (fileError) {
      return res.status(500).json({
        success: false,
        error: 'Enhanced schema file not found',
        details: fileError.message,
      });
    }

    // Clean SQL (remove comments)
    let cleanSQL = schemaSQL.replace(/--.*$/gm, '');
    cleanSQL = cleanSQL.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split by semicolon and filter
    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        const trimmed = stmt.trim();
        return trimmed.length > 0 && trimmed.length > 10;
      });

    const results = [];
    const errors = [];

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const result = await query(statement);
          if (result.success) {
            results.push({ 
              statement: statement.substring(0, 80) + '...', 
              status: 'success' 
            });
          } else {
            // Ignore "already exists" or "duplicate column" errors
            if (result.error && (
              result.error.includes('already exists') || 
              result.error.includes('Duplicate column') ||
              result.error.includes('Duplicate key')
            )) {
              results.push({ 
                statement: statement.substring(0, 80) + '...', 
                status: 'already exists' 
              });
            } else {
              errors.push({ 
                statement: statement.substring(0, 80) + '...', 
                error: result.error 
              });
            }
          }
        } catch (err) {
          // Ignore "already exists" or "duplicate column" errors
          if (err.message && (
            err.message.includes('already exists') || 
            err.message.includes('Duplicate column') ||
            err.message.includes('Duplicate key')
          )) {
            results.push({ 
              statement: statement.substring(0, 80) + '...', 
              status: 'already exists' 
            });
          } else {
            errors.push({ 
              statement: statement.substring(0, 80) + '...', 
              error: err.message 
            });
          }
        }
      }
    }

    // Verify all tables exist
    const tablesCheck = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    const allTables = tablesCheck.success ? tablesCheck.data.map(t => t.TABLE_NAME) : [];

    return res.status(200).json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? 'Enhanced database tables created successfully' 
        : 'Enhanced tables created with some errors (some may already exist)',
      results,
      errors: errors.length > 0 ? errors : undefined,
      tables: allTables,
      tableCount: allTables.length,
      newTables: [
        'activity_logs',
        'candidate_notes',
        'resume_files',
        'message_templates',
        'candidate_tags',
        'candidate_tag_mappings',
        'search_history'
      ],
    });
  } catch (error) {
    console.error('Enhanced schema initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create enhanced database tables',
      details: error.message,
    });
  }
}

