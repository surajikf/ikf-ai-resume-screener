import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read SQL schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    const results = [];
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const result = await query(statement);
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: result.success,
          error: result.error || null,
        });
      }
    }

    const allSuccess = results.every(r => r.success);

    return res.status(allSuccess ? 200 : 500).json({
      success: allSuccess,
      message: allSuccess 
        ? 'Database schema initialized successfully' 
        : 'Some schema statements failed',
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize database schema',
      details: error.message,
    });
  }
}

